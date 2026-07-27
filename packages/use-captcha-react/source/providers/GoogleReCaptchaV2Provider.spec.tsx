import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleReCaptchaV2Provider } from "./GoogleReCaptchaV2Provider";

type RenderSettings = {
  callback: (token: string | null) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
};

function renderSettings(stub: ReturnType<typeof stubGrecaptcha>) {
  return stub.render.mock.calls[0]?.[1] as RenderSettings;
}

function stubGrecaptcha() {
  const stub = {
    render: vi.fn(
      (_el: HTMLElement, _settings: Record<string, unknown>) => "widget-1",
    ),
    execute: vi.fn(),
    reset: vi.fn(),
    getResponse: vi.fn(() => "token-value"),
    ready: vi.fn(),
  };
  globalThis.grecaptcha = stub;
  return stub;
}

afterEach(() => {
  globalThis.grecaptcha = undefined;
});

describe("GoogleReCaptchaV2Provider", () => {
  it("throws when no key is provided", () => {
    expect(() => new GoogleReCaptchaV2Provider("")).toThrow(
      "You must provide an valid key!",
    );
  });

  it("sets its public fields from the constructor", () => {
    const provider = new GoogleReCaptchaV2Provider("site-key");

    expect(provider.name).toBe("GoogleReCaptchaV2");
    expect(provider.loadCallback).toBe("onloadReCaptchaCallback");
    expect(provider.globalName).toBe("grecaptcha");
    expect(provider.key).toBe("site-key");
    expect(provider.src).toContain("onload=onloadReCaptchaCallback");
  });

  it("renders a wrapper into the target element and calls grecaptcha.render once", () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");
    const el = document.createElement("div");

    provider.initialize(el);

    expect(grecaptcha.render).toHaveBeenCalledTimes(1);
    const wrapper = el.querySelector("[data-captcha-initialized]");
    expect(wrapper).not.toBeNull();
    expect(grecaptcha.render).toHaveBeenCalledWith(
      wrapper,
      expect.objectContaining({ sitekey: "site-key" }),
    );
  });

  it("does not render twice", () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");
    const el = document.createElement("div");

    provider.initialize(el);
    provider.initialize(el);

    expect(grecaptcha.render).toHaveBeenCalledTimes(1);
  });

  it("getWidget returns the id returned by render", () => {
    stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");
    provider.initialize(document.createElement("div"));

    expect(provider.getWidget()).toBe("widget-1");
  });

  it("execute delegates to grecaptcha.execute once initialized", () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");
    provider.initialize(document.createElement("div"));

    provider.execute();

    expect(grecaptcha.execute).toHaveBeenCalledWith("widget-1");
  });

  it("queues execute() called before initialize and fires it once rendered", () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");

    provider.execute();
    expect(grecaptcha.execute).not.toHaveBeenCalled();

    provider.initialize(document.createElement("div"));

    expect(grecaptcha.execute).toHaveBeenCalledWith("widget-1");
  });

  it("reset delegates to grecaptcha once initialized, no-op before", () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");

    provider.reset();
    expect(grecaptcha.reset).not.toHaveBeenCalled();

    provider.initialize(document.createElement("div"));
    provider.reset();

    expect(grecaptcha.reset).toHaveBeenCalledWith("widget-1");
  });

  it("getValue returns the response once initialized, null otherwise", () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");

    expect(provider.getValue()).toBeNull();

    provider.initialize(document.createElement("div"));
    expect(provider.getValue()).toBe("token-value");

    grecaptcha.getResponse.mockReturnValueOnce("");
    expect(provider.getValue()).toBeNull();
  });

  it("executeAsync resolves with the token from the callback", async () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(grecaptcha);
    const promise = provider.executeAsync();
    settings.callback("the-token");

    await expect(promise).resolves.toBe("the-token");
  });

  it("executeAsync rejects when the widget errors", async () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(grecaptcha);
    const promise = provider.executeAsync();
    settings["error-callback"]();

    await expect(promise).rejects.toThrow("Error on ReCaptcha execution");
  });

  it("calls onChange when the widget reports a token", () => {
    const grecaptcha = stubGrecaptcha();
    const onChange = vi.fn();
    const provider = new GoogleReCaptchaV2Provider("site-key", { onChange });
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(grecaptcha);
    settings.callback("the-token");

    expect(onChange).toHaveBeenCalledWith("the-token");
  });

  it("calls onErrored when provided", () => {
    const grecaptcha = stubGrecaptcha();
    const onErrored = vi.fn();
    const provider = new GoogleReCaptchaV2Provider("site-key", { onErrored });
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(grecaptcha);
    settings["error-callback"]();

    expect(onErrored).toHaveBeenCalledTimes(1);
  });

  it("calls onExpired when provided", () => {
    const grecaptcha = stubGrecaptcha();
    const onExpired = vi.fn();
    const provider = new GoogleReCaptchaV2Provider("site-key", { onExpired });
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(grecaptcha);
    settings["expired-callback"]();

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("resolves a pending executeAsync with null on expiry when no onExpired is set", async () => {
    const grecaptcha = stubGrecaptcha();
    const provider = new GoogleReCaptchaV2Provider("site-key");
    provider.initialize(document.createElement("div"));

    const settings = renderSettings(grecaptcha);
    const promise = provider.executeAsync();
    settings["expired-callback"]();

    await expect(promise).resolves.toBeNull();
  });

  it("is a safe no-op when the grecaptcha global is not defined", () => {
    const provider = new GoogleReCaptchaV2Provider("site-key");

    expect(() =>
      provider.initialize(document.createElement("div")),
    ).not.toThrow();
    expect(provider.getValue()).toBeNull();
    expect(provider.getWidget()).toBeUndefined();
    expect(() => provider.execute()).not.toThrow();
    expect(() => provider.reset()).not.toThrow();
  });
});
