"use client";

import Link from "next/link";

export default function ProofsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold mb-6">Proof Tools</h1>

        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">
            Proof tools coming soon! Plan to add features such as:
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600 dark:text-gray-400">
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

