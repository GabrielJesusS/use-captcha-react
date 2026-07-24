import type { CaptchaProvider } from "../@types/CaptchaProvider";
import {
  BaseCaptchaProvider,
  type CaptchaGlobalShape,
  type Token,
} from "./BaseCaptchaProvider";

declare global {
  var grecaptcha: CaptchaGlobalShape | undefined;
}

type GoogleReCaptchaV2Theme = "light" | "dark";

type GoogleReCaptchaV2Size = "normal" | "compact" | "invisible";

type GoogleReCaptchaV2Type = "image" | "audio";

type GoogleReCaptchaV2BadgePosition = "bottomright" | "bottomleft" | "inline";

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
  extends BaseCaptchaProvider<GoogleReCaptchaV2Options, CaptchaGlobalShape>
  implements CaptchaProvider<GoogleReCaptchaV2Options>
{
  public name = "GoogleReCaptchaV2";

  public loadCallback = "onloadReCaptchaCallback";

  public src =
    `https://www.google.com/recaptcha/api.js?render=explicit&onload=${this.loadCallback}`;

  public globalName = "grecaptcha";

  constructor(key: string, options?: GoogleReCaptchaV2Options) {
    super(key, options, "Error on ReCaptcha execution");
  }

  protected readGlobal() {
    return typeof grecaptcha === "undefined" ? undefined : grecaptcha;
  }

  protected getRenderSettings() {
    return {
      hl: this.options?.hl,
      type: this.options?.type,
      size: this.options?.size,
      theme: this.options?.theme,
      badge: this.options?.badge,
      stoken: this.options?.stoken,
      isolated: this.options?.isolated,
      tabindex: this.options?.tabindex,
    };
  }
}
