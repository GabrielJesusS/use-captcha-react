import type { CaptchaProvider } from "../@types/CaptchaProvider";
import {
  BaseCaptchaProvider,
  type CaptchaGlobalShape,
  type Token,
} from "./BaseCaptchaProvider";

type TurnstileGlobal = CaptchaGlobalShape & {
  remove: (widgetId: string) => void;
};

declare global {
  var turnstile: TurnstileGlobal | undefined;
}

type CloudflareTurnstileTheme = "light" | "dark" | "auto";

type CloudflareTurnstileSize = "normal" | "compact" | "flexible";

type CloudflareTurnstileMode = "render" | "execute";

type CloudflareTurnstileRetry = "auto" | "never";

type CloudflareTurnstileAppearance = "always" | "execute" | "interaction-only";

type CloudflareTurnstileRefresh = "auto" | "never" | "manual";

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
  onTimeout?: () => void;
};

export class CloudflareTurnstileProvider
  extends BaseCaptchaProvider<CloudflareTurnstileOptions, TurnstileGlobal>
  implements CaptchaProvider<CloudflareTurnstileOptions>
{
  public name = "CloudflareTurnstile";

  public loadCallback = "onloadTurnstileCallback";

  public src =
    `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${this.loadCallback}`;

  public globalName = "turnstile";

  constructor(key: string, options?: CloudflareTurnstileOptions) {
    super(key, options, "Error on Turnstile execution");
    this.handleTimeout = this.handleTimeout.bind(this);
  }

  protected readGlobal() {
    return typeof turnstile === "undefined" ? undefined : turnstile;
  }

  protected getRenderSettings() {
    return {
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
      "timeout-callback": this.handleTimeout,
    };
  }

  private handleTimeout() {
    if (this.options?.onTimeout) {
      this.options.onTimeout();
    } else {
      this.handleChange(null);
    }
  }

  public remove() {
    const remove = this.extractMethod("remove");
    if (remove && this.widgetId !== undefined) {
      return remove(this.widgetId);
    }
  }
}
