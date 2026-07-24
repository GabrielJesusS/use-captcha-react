export type Token = string | null;

type PromiseResolver = (value: Token | PromiseLike<Token>) => void;
type PromiseRejector = (error: Error | PromiseLike<Error>) => void;

export type CaptchaGlobalShape = {
  render: (
    elm: HTMLElement,
    settings: { sitekey: string; [key: string]: unknown },
  ) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  getResponse: (widgetId: string) => string;
  ready: (cb: () => void) => void;
};

export type BaseCaptchaOptions = {
  onChange?: (token: Token) => void;
  onExpired?: () => void;
  onErrored?: () => void;
};

export abstract class BaseCaptchaProvider<
  Options extends BaseCaptchaOptions,
  Global extends CaptchaGlobalShape,
> {
  public key: string;

  public options?: Options;

  protected widgetId?: string = undefined;

  protected executeRequested = false;

  protected currentPromiseResolver: PromiseResolver | null = null;

  protected currentPromiseRejector: PromiseRejector | null = null;

  constructor(
    key: string,
    options: Options | undefined,
    private readonly errorMessage: string,
  ) {
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

  protected abstract readGlobal(): Global | undefined;

  protected abstract getRenderSettings(): Record<string, unknown>;

  protected extractMethod<T extends keyof Global>(method: T): Global[T] | null {
    const global = this.readGlobal();
    if (!global) return null;

    return global[method];
  }

  protected cleanupPromise() {
    this.currentPromiseResolver = null;
    this.currentPromiseRejector = null;
  }

  protected handleChange(token: Token) {
    if (this.options?.onChange) {
      this.options.onChange(token);
    }

    if (this.currentPromiseResolver) {
      this.currentPromiseResolver(token);
      this.cleanupPromise();
    }
  }

  protected handleExpired() {
    if (this.options?.onExpired) {
      this.options.onExpired();
    } else {
      this.handleChange(null);
    }
  }

  protected handleErrored() {
    if (this.options?.onErrored) {
      this.options.onErrored();
    }
    if (this.currentPromiseRejector) {
      this.currentPromiseRejector(new Error(this.errorMessage));
      this.cleanupPromise();
    }
  }

  protected render(element: HTMLElement) {
    const render = this.extractMethod("render");
    if (render && this.widgetId === undefined) {
      const wrapper = document.createElement("div");
      this.widgetId = render(wrapper, {
        sitekey: this.key,
        ...this.getRenderSettings(),
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
