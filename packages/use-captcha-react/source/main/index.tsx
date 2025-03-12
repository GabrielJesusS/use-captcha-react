export * from "../@types/CaptchaProvider";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import type { CaptchaConstructor } from "../@types/CaptchaConstructor";
import type { CaptchaProvider } from "../@types/CaptchaProvider";
import { useLoadScript } from "../hooks/useLoadScript";

type UseCaptchaMethods = {
  execute: () => void;
  reset: () => void;
  getValue: () => string | null;
  executeAsync: () => Promise<string | null>;
};

type UseCaptchaReturn<Options, Provider extends CaptchaProvider<Options>> = [
  RefObject<HTMLDivElement>,
  UseCaptchaMethods,
  RefObject<Provider>,
];

export const useCaptcha = <Options, Provider extends CaptchaProvider<Options>>(
  provider: CaptchaConstructor<Options, Provider>,
  key: string,
  options?: Provider["options"],
): UseCaptchaReturn<Options, Provider> => {
  const element = useRef<HTMLDivElement>(null);
  const captcha = useRef(new provider(key, options));
  const hasLoaded = useLoadScript(captcha.current.src, {
    globalVariables: [captcha.current.globalName],
    loadCallback: captcha.current.loadCallback,
  });

  useEffect(() => {
    if (!element.current || !hasLoaded) return;
    captcha.current.initialize(element.current);
  }, [hasLoaded]);

  const execute = useCallback(() => {
    if (!captcha.current) return;
    captcha.current.execute();
  }, []);

  const reset = useCallback(() => {
    if (!captcha.current) return;

    captcha.current.reset();
  }, []);

  const getValue = useCallback(() => {
    if (!captcha.current) {
      return null;
    }

    return captcha.current.getValue();
  }, []);

  const executeAsync = useCallback(async () => {
    if (!captcha.current) return null;
    return await captcha.current.executeAsync();
  }, []);

  return [element, { execute, executeAsync, getValue, reset }, captcha];
};
