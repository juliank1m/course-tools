import Link from "next/link";

const tools = [
  {
    name: "Linear Algebra",
    description: "Matrix operations, determinants, eigenvalues, and more",
    href: "/tools/linear-algebra",
    category: "Math",
  },
  {
    name: "Calculus",
    description: "Derivatives, integrals, limits, and series",
    href: "/tools/calculus",
    category: "Math",
  },
  {
    name: "Chemistry",
    description: "Molar mass, stoichiometry, and chemical calculations",
    href: "/tools/chemistry",
    category: "Science",
  },
  {
    name: "CS Tools",
    description: "Algorithm analysis, number conversions, and CS utilities",
    href: "/tools/cs",
    category: "Computer Science",
  },
  {
    name: "Proofs",
    description: "Proof helpers and logical reasoning tools",
    href: "/tools/proofs",
    category: "Math",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Course Tools
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12">
          A collection of helpful calculators and utilities for your academic courses
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              className="block p-6 border border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-white dark:bg-gray-900"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-semibold">{tool.name}</h2>
                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                  {tool.category}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">About</h3>
          <p className="text-gray-600 dark:text-gray-400">
            This is a collection of tools designed to help with time-consuming tasks in various
            academic courses. All calculations run in your browser - no data is sent to any server.
          </p>
        </div>
      </div>
    </main>
  );
}

