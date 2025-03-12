import type { CaptchaProvider } from "../@types/CaptchaProvider";

declare global {
  var hcaptcha:
    | {
        render: (
          elm: HTMLElement,
          settings: { sitekey: string; [key: string]: unknown },
        ) => string;
        execute: (widgetId: string) => void;
        reset: (widgetId: string) => void;
        getResponse: (widgetId: string) => string;
        ready: (cb: () => void) => void;
      }
    | undefined;
}

type HCaptchaMethods = "render" | "execute" | "reset" | "getResponse" | "ready";

type HCaptchaTheme = "light" | "dark";

type HCaptchaSize = "normal" | "compact" | "invisible";

type HCaptchaOrientation = "portrait" | "landscape";

type Token = string | null;

type PromiseResolver = (value: Token | PromiseLike<Token>) => void;

type PromiseRejector = (error: Error | PromiseLike<Error>) => void;

type HCaptchaOptions = {
  hl?: string;
  tabindex?: number;
  isolated?: boolean;
  size?: HCaptchaSize;
  theme?: HCaptchaTheme;
  badge?: HCaptchaOrientation;
  onChange?: (token: Token) => void;
  onExpired?: () => void;
  onErrored?: () => void;
};

export class HCaptchaProvider implements CaptchaProvider<HCaptchaOptions> {
  public name = "HCaptcha";

  public loadCallback = "onloadHCaptchaCallback";

  public src =
    `https://js.hcaptcha.com/1/api.js?onload=${this.loadCallback}&render=explicit`;

  public globalName = "hcaptcha";

  public key: string;

  public options?: HCaptchaOptions | undefined;

  private widgetId?: string = undefined;

  private executeRequested = false;

  private currentPromiseResolver: PromiseResolver | null = null;

  private currentPromiseRejector: PromiseRejector | null = null;

  constructor(key: string, options?: HCaptchaOptions) {
    if (!key) {
      throw new Error("You must provide an valid key!");
    }

    this.key = key;
    this.options = options;
    this.handleChange = this.handleChange.bind(this);
    this.handleErrored = this.handleErrored.bind(this);
    this.handleExpired = this.handleExpired.bind(this);
    this.cleanupPromise = this.cleanupPromise.bind(this);
  }

  private extractMethod<T extends HCaptchaMethods>(method: T) {
    if (typeof grecaptcha === "undefined") {
      return null;
    }

    return grecaptcha[method];
  }

  private cleanupPromise() {
    this.currentPromiseResolver = null;
    this.currentPromiseRejector = null;
  }

  private handleChange(token: Token) {
    if (this.options?.onChange) {
      this.options.onChange(token);
    }

    if (this.currentPromiseResolver) {
      this.currentPromiseResolver(token);
      this.cleanupPromise();
    }
  }

  private handleExpired() {
    if (this.options?.onExpired) {
      this.options?.onExpired();
    } else {
      this.handleChange(null);
    }
  }

  private handleErrored() {
    if (this.options?.onErrored) {
      this.options?.onErrored();
    }
    if (this.currentPromiseRejector) {
      this.currentPromiseRejector(new Error("Error on HCaptcha execution"));
      this.cleanupPromise();
    }
  }

  private render(element: HTMLElement) {
    const render = this.extractMethod("render");
    if (render && this.widgetId === undefined) {
      const wrapper = document.createElement("div");
      this.widgetId = render(wrapper, {
        sitekey: this.key,
        hl: this.options?.hl,
        size: this.options?.size,
        theme: this.options?.theme,
        badge: this.options?.badge,
        isolated: this.options?.isolated,
        tabindex: this.options?.tabindex,
        "expired-callback": this.handleExpired,
        "error-callback": this.handleErrored,
        callback: this.handleChange,
      });
      wrapper.setAttribute("data-captcha-initialized", "");
      element.appendChild(wrapper);
    }
    if (this.executeRequested && this.widgetId !== undefined) {
      this.executeRequested = false;
      this.execute();
    }
  }

  public async executeAsync() {
    return new Promise<Token>((resolve, reject) => {
      this.currentPromiseResolver = resolve;
      this.currentPromiseRejector = reject;
      this.execute();
    });
  }

  public getValue() {
    const getResponse = this.extractMethod("getResponse");
    if (getResponse && this.widgetId !== undefined) {
      return getResponse(this.widgetId) || null;
    }

    return null;
  }

  public getWidget() {
    return this.widgetId;
  }

  public execute() {
    const execute = this.extractMethod("execute");
    if (execute && this.widgetId !== undefined) {
      return execute(this.widgetId);
    }

    this.executeRequested = true;
  }

  public reset() {
    const reset = this.extractMethod("reset");
    if (reset && this.widgetId !== undefined) {
      return reset(this.widgetId);
    }
  }

  public initialize(element: HTMLElement) {
    this.render(element);
  }
}
