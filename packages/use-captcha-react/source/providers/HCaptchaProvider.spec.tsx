import { afterEach, describe, expect, it, vi } from "vitest";
import { HCaptchaProvider } from "./HCaptchaProvider";

type RenderSettings = {
  callback: (token: string | null) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
};

function renderSettings(stub: ReturnType<typeof stubHcaptcha>) {
  return stub.render.mock.calls[0]?.[1] as RenderSettings;
}

function stubHcaptcha() {
  const stub = {
    render: vi.fn(
      (_el: HTMLElement, _settings: Record<string, unknown>) => "widget-1",
    ),
    execute: vi.fn(),
    reset: vi.fn(),
    getResponse: vi.fn(() => "token-value"),
    ready: vi.fn(),
  };
  globalThis.hcaptcha = stub;
  return stub;
}

afterEach(() => {
  globalThis.hcaptcha = undefined;
});

describe("HCaptchaProvider", () => {
  it("throws when no key is provided", () => {
    expect(() => new HCaptchaProvider("")).toThrow(
      "You must provide an valid key!",
    );
  });

  it("sets its public fields from the constructor", () => {
    const provider = new HCaptchaProvider("site-key");

    expect(provider.name).toBe("HCaptcha");
    expect(provider.loadCallback).toBe("onloadHCaptchaCallback");
    expect(provider.globalName).toBe("hcaptcha");
    expect(provider.key).toBe("site-key");
    expect(provider.src).toContain("onload=onloadHCaptchaCallback");
  });

  it("renders a wrapper into the target element and calls hcaptcha.render once", () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");
    const el = document.createElement("div");

    provider.initialize(el);

    expect(hcaptcha.render).toHaveBeenCalledTimes(1);
    const wrapper = el.querySelector("[data-captcha-initialized]");
    expect(wrapper).not.toBeNull();
    expect(hcaptcha.render).toHaveBeenCalledWith(
      wrapper,
      expect.objectContaining({ sitekey: "site-key" }),
    );
  });

  it("does not render twice", () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");
    const el = document.createElement("div");

    provider.initialize(el);
    provider.initialize(el);

    expect(hcaptcha.render).toHaveBeenCalledTimes(1);
  });

  it("getWidget returns the id returned by render", () => {
    stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");
    provider.initialize(document.createElement("div"));

    expect(provider.getWidget()).toBe("widget-1");
  });

  it("execute delegates to hcaptcha.execute once initialized", () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");
    provider.initialize(document.createElement("div"));

    provider.execute();

    expect(hcaptcha.execute).toHaveBeenCalledWith("widget-1");
  });

  it("queues execute() called before initialize and fires it once rendered", () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");

    provider.execute();
    expect(hcaptcha.execute).not.toHaveBeenCalled();

    provider.initialize(document.createElement("div"));

    expect(hcaptcha.execute).toHaveBeenCalledWith("widget-1");
  });

  it("reset delegates to hcaptcha once initialized, no-op before", () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");

    provider.reset();
    expect(hcaptcha.reset).not.toHaveBeenCalled();

    provider.initialize(document.createElement("div"));
    provider.reset();

    expect(hcaptcha.reset).toHaveBeenCalledWith("widget-1");
  });

  it("getValue returns the response once initialized, null otherwise", () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");

    expect(provider.getValue()).toBeNull();

    provider.initialize(document.createElement("div"));
    expect(provider.getValue()).toBe("token-value");

    hcaptcha.getResponse.mockReturnValueOnce("");
    expect(provider.getValue()).toBeNull();
  });

  it("executeAsync resolves with the token from the callback", async () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(hcaptcha);
    const promise = provider.executeAsync();
    settings.callback("the-token");

    await expect(promise).resolves.toBe("the-token");
  });

  it("executeAsync rejects when the widget errors", async () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(hcaptcha);
    const promise = provider.executeAsync();
    settings["error-callback"]();

    await expect(promise).rejects.toThrow("Error on HCaptcha execution");
  });

  it("calls onExpired when provided", () => {
    const hcaptcha = stubHcaptcha();
    const onExpired = vi.fn();
    const provider = new HCaptchaProvider("site-key", { onExpired });
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(hcaptcha);
    settings["expired-callback"]();

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("resolves a pending executeAsync with null on expiry when no onExpired is set", async () => {
    const hcaptcha = stubHcaptcha();
    const provider = new HCaptchaProvider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(hcaptcha);
    const promise = provider.executeAsync();
    settings["expired-callback"]();

    await expect(promise).resolves.toBeNull();
  });

  it("is a safe no-op when the hcaptcha global is not defined", () => {
    const provider = new HCaptchaProvider("site-key");

    expect(() =>
      provider.initialize(document.createElement("div")),
    ).not.toThrow();
    expect(provider.getValue()).toBeNull();
    expect(provider.getWidget()).toBeUndefined();
    expect(() => provider.execute()).not.toThrow();
    expect(() => provider.reset()).not.toThrow();
  });
});
