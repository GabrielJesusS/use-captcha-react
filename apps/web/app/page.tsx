"use client";

import { CaptchaCard } from "../components/CaptchaCard";

export default function Home() {
  return (
    <main className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          Captcha Hub
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
          <CaptchaCard
            title={"Google reCAPTCHA v2"}
            description={"Test the Google reCAPTCHA v2"}
            link="/googleV2"
          />
        </div>
      </div>
    </main>
  );
}
