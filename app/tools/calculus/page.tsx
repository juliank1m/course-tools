"use client";

import { useState } from "react";
import Link from "next/link";
import DerivativeCalculator from "./components/DerivativeCalculator";
import IntegralCalculator from "./components/IntegralCalculator";

type Tab = "derivative" | "integral";

export default function CalculusPage() {
  const [activeTab, setActiveTab] = useState<Tab>("derivative");

  const tabs = [
    { id: "derivative" as Tab, label: "Derivative Calculator", badge: "d/dx" },
    { id: "integral" as Tab, label: "Integral Calculator", badge: "∫" },
  ];

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60">
      <div className="max-w-5xl mx-auto">
        <Link
          href="/"
          className="text-gray-600 hover:text-gray-800 hover:underline mb-4 inline-block font-medium text-sm sm:text-base"
        >
          ← Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-800">
            <span>Calculus </span>
            <span className="text-purple-600">Tools</span>
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Work with derivatives and integrals using interactive calculators.
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
                    ? "text-purple-600 border-b-2 border-purple-600 -mb-[2px]"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <span
                  className={`mr-2 inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                    tab.id === "derivative"
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
          {activeTab === "derivative" && <DerivativeCalculator />}
          {activeTab === "integral" && <IntegralCalculator />}
        </div>
      </div>
    </main>
  );
}

