import Link from "next/link";

export default function Other() {
  return (
    <main className="bg-gray-100 flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
        <Link
          href="/"
          className="text-green-500 font-semibold hover:text-green-600 transition text-center"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
