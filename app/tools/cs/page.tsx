"use client";

import { useState } from "react";
import Link from "next/link";
import BigOAnalyzer from "./components/BigOAnalyzer";
import NumberBaseConverter from "./components/NumberBaseConverter";

type Tab = "big-o" | "base-converter";

export default function CSPage() {
  const [activeTab, setActiveTab] = useState<Tab>("big-o");

  const tabs = [
    { id: "big-o" as Tab, label: "Big O Analyzer", badge: "O(n)" },
    { id: "base-converter" as Tab, label: "Base Converter", badge: "Base" },
  ];

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-800 hover:underline mb-4 inline-block font-medium text-sm sm:text-base"
        >
          ← Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="text-gray-800">CS </span>
            <span className="text-blue-600">Tools</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Computer science utilities and calculators
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-2 border-b-2 border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium text-sm transition-all relative ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 -mb-[2px]"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <span
                  className={`mr-2 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                    tab.id === "big-o"
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "bg-purple-100 text-purple-700 border border-purple-200"
                  }`}
                >
                  {tab.badge}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "big-o" && <BigOAnalyzer />}
          {activeTab === "base-converter" && <NumberBaseConverter />}
        </div>
      </div>
    </main>
  );
}
