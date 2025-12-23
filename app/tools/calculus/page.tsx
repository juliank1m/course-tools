"use client";

import Link from "next/link";

export default function CalculusPage() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-800 hover:underline mb-4 inline-block font-medium"
        >
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-gray-800">Calculus Tools</h1>

        <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
          <p className="text-gray-700">
            Calculus tools coming soon! Plan to add features such as:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
            <li>Derivative calculator</li>
            <li>Integral calculator</li>
            <li>Limit calculator</li>
            <li>Taylor series expansion</li>
            <li>Function graphing</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

