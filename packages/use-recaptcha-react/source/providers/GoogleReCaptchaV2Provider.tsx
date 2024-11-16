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
        getResponse: (widgetId: string) => void;
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

type PromiseResolver = (value: string | PromiseLike<string>) => void;

type GoogleReCaptchaV2Options = {
  hl?: string;
  stoken?: unknown;
  tabindex?: number;
  isolated?: boolean;
  type?: GoogleReCaptchaV2Type;
  size?: GoogleReCaptchaV2Size;
  theme?: GoogleReCaptchaV2Theme;
  badge?: GoogleReCaptchaV2BadgePosition;
  onChange?: (token: string) => void;
  onExpired?: () => void;
  onErrored?: () => void;
};

export class GoogleReCaptchaV2Provider
  implements CaptchaProvider<GoogleReCaptchaV2Options>
{
  public name = "GoogleReCaptchaV2";

  public src = "https://www.google.com/recaptcha/api.js?render=explicit";

  public widgetId?: string = undefined;

  public key: string;

  public options?: GoogleReCaptchaV2Options | undefined;

  private currentPromiseResolver: PromiseResolver | null = null;

  constructor(key: string, options?: GoogleReCaptchaV2Options) {
    this.key = key;
    this.options = options;
    this.onChange = this.onChange.bind(this);
  }

  private extractMethod<T extends GoogleReCaptchaV2Methods>(method: T) {
    if (typeof grecaptcha === "undefined") {
      return null;
    }

    return grecaptcha[method];
  }

  ready(cb: () => void) {
    const onReady = this.extractMethod("ready");
    if (onReady) {
      onReady(cb);
    }
  }

  render(element: HTMLElement) {
    const render = this.extractMethod("render");
    if (render && this.widgetId === undefined) {
      const wrapper = document.createElement("div");
      this.widgetId = render(wrapper, {
        sitekey: this.key,
        callback: this.onChange,
        theme: this.options?.theme,
        type: this.options?.type,
        tabindex: this.options?.tabindex,
        "expired-callback": this.options?.onExpired,
        "error-callback": this.options?.onErrored,
        size: this.options?.size,
        stoken: this.options?.stoken,
        hl: this.options?.hl,
        badge: this.options?.badge,
        isolated: this.options?.isolated,
      });
      wrapper.setAttribute("data-impossible", "");
      element.appendChild(wrapper);
    }
    /*  if (
      this._executeRequested &&
      this.props.grecaptcha &&
      this.widgetId !== undefined
    ) {
      this._executeRequested = false;
      this.execute();
    } */
  }

  async execAsync() {
    return new Promise<string>((resolve) => {
      this.currentPromiseResolver = resolve;
      this.exec();
    });
  }

  onChange(token: string) {
    if (this.options?.onChange) {
      this.options.onChange(token);
    }

    if (this.currentPromiseResolver) {
      this.currentPromiseResolver(token);
      this.currentPromiseResolver = null;
    }
  }

  getValue() {}

  getWidget() {}

  exec() {
    const execute = this.extractMethod("execute");
    if (execute && this.widgetId !== undefined) {
      return execute(this.widgetId);
    }
  }

  init(element: HTMLElement) {
    this.ready(() => {
      this.render(element);
    });
  }
}
