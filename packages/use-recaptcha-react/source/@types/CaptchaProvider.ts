export interface CaptchaProvider<Options> {
  name: string;
  src: string;
  options?: Options;
  execute: () => void;
  reset: () => void;
  executeAsync: () => Promise<string | null>;
  getWidget: () => string | undefined;
  getValue: () => string | null;
  initialize: (element: HTMLElement) => void;
}
