"use client";

import Link from "next/link";

export default function ProofsPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-800 hover:underline mb-4 inline-block font-medium text-sm sm:text-base"
        >
          ← Back to Home
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-800">Proof Tools</h1>

        <div className="p-6 bg-white/60 backdrop-blur-sm border border-gray-300 rounded-lg shadow-sm">
          <p className="text-gray-700">
            Proof tools coming soon! Plan to add features such as:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
            <li>Truth table generator</li>
            <li>Logical equivalence checker</li>
            <li>Proof step validator</li>
            <li>Set theory calculator</li>
            <li>Propositional logic solver</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

