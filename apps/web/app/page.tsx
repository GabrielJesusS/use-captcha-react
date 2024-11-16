"use client";

import Link from "next/link";
import { Captcha } from "../components/LoadCaptcha";

export default function Home() {
  return (
    <main className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm space-y-4">
        <Captcha />
        <div className="text-center">
          <Link
            href="/other"
            className="text-green-500 font-semibold hover:text-green-600 transition text-center"
          >
            Other page
          </Link>
        </div>
      </div>
    </main>
  );
}
