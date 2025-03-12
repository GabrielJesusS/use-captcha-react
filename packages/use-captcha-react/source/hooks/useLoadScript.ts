import { useEffect, useId, useState } from "react";
import hash from "../utils/hash";

type ScriptManifest = {
  id: string;
  consumers: Set<string>;
  script: HTMLScriptElement | null;
  loaded: boolean;
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

    const id = hash(src).toString();

    const scriptMetadata = scriptManifest.get(id);

    if (scriptMetadata?.loaded && loaded && checkGlobalVariables()) {
      return;
    }

    if (scriptMetadata?.loaded && checkGlobalVariables()) {
      scriptMetadata.consumers.add(hookId);
      setLoaded(true);
    } else {
      const script = document.createElement("script");

      scriptManifest.set(id, {
        loaded: false,
        errored: false,
        consumers: new Set(),
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
          data.loaded = true;
          setLoaded(true);
          return;
        }

        if (!isCallbackRegistered() && !data.loaded) {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (<any>window)[loadCallback] = () => {
            data.loaded = true;
            setLoaded(true);
            handleScriptLoad();
          };
        }
      };

      script.onerror = (err) => {
        const data = scriptManifest.get(id);

        if (data) {
          data.consumers.add(hookId);
          data.loaded = false;
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
  }, [src, hookId, options, loaded, hasLoadCallback, loadCallback]);

  return loaded;
};
