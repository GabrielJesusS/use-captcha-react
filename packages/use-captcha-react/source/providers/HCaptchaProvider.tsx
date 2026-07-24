import type { CaptchaProvider } from "../@types/CaptchaProvider";
import {
  BaseCaptchaProvider,
  type CaptchaGlobalShape,
  type Token,
} from "./BaseCaptchaProvider";

declare global {
  var hcaptcha: CaptchaGlobalShape | undefined;
}

type HCaptchaTheme = "light" | "dark";

type HCaptchaSize = "normal" | "compact" | "invisible";

type HCaptchaOrientation = "portrait" | "landscape";

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

export class HCaptchaProvider
  extends BaseCaptchaProvider<HCaptchaOptions, CaptchaGlobalShape>
  implements CaptchaProvider<HCaptchaOptions>
{
  public name = "HCaptcha";

  public loadCallback = "onloadHCaptchaCallback";

  public src =
    `https://js.hcaptcha.com/1/api.js?onload=${this.loadCallback}&render=explicit`;

  public globalName = "hcaptcha";

  constructor(key: string, options?: HCaptchaOptions) {
    super(key, options, "Error on HCaptcha execution");
  }

  protected readGlobal() {
    return typeof hcaptcha === "undefined" ? undefined : hcaptcha;
  }

  protected getRenderSettings() {
    return {
      hl: this.options?.hl,
      size: this.options?.size,
      theme: this.options?.theme,
      badge: this.options?.badge,
      isolated: this.options?.isolated,
      tabindex: this.options?.tabindex,
    };
  }
}
