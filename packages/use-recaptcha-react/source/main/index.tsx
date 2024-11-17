import { type RefObject, useCallback, useEffect, useRef } from "react";
import type { CaptchaProvider } from "../@types/CaptchaProvider";
import { useLoadScript } from "../hooks/useLoadScript";

type CaptchaConstructor<T = undefined> = new (
  key: string,
  options?: T,
) => CaptchaProvider<T>;

type UseCaptchaMethods = {
  execute: () => void;
  reset: () => void;
  getValue: () => string | null;
  executeAsync: () => Promise<string | null>;
};

type UseCaptchaReturn = [RefObject<HTMLDivElement>, UseCaptchaMethods];

export const useCaptcha = <T,>(
  Provider: CaptchaConstructor<T>,
  key: string,
  options?: T,
): UseCaptchaReturn => {
  const element = useRef<HTMLDivElement>(null);
  const captcha = useRef(new Provider(key, options));
  const hasLoaded = useLoadScript(captcha.current.src, captcha.current.name);

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

  return [element, { execute, executeAsync, getValue, reset }];
};
