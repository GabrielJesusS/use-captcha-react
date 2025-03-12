/**
 * Interface for CAPTCHA providers.
 * @template Options - Type of the provider-specific options.
 */
export interface CaptchaProvider<Options> {
  /**
   * Name of the CAPTCHA provider.
   */
  name: string;

  /**
   * URL of the CAPTCHA provider's script.
   */
  src: string;

  /**
   * Name of the callback function to be called after the script is loaded.
   */
  loadCallback: string;

  /**
   * Global name of the CAPTCHA object in the global scope.
   */
  globalName: string;

  /**
   * Provider-specific CAPTCHA options.
   */
  options?: Options;

  /**
   * Executes the CAPTCHA.
   */
  execute: () => void;

  /**
   * Resets the CAPTCHA.
   */
  reset: () => void;

  /**
   * Executes the CAPTCHA asynchronously.
   * @returns {Promise<string | null>} - A promise that resolves to the CAPTCHA value or null.
   */
  executeAsync: () => Promise<string | null>;

  /**
   * Gets the CAPTCHA widget.
   * @returns {string | undefined} - The CAPTCHA widget or undefined.
   */
  getWidget: () => string | undefined;

  /**
   * Gets the CAPTCHA value.
   * @returns {string | null} - The CAPTCHA value or null.
   */
  getValue: () => string | null;

  /**
   * Initializes the CAPTCHA on an HTML element.
   * @param {HTMLElement} element - The HTML element where the CAPTCHA will be initialized.
   */
  initialize: (element: HTMLElement) => void;
}
