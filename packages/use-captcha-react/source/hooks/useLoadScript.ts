import { useEffect, useId, useState } from "react";
import hash from "../utils/hash";

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

const scriptManifest = new Map<string, ScriptManifest>();

export const useLoadScript = (src = "", options: UseLoadScriptOptions = {}) => {
  const hookId = useId();
  const [loaded, setLoaded] = useState(false);

  const loadCallback = options.loadCallback ?? "";

  const hasLoadCallback = !!loadCallback;

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!src) {
      console.error(new Error("No source provided, unable to load script!"));
      return;
    }

    function isCallbackRegistered() {
      if (!loadCallback) return true;

      // biome-ignore lint/suspicious/noExplicitAny: in this case i need to check the variable in the global scope
      return typeof (<any>window)[loadCallback] !== "undefined";
    }

    function handleScriptLoad() {
      if (isCallbackRegistered()) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        delete (<any>window)[loadCallback];
      }
    }

    function checkGlobalVariables() {
      if (!options.globalVariables) return true;

      return options.globalVariables.every((variable) => {
        // biome-ignore lint/suspicious/noExplicitAny: in this case i need to check the variable in the global scope
        return typeof (<any>window)[variable] !== "undefined";
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

    const id = hash(src).toString();

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
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (<any>window)[loadCallback] = () => {
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
          options?.onUnload?.();
        }
      }
    };
  }, [src, hookId, loaded, hasLoadCallback, loadCallback]);

  return loaded;
};
