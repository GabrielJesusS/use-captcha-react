import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudflareTurnstileProvider } from "./CloudflareTurnstileProvider";

type RenderSettings = {
  callback: (token: string | null) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  "timeout-callback": () => void;
};

function renderSettings(stub: ReturnType<typeof stubTurnstile>) {
  return stub.render.mock.calls[0]?.[1] as RenderSettings;
}

function stubTurnstile() {
  const stub = {
    render: vi.fn(
      (_el: HTMLElement, _settings: Record<string, unknown>) => "widget-1",
    ),
    execute: vi.fn(),
    reset: vi.fn(),
    getResponse: vi.fn(() => "token-value"),
    ready: vi.fn(),
    remove: vi.fn(),
  };
  globalThis.turnstile = stub;
  return stub;
}

afterEach(() => {
  globalThis.turnstile = undefined;
});

describe("CloudflareTurnstileProvider", () => {
  it("throws when no key is provided", () => {
    expect(() => new CloudflareTurnstileProvider("")).toThrow(
      "You must provide an valid key!",
    );
  });

  it("sets its public fields from the constructor", () => {
    const provider = new CloudflareTurnstileProvider("site-key");

    expect(provider.name).toBe("CloudflareTurnstile");
    expect(provider.loadCallback).toBe("onloadTurnstileCallback");
    expect(provider.globalName).toBe("turnstile");
    expect(provider.key).toBe("site-key");
    expect(provider.src).toContain("onload=onloadTurnstileCallback");
  });

  it("renders a wrapper into the target element and calls turnstile.render once", () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");
    const el = document.createElement("div");

    provider.initialize(el);

    expect(turnstile.render).toHaveBeenCalledTimes(1);
    const wrapper = el.querySelector("[data-captcha-initialized]");
    expect(wrapper).not.toBeNull();
    expect(turnstile.render).toHaveBeenCalledWith(
      wrapper,
      expect.objectContaining({ sitekey: "site-key" }),
    );
  });

  it("does not render twice", () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");
    const el = document.createElement("div");

    provider.initialize(el);
    provider.initialize(el);

    expect(turnstile.render).toHaveBeenCalledTimes(1);
  });

  it("getWidget returns the id returned by render", () => {
    stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");
    provider.initialize(document.createElement("div"));

    expect(provider.getWidget()).toBe("widget-1");
  });

  it("execute delegates to turnstile.execute once initialized", () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");
    provider.initialize(document.createElement("div"));

    provider.execute();

    expect(turnstile.execute).toHaveBeenCalledWith("widget-1");
  });

  it("queues execute() called before initialize and fires it once rendered", () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");

    provider.execute();
    expect(turnstile.execute).not.toHaveBeenCalled();

    provider.initialize(document.createElement("div"));

    expect(turnstile.execute).toHaveBeenCalledWith("widget-1");
  });

  it("reset and remove delegate to turnstile once initialized, no-op before", () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");

    provider.reset();
    provider.remove();
    expect(turnstile.reset).not.toHaveBeenCalled();
    expect(turnstile.remove).not.toHaveBeenCalled();

    provider.initialize(document.createElement("div"));
    provider.reset();
    provider.remove();

    expect(turnstile.reset).toHaveBeenCalledWith("widget-1");
    expect(turnstile.remove).toHaveBeenCalledWith("widget-1");
  });

  it("getValue returns the response once initialized, null otherwise", () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");

    expect(provider.getValue()).toBeNull();

    provider.initialize(document.createElement("div"));
    expect(provider.getValue()).toBe("token-value");

    turnstile.getResponse.mockReturnValueOnce("");
    expect(provider.getValue()).toBeNull();
  });

  it("executeAsync resolves with the token from the callback", async () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(turnstile);
    const promise = provider.executeAsync();
    settings.callback("the-token");

    await expect(promise).resolves.toBe("the-token");
  });

  it("executeAsync rejects when the widget errors", async () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(turnstile);
    const promise = provider.executeAsync();
    settings["error-callback"]();

    await expect(promise).rejects.toThrow("Error on Turnstile execution");
  });

  it("calls onChange when the widget reports a token", () => {
    const turnstile = stubTurnstile();
    const onChange = vi.fn();
    const provider = new CloudflareTurnstileProvider("site-key", { onChange });
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(turnstile);
    settings.callback("the-token");

    expect(onChange).toHaveBeenCalledWith("the-token");
  });

  it("calls onErrored when provided", () => {
    const turnstile = stubTurnstile();
    const onErrored = vi.fn();
    const provider = new CloudflareTurnstileProvider("site-key", { onErrored });
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(turnstile);
    settings["error-callback"]();

    expect(onErrored).toHaveBeenCalledTimes(1);
  });

  it("calls onExpired when provided", () => {
    const turnstile = stubTurnstile();
    const onExpired = vi.fn();
    const provider = new CloudflareTurnstileProvider("site-key", { onExpired });
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(turnstile);
    settings["expired-callback"]();

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("resolves a pending executeAsync with null on expiry when no onExpired is set", async () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(turnstile);
    const promise = provider.executeAsync();
    settings["expired-callback"]();

    await expect(promise).resolves.toBeNull();
  });

  it("calls onTimeout when provided", () => {
    const turnstile = stubTurnstile();
    const onTimeout = vi.fn();
    const provider = new CloudflareTurnstileProvider("site-key", { onTimeout });
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(turnstile);
    settings["timeout-callback"]();

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("resolves a pending executeAsync with null on timeout when no onTimeout is set", async () => {
    const turnstile = stubTurnstile();
    const provider = new CloudflareTurnstileProvider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(turnstile);
    const promise = provider.executeAsync();
    settings["timeout-callback"]();

    await expect(promise).resolves.toBeNull();
  });

  it("is a safe no-op when the turnstile global is not defined", () => {
    const provider = new CloudflareTurnstileProvider("site-key");

    expect(() =>
      provider.initialize(document.createElement("div")),
    ).not.toThrow();
    expect(provider.getValue()).toBeNull();
    expect(provider.getWidget()).toBeUndefined();
    expect(() => provider.execute()).not.toThrow();
    expect(() => provider.reset()).not.toThrow();
    expect(() => provider.remove()).not.toThrow();
  });
});
