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
  it("returns false before the script loads", () => {
    const { result } = renderHook(() => useLoadScript(uniqueSrc()));

    expect(result.current).toBe(false);
  });

  it("logs an error and appends no script when src is missing", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const scriptCountBefore = document.body.querySelectorAll(
      "script[data-loaded-id]",
    ).length;

    const { result } = renderHook(() => useLoadScript());

    expect(errorSpy).toHaveBeenCalled();
    expect(result.current).toBe(false);
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

    expect(result.current).toBe(true);
  });

  it("waits for the loadCallback handshake before becoming loaded", () => {
    const src = uniqueSrc();
    const loadCallback = `cb_${Math.random().toString(36).slice(2)}`;
    const { result } = renderHook(() => useLoadScript(src, { loadCallback }));

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });

    expect(result.current).toBe(false);
    expect(typeof windowCallback(loadCallback)).toBe("function");

    act(() => {
      windowCallback(loadCallback)?.();
    });

    expect(result.current).toBe(true);
    expect(windowCallback(loadCallback)).toBeUndefined();
  });

  it("marks loaded and logs an error when the script fails to load", () => {
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
    expect(result.current).toBe(true);

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

    expect(first.current).toBe(true);
    expect(second.current).toBe(true);
  });

  it("a hook that mounts after the script already loaded becomes loaded immediately", () => {
    const src = uniqueSrc();
    renderHook(() => useLoadScript(src));

    const script = getScript(src);
    act(() => {
      script?.onload?.(new Event("load"));
    });

    const { result: lateJoiner } = renderHook(() => useLoadScript(src));

    expect(lateJoiner.current).toBe(true);
    expect(document.body.querySelectorAll(`script[src="${src}"]`)).toHaveLength(
      1,
    );
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
    expect(result.current).toBe(true);

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
    expect(result.current).toBe(true);

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
});
