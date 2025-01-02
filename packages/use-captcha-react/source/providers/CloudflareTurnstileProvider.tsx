import type { CaptchaProvider } from "../@types/CaptchaProvider";

declare global {
  var onloadTurnstileCallback: () => void;
  var turnstile:
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

type CloudflareTurnstileMethods =
  | "render"
  | "execute"
  | "reset"
  | "getResponse"
  | "ready";

type CloudflareTurnstileTheme = "light" | "dark" | "auto";

type CloudflareTurnstileSize = "normal" | "compact" | "flexible";

type CloudflareTurnstileMode = "render" | "execute";

type CloudflareTurnstileRetry = "auto" | "never";

type CloudflareTurnstileAppearance = "always" | "execute" | "interaction-only";

type CloudflareTurnstileRefresh = "auto" | "never" | "manual";

type Token = string | null;

type PromiseResolver = (value: Token | PromiseLike<Token>) => void;

type PromiseRejector = (error: Error | PromiseLike<Error>) => void;

type CloudflareTurnstileOptions = {
  execution?: CloudflareTurnstileMode;
  theme?: CloudflareTurnstileTheme;
  language?: string;
  tabindex?: number;
  size?: CloudflareTurnstileSize;
  retry?: CloudflareTurnstileRetry;
  retryInterval?: number;
  refreshExpired?: CloudflareTurnstileRefresh;
  refreshTimeout?: CloudflareTurnstileRefresh;
  appearance?: CloudflareTurnstileAppearance;
  feedbackEnabled?: boolean;
  onChange?: (token: Token) => void;
  onExpired?: () => void;
  onErrored?: () => void;
  onTimouted?: () => void;
};

export class CloudflareTurnstileProvider
  implements CaptchaProvider<CloudflareTurnstileOptions>
{
  public name = "CloudflareTurnstile";

  public src =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback";

  public key: string;

  public options?: CloudflareTurnstileOptions | undefined;

  private widgetId?: string = undefined;

  private executeRequested = false;

  private currentPromiseResolver: PromiseResolver | null = null;

  private currentPromiseRejector: PromiseRejector | null = null;

  constructor(key: string, options?: CloudflareTurnstileOptions) {
    if (!key) {
      throw new Error("You must provide an valid key!");
    }

    this.key = key;
    this.options = options;
    this.handleChange = this.handleChange.bind(this);
    this.handleErrored = this.handleErrored.bind(this);
    this.handleTimeouted = this.handleTimeouted.bind(this);
    this.handleExpired = this.handleExpired.bind(this);
    this.cleanupPromise = this.cleanupPromise.bind(this);
  }

  private extractMethod<T extends CloudflareTurnstileMethods>(method: T) {
    if (typeof turnstile === "undefined") {
      return null;
    }

    return turnstile[method];
  }

  private ready(cb: () => void) {
    window.onloadTurnstileCallback = () => {
      cb();
    };
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

  private handleTimeouted() {
    if (this.options?.onTimouted) {
      this.options?.onTimouted();
    } else {
      this.handleChange(null);
    }
  }

  private handleErrored() {
    if (this.options?.onErrored) {
      this.options?.onErrored();
    }
    if (this.currentPromiseRejector) {
      this.currentPromiseRejector(new Error("Error on Turnstile execution"));
      this.cleanupPromise();
    }
  }

  private render(element: HTMLElement) {
    const render = this.extractMethod("render");
    if (render && this.widgetId === undefined) {
      const wrapper = document.createElement("div");
      this.widgetId = render(wrapper, {
        sitekey: this.key,
        language: this.options?.language,
        size: this.options?.size,
        theme: this.options?.theme,
        tabindex: this.options?.tabindex,
        appearance: this.options?.appearance,
        execution: this.options?.execution,
        retry: this.options?.retry,
        retryInterval: this.options?.retryInterval,
        refreshExpired: this.options?.refreshExpired,
        refreshTimeout: this.options?.refreshTimeout,
        feedbackEnabled: this.options?.feedbackEnabled,
        "timeout-callback": this.handleTimeouted,
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
    this.ready(() => {
      this.render(element);
    });
  }
}
