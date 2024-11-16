import { useCallback, useEffect, useRef } from "react";
import type { CaptchaProvider } from "../@types/CaptchaProvider";
import { useLoadScript } from "../hooks/useLoadScript";

type CaptchaConstructor<T = undefined> = new (
  key: string,
  options?: T,
) => CaptchaProvider<T>;

export const useCaptcha = <T,>(
  Provider: CaptchaConstructor<T>,
  key: string,
  options?: T,
) => {
  const element = useRef<HTMLDivElement>(null);
  const captcha = useRef(new Provider(key, options));
  const hasLoaded = useLoadScript(captcha.current.src, captcha.current.name);

  useEffect(() => {
    if (!element.current || !hasLoaded) return;
    captcha.current.init(element.current);
  }, [hasLoaded]);

  const execute = useCallback(() => {
    if (!captcha.current) return;
    captcha.current.exec();
  }, []);

  const executeAsync = useCallback(async () => {
    if (!captcha.current) return;
    return await captcha.current.execAsync();
  }, []);

  return { ref: element, execute, executeAsync };
};
