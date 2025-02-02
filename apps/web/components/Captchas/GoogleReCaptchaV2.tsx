"use client";

import { type FormEvent, type FormEventHandler, useState } from "react";
import { useCaptcha } from "use-captcha-react";
import { GoogleReCaptchaV2Provider } from "use-captcha-react/googleReCaptchaV2";
import { sleep } from "../../utils/sleep";

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_KEY ?? "";

export const GoogleReCaptchaV2 = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [ref, { executeAsync, reset, getValue }] = useCaptcha(
    GoogleReCaptchaV2Provider,
    siteKey,
    {
      size: "invisible",
      hl: "pt",
    },
  );

  function handleSubmit(handler: FormEventHandler) {
    return async (event: FormEvent) => {
      event.preventDefault();

      const token = await executeAsync();

      console.log(`The following token has been generated:\n ${token}`);

      if (token) {
        handler(event);
      }
    };
  }

  async function handleSuccessSubmit() {
    setSubmitting(true);

    await sleep(2);

    alert("Form sended!");

    const token = getValue();

    console.log(`The form has sended with the following token: ${token}`);

    reset();

    setSubmitting(false);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(handleSuccessSubmit)}
        className="flex flex-col gap-4"
      >
        <label
          htmlFor="test-input"
          className="text-lg font-medium text-gray-700"
        >
          Test input
        </label>
        <input
          id="test-input"
          type="text"
          disabled={isSubmitting}
          className="border border-gray-300 rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:pointer-events-none disabled:bg-gray-100"
          placeholder="Insert some text"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white rounded-md p-2 font-semibold hover:bg-blue-600 transition disabled:pointer-events-none disabled:bg-gray-300"
          disabled={isSubmitting}
        >
          Send
        </button>
      </form>
      <div ref={ref} />
    </>
  );
};
