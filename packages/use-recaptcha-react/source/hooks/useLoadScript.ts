import { useEffect, useId, useState } from "react";

type TScriptStatus = "error" | "success" | "loading";

type ScriptManifest = {
  id: string;
  consumers: Set<string>;
  status: TScriptStatus;
  script: HTMLScriptElement | null;
};

type UseLoadScriptOptions = {
  onUnload?: () => void;
};

const scriptManifest = new Map<string, ScriptManifest>();

export const useLoadScript = (
  src = "",
  id = "",
  options: UseLoadScriptOptions = {},
) => {
  const hookId = useId();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) {
      console.error(new Error("No source provided, unable to load script!"));
      return;
    }

    if (!id) {
      console.error(new Error("No id provided!"));
      return;
    }

    const scriptMetadata = scriptManifest.get(id);

    if (scriptMetadata) {
      scriptMetadata.consumers.add(hookId);
      setLoaded(true);
    } else {
      const script = document.createElement("script");

      scriptManifest.set(id, {
        status: "loading",
        consumers: new Set(),
        script,
        id,
      });

      script.setAttribute("data-loaded-id", id);
      script.src = src;
      script.async = true;
      script.onload = () => {
        const data = scriptManifest.get(id);

        if (data) {
          data.status = "success";
          data.consumers.add(hookId);
        }

        setLoaded(true);
      };

      script.onerror = (err) => {
        const data = scriptManifest.get(id);

        if (data) {
          data.consumers.add(hookId);
          data.status = "error";
        }

        console.error("Failed to load script", err);
        setLoaded(true);
      };

      document.body.appendChild(script);
    }

    return () => {
      const scriptMetadata = scriptManifest.get(id);

      if (scriptMetadata) {
        scriptMetadata.consumers.delete(hookId);

        if (scriptMetadata.consumers.size !== 0) return;

        if (scriptMetadata.script) {
          scriptManifest.delete(id);
          document.body.removeChild(scriptMetadata.script);
          options?.onUnload?.();
        }
      }
    };
  }, [src, id, hookId, options]);

  return loaded;
};
