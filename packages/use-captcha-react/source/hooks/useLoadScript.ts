import { useEffect, useId, useRef, useState } from "react";

type ScriptManifest = {
  id: string;
  consumers: Set<string>;
  script: HTMLScriptElement | null;
  onLoad: (() => void)[];
  loaded: boolean;
  isLoading: boolean;
  errored: boolean;
};

type UseLoadScriptOptions = {
  onUnload?: () => void;
  globalVariables?: string[];
  loadCallback?: string;
};

type WindowWithGlobals = Window & Record<string, unknown>;

const scriptManifest = new Map<string, ScriptManifest>();

export const useLoadScript = (src = "", options: UseLoadScriptOptions = {}) => {
  const hookId = useId();
  const [loaded, setLoaded] = useState(false);

  const loadCallback = options.loadCallback ?? "";

  const hasLoadCallback = !!loadCallback;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!src) {
      console.error(new Error("No source provided, unable to load script!"));
      return;
    }

    const globalWindow = window as WindowWithGlobals;

    function isCallbackRegistered() {
      if (!loadCallback) return true;

      return typeof globalWindow[loadCallback] !== "undefined";
    }

    function handleScriptLoad() {
      if (isCallbackRegistered()) {
        delete globalWindow[loadCallback];
      }
    }

    function checkGlobalVariables() {
      const globalVariables = optionsRef.current.globalVariables;
      if (!globalVariables) return true;

      return globalVariables.every((variable) => {
        return typeof globalWindow[variable] !== "undefined";
      });
    }

    function getMetadata(scriptId: string) {
      return scriptManifest.get(scriptId);
    }

    function setScriptLoaded(scriptId: string) {
      const metadata = getMetadata(scriptId);
      if (metadata) {
        metadata.loaded = true;
        metadata.isLoading = false;
        metadata.onLoad.forEach((cb) => cb());
        metadata.onLoad = [];
        setLoaded(true);
      }
    }

    const id = src;

    const scriptMetadata = scriptManifest.get(id);

    if (scriptMetadata?.loaded && !loaded) {
      setLoaded(true);
    }

    if (scriptMetadata?.isLoading) {
      scriptMetadata.onLoad.push(() => {
        scriptMetadata.consumers.add(hookId);
        setLoaded(true);
      });
      return;
    }

    if (scriptMetadata?.loaded && checkGlobalVariables()) {
      scriptMetadata.consumers.add(hookId);
      setLoaded(true);
    }

    if (!scriptMetadata?.loaded && !scriptMetadata?.isLoading) {
      const script = document.createElement("script");

      scriptManifest.set(id, {
        loaded: false,
        errored: false,
        isLoading: true,
        consumers: new Set(),
        onLoad: [],
        script,
        id,
      });

      script.setAttribute("data-loaded-id", id);
      script.src = src;
      script.async = true;
      script.onload = () => {
        const data = scriptManifest.get(id);

        if (!data) return;

        data.consumers.add(hookId);

        if (!hasLoadCallback) {
          setScriptLoaded(id);
          return;
        }

        if (!isCallbackRegistered() && !data.loaded) {
          globalWindow[loadCallback] = () => {
            setScriptLoaded(id);
            handleScriptLoad();
          };
        }
      };

      script.onerror = (err) => {
        const data = scriptManifest.get(id);

        if (data) {
          data.consumers.add(hookId);
          data.loaded = false;
          data.isLoading = false;
          data.errored = true;
        }

        console.error("Failed to load script", err);
        setLoaded(true);
      };

      document.body.appendChild(script);
    }

    return () => {
      const scriptMetadata = scriptManifest.get(id);
      if (scriptMetadata && scriptMetadata.consumers.size !== 0 && loaded) {
        scriptMetadata.consumers.delete(hookId);

        if (scriptMetadata.consumers.size !== 0) return;

        if (scriptMetadata.script) {
          scriptManifest.delete(id);
          document.body.removeChild(scriptMetadata.script);
          optionsRef.current.onUnload?.();
        }
      }
    };
  }, [src, hookId, loaded, hasLoadCallback, loadCallback]);

  return loaded;
};
