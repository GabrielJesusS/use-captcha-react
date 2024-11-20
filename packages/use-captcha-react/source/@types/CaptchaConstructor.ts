import type { CaptchaProvider } from "./CaptchaProvider";

export type CaptchaConstructor<
  Options,
  Provider extends CaptchaProvider<Options>,
> = new (key: string, options?: Provider["options"]) => Provider;
