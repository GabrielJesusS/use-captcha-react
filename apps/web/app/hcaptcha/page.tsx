import type { Metadata } from "next";
import Link from "next/link";
import { HCaptcha } from "../../components/Captchas/HCaptcha";

export const metadata: Metadata = {
  title: "HCaptcha",
};

export default function HCaptchaPage() {
  return (
    <main className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
        <HCaptcha />
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
