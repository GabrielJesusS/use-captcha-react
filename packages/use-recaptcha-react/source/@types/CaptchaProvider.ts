export interface CaptchaProvider<Options> {
  name: string;
  src: string;
  options?: Options;
  exec: () => void;
  render: (element: HTMLElement) => void;
  init: (element: HTMLElement) => void;
  execAsync: () => Promise<string>;
  getWidget: () => void;
  getValue: () => void;
  onChange?: (token: string) => void;
}
