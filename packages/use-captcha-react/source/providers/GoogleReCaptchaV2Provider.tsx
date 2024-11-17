import type { CaptchaProvider } from "../@types/CaptchaProvider";

declare global {
  var grecaptcha:
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

type GoogleReCaptchaV2Methods =
  | "render"
  | "execute"
  | "reset"
  | "getResponse"
  | "ready";

type GoogleReCaptchaV2Theme = "light" | "dark";

type GoogleReCaptchaV2Size = "normal" | "compact" | "invisible";

type GoogleReCaptchaV2Type = "image" | "audio";

type GoogleReCaptchaV2BadgePosition = "bottomright" | "bottomleft" | "inline";

type Token = string | null;

type PromiseResolver = (value: Token | PromiseLike<Token>) => void;

type PromiseRejector = (error: Error | PromiseLike<Error>) => void;

type GoogleReCaptchaV2Options = {
  hl?: string;
  stoken?: unknown;
  tabindex?: number;
  isolated?: boolean;
  type?: GoogleReCaptchaV2Type;
  size?: GoogleReCaptchaV2Size;
  theme?: GoogleReCaptchaV2Theme;
  badge?: GoogleReCaptchaV2BadgePosition;
  onChange?: (token: Token) => void;
  onExpired?: () => void;
  onErrored?: () => void;
};

export class GoogleReCaptchaV2Provider
  implements CaptchaProvider<GoogleReCaptchaV2Options>
{
  public name = "GoogleReCaptchaV2";

  public src = "https://www.google.com/recaptcha/api.js?render=explicit";

  public key: string;

  public options?: GoogleReCaptchaV2Options | undefined;

  private widgetId?: string = undefined;

  private executeRequested = false;

  private currentPromiseResolver: PromiseResolver | null = null;

  private currentPromiseRejector: PromiseRejector | null = null;

  constructor(key: string, options?: GoogleReCaptchaV2Options) {
    this.key = key;
    this.options = options;
    this.handleChange = this.handleChange.bind(this);
    this.handleErrored = this.handleErrored.bind(this);
    this.handleExpired = this.handleExpired.bind(this);
    this.cleanupPromise = this.cleanupPromise.bind(this);
  }

  private extractMethod<T extends GoogleReCaptchaV2Methods>(method: T) {
    if (typeof grecaptcha === "undefined") {
      return null;
    }

    return grecaptcha[method];
  }

  private ready(cb: () => void) {
    const onReady = this.extractMethod("ready");
    if (onReady) {
      onReady(cb);
    }
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
      this.currentPromiseRejector(new Error("Error on ReCaptcha execution"));
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
        type: this.options?.type,
        size: this.options?.size,
        theme: this.options?.theme,
        badge: this.options?.badge,
        stoken: this.options?.stoken,
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
    this.ready(() => {
      this.render(element);
    });
  }
}
