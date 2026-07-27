import { useEffect, useId, useRef, useState } from "react";

type ScriptStatus = "loading" | "loaded" | "error";

type ScriptManifest = {
  consumers: Set<string>;
  script: HTMLScriptElement | null;
  onLoad: (() => void)[];
  status: ScriptStatus;
};

type UseLoadScriptOptions = {
  onUnload?: () => void;
  globalVariables?: string[];
  loadCallback?: string;
};

export type UseLoadScriptStatus = ScriptStatus;

type WindowWithGlobals = Window & Record<string, unknown>;

const scriptManifest = new Map<string, ScriptManifest>();

export const useLoadScript = (
  src = "",
  options: UseLoadScriptOptions = {},
): UseLoadScriptStatus => {
  const hookId = useId();
  const [status, setStatus] = useState<ScriptStatus>("loading");

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

    // Guards against a hook that joins mid-load (or creates the script)
    // and unmounts before it settles: the eventual join() call becomes a
    // no-op instead of leaking a consumer that can never be cleaned up.
    let cancelled = false;
    let joined = false;

    function isCallbackRegistered() {
      return typeof globalWindow[loadCallback] !== "undefined";
    }

    function checkGlobalVariables() {
      const globalVariables = optionsRef.current.globalVariables;
      if (!globalVariables) return true;

      return globalVariables.every(
        (variable) => typeof globalWindow[variable] !== "undefined",
      );
    }

    function join(metadata: ScriptManifest) {
      if (cancelled) return;
      joined = true;
      metadata.consumers.add(hookId);
      setStatus(metadata.status);
    }

    function settle(metadata: ScriptManifest) {
      for (const callback of metadata.onLoad) callback();
      metadata.onLoad = [];
    }

    let metadata = scriptManifest.get(src);

    // A previously failed attempt for this src is unusable; drop it so a
    // fresh script gets created below instead of leaving the failed one
    // orphaned in the DOM.
    if (metadata?.status === "error") {
      if (metadata.script) document.body.removeChild(metadata.script);
      scriptManifest.delete(src);
      metadata = undefined;
    }

    if (metadata?.status === "loading") {
      const pending = metadata;
      pending.onLoad.push(() => join(pending));
    } else if (metadata?.status === "loaded") {
      if (checkGlobalVariables()) join(metadata);
    } else {
      const script = document.createElement("script");
      const created: ScriptManifest = {
        status: "loading",
        consumers: new Set(),
        onLoad: [],
        script,
      };
      scriptManifest.set(src, created);

      script.setAttribute("data-loaded-id", src);
      script.src = src;
      script.async = true;

      script.onload = () => {
        if (!hasLoadCallback || isCallbackRegistered()) {
          created.status = "loaded";
          settle(created);
          join(created);
          return;
        }

        globalWindow[loadCallback] = () => {
          created.status = "loaded";
          settle(created);
          if (isCallbackRegistered()) delete globalWindow[loadCallback];
          join(created);
        };
      };

      script.onerror = (err) => {
        created.status = "error";
        settle(created);
        console.error("Failed to load script", err);
        join(created);
      };

      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (!joined) return;

      const current = scriptManifest.get(src);
      if (!current) return;

      current.consumers.delete(hookId);
      if (current.consumers.size !== 0) return;

      if (current.script) {
        scriptManifest.delete(src);
        document.body.removeChild(current.script);
      }
      optionsRef.current.onUnload?.();
    };
  }, [src, hookId, hasLoadCallback, loadCallback]);

  return status;
};
