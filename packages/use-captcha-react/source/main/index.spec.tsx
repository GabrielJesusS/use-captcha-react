import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CaptchaProvider } from "../@types/CaptchaProvider";
import { CloudflareTurnstileProvider } from "../providers/CloudflareTurnstileProvider";
import { useCaptcha } from "./index";

type FakeOptions = { flag?: boolean };

class FakeProvider implements CaptchaProvider<FakeOptions> {
  static instances: FakeProvider[] = [];

  public name = "Fake";
  public src: string;
  public loadCallback = "";
  public globalName = "__fakeGlobal__";
  public key: string;
  public options?: FakeOptions;

  public initialize = vi.fn();
  public execute = vi.fn();
  public reset = vi.fn();
  public getValue = vi.fn(() => "fake-value");
  public executeAsync = vi.fn(async () => "fake-async-value");

  constructor(key: string, options?: FakeOptions) {
    if (!key) throw new Error("fake provider requires a key");
    this.key = key;
    this.options = options;
    this.src = `https://example.test/fake.js?id=${Math.random().toString(36).slice(2)}`;
    FakeProvider.instances.push(this);
  }

  getWidget() {
    return undefined;
  }
}

type CaptchaResult = ReturnType<typeof useCaptcha<FakeOptions, FakeProvider>>;

function mustGet<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) {
    throw new Error("Expected value to be defined");
  }
  return value;
}

function Harness({
  k,
  options,
  onRender,
}: {
  k: string;
  options?: FakeOptions;
  onRender: (result: CaptchaResult) => void;
}) {
  const result = useCaptcha(FakeProvider, k, options);
  onRender(result);
  const [element] = result;
  return <div ref={element} data-testid="captcha-el" />;
}

function getScript(src: string) {
  return document.body.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
}

function windowCallback(name: string) {
  return (window as unknown as Record<string, (() => void) | undefined>)[name];
}

afterEach(() => {
  FakeProvider.instances = [];
  globalThis.turnstile = undefined;
});

describe("useCaptcha", () => {
  it("keeps the same provider instance across re-renders even though the constructor runs again", () => {
    const seen: FakeProvider[] = [];
    const onRender = ([, , ref]: CaptchaResult) =>
      seen.push(mustGet(ref.current));

    const { rerender } = render(<Harness k="key-1" onRender={onRender} />);
    rerender(
      <Harness k="key-1" options={{ flag: true }} onRender={onRender} />,
    );

    expect(FakeProvider.instances.length).toBeGreaterThan(1);
    expect(seen[0]).toBe(seen[1]);
  });

  it("does not initialize the provider before the script has loaded", () => {
    let captured: FakeProvider | undefined;
    render(
      <Harness
        k="key-1"
        onRender={([, , ref]) => {
          captured = ref.current ?? undefined;
        }}
      />,
    );

    expect(mustGet(captured).initialize).not.toHaveBeenCalled();
  });

  it("initializes the provider once the script loads, with the mounted element", () => {
    let captured: FakeProvider | undefined;
    const { getByTestId } = render(
      <Harness
        k="key-1"
        onRender={([, , ref]) => {
          captured = ref.current ?? undefined;
        }}
      />,
    );
    const provider = mustGet(captured);

    const script = mustGet(getScript(provider.src));
    act(() => {
      script.onload?.(new Event("load"));
    });

    expect(provider.initialize).toHaveBeenCalledTimes(1);
    expect(provider.initialize).toHaveBeenCalledWith(getByTestId("captcha-el"));
  });

  it("does not re-initialize on subsequent re-renders once loaded", () => {
    let captured: FakeProvider | undefined;
    const onRender = ([, , ref]: CaptchaResult) => {
      captured = ref.current ?? undefined;
    };
    const { rerender } = render(<Harness k="key-1" onRender={onRender} />);
    const provider = mustGet(captured);

    const script = mustGet(getScript(provider.src));
    act(() => {
      script.onload?.(new Event("load"));
    });
    expect(provider.initialize).toHaveBeenCalledTimes(1);

    rerender(<Harness k="key-1" onRender={onRender} />);

    expect(provider.initialize).toHaveBeenCalledTimes(1);
  });

  it("delegates execute, reset, getValue and executeAsync to the provider instance", async () => {
    let captured: FakeProvider | undefined;
    let api: CaptchaResult[1] | undefined;
    render(
      <Harness
        k="key-1"
        onRender={([, a, ref]) => {
          api = a;
          captured = ref.current ?? undefined;
        }}
      />,
    );
    const provider = mustGet(captured);
    const methods = mustGet(api);

    act(() => methods.execute());
    act(() => methods.reset());

    expect(provider.execute).toHaveBeenCalledTimes(1);
    expect(provider.reset).toHaveBeenCalledTimes(1);
    expect(methods.getValue()).toBe("fake-value");
    await expect(methods.executeAsync()).resolves.toBe("fake-async-value");
  });

  it("execute, reset, getValue and executeAsync no-op when the provider ref is cleared", async () => {
    let api: CaptchaResult[1] | undefined;
    let ref: CaptchaResult[2] | undefined;
    render(
      <Harness
        k="key-1"
        onRender={([, a, providerRef]) => {
          api = a;
          ref = providerRef;
        }}
      />,
    );
    const methods = mustGet(api);
    (mustGet(ref) as unknown as { current: FakeProvider | null }).current =
      null;

    expect(() => methods.execute()).not.toThrow();
    expect(() => methods.reset()).not.toThrow();
    expect(methods.getValue()).toBeNull();
    await expect(methods.executeAsync()).resolves.toBeNull();
  });

  it("exposes the provider instance via the third tuple element", () => {
    let captured: FakeProvider | undefined;
    render(
      <Harness
        k="key-1"
        onRender={([, , ref]) => {
          captured = ref.current ?? undefined;
        }}
      />,
    );

    expect(captured).toBeInstanceOf(FakeProvider);
  });

  it("propagates a constructor error thrown for an invalid key", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Harness k="" onRender={() => {}} />)).toThrow(
      "fake provider requires a key",
    );

    errorSpy.mockRestore();
  });

  it("wires a real provider end-to-end (smoke test)", () => {
    const turnstileStub = {
      render: vi.fn(
        (_el: HTMLElement, _settings: Record<string, unknown>) => "widget-1",
      ),
      execute: vi.fn(),
      reset: vi.fn(),
      getResponse: vi.fn(() => "token"),
      ready: vi.fn(),
      remove: vi.fn(),
    };
    globalThis.turnstile = turnstileStub;

    function RealHarness() {
      const [element] = useCaptcha(CloudflareTurnstileProvider, "site-key");
      return <div ref={element} />;
    }

    render(<RealHarness />);

    const script = mustGet(
      document.body.querySelector<HTMLScriptElement>(
        'script[src*="challenges.cloudflare.com"]',
      ),
    );
    act(() => {
      script.onload?.(new Event("load"));
      windowCallback("onloadTurnstileCallback")?.();
    });

    expect(turnstileStub.render).toHaveBeenCalledTimes(1);
  });
});
