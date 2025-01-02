"use client";

import Link from "next/link";
import { GoogleReCaptchaV2 } from "../../components/Captchas/GoogleReCaptchaV2";

export default function GoogleV2() {
  return (
    <main className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
        <GoogleReCaptchaV2 />
        <div className="text-center">
          <Link
            href="/"
            className="text-green-500 font-semibold hover:text-green-600 transition text-center"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
