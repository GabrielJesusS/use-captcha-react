import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLoadScript } from "./useLoadScript";

const uniqueSrc = () =>
  `https://example.test/script.js?id=${Math.random().toString(36).slice(2)}`;

function getScript(src: string) {
  return document.body.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
}

function windowCallback(name: string) {
  return (window as unknown as Record<string, (() => void) | undefined>)[name];
}

describe("useLoadScript", () => {
  it("returns not-loaded before the script loads", () => {
    const { result } = renderHook(() => useLoadScript(uniqueSrc()));

    expect(result.current).toBe("loading");
  });

  it("logs an error and appends no script when src is missing", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const scriptCountBefore = document.body.querySelectorAll(
      "script[data-loaded-id]",
    ).length;

    const { result } = renderHook(() => useLoadScript());

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current).toBe("loading");
    expect(
      document.body.querySelectorAll("script[data-loaded-id]"),
    ).toHaveLength(scriptCountBefore);

    errorSpy.mockRestore();
  });

  it("appends a script tag with the correct src and async attributes", () => {
    const src = uniqueSrc();
    renderHook(() => useLoadScript(src));

    const script = getScript(src);

    expect(script).not.toBeNull();
    expect(script?.async).toBe(true);
  });

  it("becomes loaded once the script fires onload (no loadCallback)", () => {
    const src = uniqueSrc();
    const { result } = renderHook(() => useLoadScript(src));

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });

    expect(result.current).toBe("loaded");
  });

  it("waits for the loadCallback handshake before becoming loaded", () => {
    const src = uniqueSrc();
    const loadCallback = `cb_${Math.random().toString(36).slice(2)}`;
    const { result } = renderHook(() => useLoadScript(src, { loadCallback }));

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });

    expect(result.current).toBe("loading");
    expect(typeof windowCallback(loadCallback)).toBe("function");

    act(() => {
      windowCallback(loadCallback)?.();
    });

    expect(result.current).toBe("loaded");
    expect(windowCallback(loadCallback)).toBeUndefined();
  });

  it("marks errored (not loaded) and logs an error when the script fails to load", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const src = uniqueSrc();
    const { result } = renderHook(() => useLoadScript(src));

    const script = getScript(src);
    act(() => {
      script?.onerror?.(new Event("error"));
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load script",
      expect.anything(),
    );
    expect(result.current).toBe("error");

    errorSpy.mockRestore();
  });

  it("dedupes concurrent consumers of the same src into a single script tag", () => {
    const src = uniqueSrc();
    const { result: first } = renderHook(() => useLoadScript(src));
    const { result: second } = renderHook(() => useLoadScript(src));

    expect(document.body.querySelectorAll(`script[src="${src}"]`)).toHaveLength(
      1,
    );

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });

    expect(first.current).toBe("loaded");
    expect(second.current).toBe("loaded");
  });

  it("a hook that mounts after the script already loaded becomes loaded immediately", () => {
    const src = uniqueSrc();
    renderHook(() => useLoadScript(src));

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });

    const { result: lateJoiner } = renderHook(() => useLoadScript(src));

    expect(lateJoiner.current).toBe("loaded");
    expect(document.body.querySelectorAll(`script[src="${src}"]`)).toHaveLength(
      1,
    );
  });

  it("does not report loaded for a late joiner until its required global variable is present", () => {
    const src = uniqueSrc();
    renderHook(() => useLoadScript(src));

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });

    const { result: lateJoiner } = renderHook(() =>
      useLoadScript(src, { globalVariables: ["__missingGlobal__"] }),
    );

    expect(lateJoiner.current).toBe("loading");
  });

  it("removes the script and calls onUnload when the last consumer unmounts", () => {
    const src = uniqueSrc();
    const onUnload = vi.fn();
    const { result, unmount } = renderHook(() =>
      useLoadScript(src, { onUnload }),
    );

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });
    expect(result.current).toBe("loaded");

    unmount();

    expect(getScript(src)).toBeNull();
    expect(onUnload).toHaveBeenCalledTimes(1);
  });

  it("is a no-op if onload fires again after the script was already cleaned up", () => {
    const src = uniqueSrc();
    const { result, unmount } = renderHook(() => useLoadScript(src));

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });
    expect(result.current).toBe("loaded");

    unmount();
    expect(getScript(src)).toBeNull();

    expect(() => script?.onload?.(new Event("load"))).not.toThrow();
  });

  it("does not remove the script when unmounting before it has loaded", () => {
    const src = uniqueSrc();
    const onUnload = vi.fn();
    const { unmount } = renderHook(() => useLoadScript(src, { onUnload }));

    unmount();

    expect(getScript(src)).not.toBeNull();
    expect(onUnload).not.toHaveBeenCalled();
  });

  it("keeps the script until the last of multiple consumers unmounts", () => {
    const src = uniqueSrc();
    const onUnload = vi.fn();
    const { unmount: unmountFirst } = renderHook(() =>
      useLoadScript(src, { onUnload }),
    );
    const { unmount: unmountSecond } = renderHook(() =>
      useLoadScript(src, { onUnload }),
    );

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });

    unmountFirst();
    expect(getScript(src)).not.toBeNull();
    expect(onUnload).not.toHaveBeenCalled();

    unmountSecond();
    expect(getScript(src)).toBeNull();
    expect(onUnload).toHaveBeenCalledTimes(1);
  });

  it("does not leak a consumer slot when a joiner unmounts before the in-flight load settles", () => {
    const src = uniqueSrc();
    const { result: first, unmount: unmountFirst } = renderHook(() =>
      useLoadScript(src),
    );
    const { unmount: unmountSecond } = renderHook(() => useLoadScript(src));

    unmountSecond();

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });
    expect(first.current).toBe("loaded");

    unmountFirst();

    expect(getScript(src)).toBeNull();
  });

  it("creates a fresh script instead of leaving the failed one orphaned when retried", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const src = uniqueSrc();

    renderHook(() => useLoadScript(src));
    const firstScript = getScript(src);
    act(() => {
      firstScript?.onerror?.(new Event("error"));
    });

    const { result: second } = renderHook(() => useLoadScript(src));

    expect(document.body.querySelectorAll(`script[src="${src}"]`)).toHaveLength(
      1,
    );
    expect(getScript(src)).not.toBe(firstScript);
    expect(second.current).toBe("loading");

    errorSpy.mockRestore();
  });
});
