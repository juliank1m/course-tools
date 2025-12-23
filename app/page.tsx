import Link from "next/link";

const tools = [
  {
    name: "Linear Algebra",
    description: "Matrix operations, determinants, eigenvalues, and more",
    href: "/tools/linear-algebra",
    category: "Math",
    color: "blue",
  },
  {
    name: "Calculus",
    description: "Derivatives, integrals, limits, and series",
    href: "/tools/calculus",
    category: "Math",
    color: "purple",
  },
  {
    name: "Chemistry",
    description: "Molar mass, stoichiometry, and chemical calculations",
    href: "/tools/chemistry",
    category: "Science",
    color: "pink",
  },
  {
    name: "Vector Math",
    description: "Vector operations, projections, and geometric equations",
    href: "/tools/vectors",
    category: "Math",
    color: "blue",
  },
  {
    name: "Proofs",
    description: "Proof helpers and logical reasoning tools",
    href: "/tools/proofs",
    category: "Math",
    color: "purple",
  },
  {
    name: "CS Tools",
    description: "Algorithm analysis, number conversions, and CS utilities",
    href: "/tools/cs",
    category: "Computer Science",
    color: "green",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen p-8 md:p-16 bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="text-gray-800">Course </span>
          <span className="text-blue-600">Tools</span>
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          A collection of helpful calculators and utilities for your academic courses
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const colorClasses = {
              blue: "border-blue-200 hover:border-blue-300 bg-blue-50/30",
              purple: "border-purple-200 hover:border-purple-300 bg-purple-50/30",
              pink: "border-pink-200 hover:border-pink-300 bg-pink-50/30",
              green: "border-green-200 hover:border-green-300 bg-green-50/30",
            };
            const badgeClasses = {
              blue: "bg-blue-100 text-blue-700",
              purple: "bg-purple-100 text-purple-700",
              pink: "bg-pink-100 text-pink-700",
              green: "bg-green-100 text-green-700",
            };
            return (
              <Link
                key={tool.name}
                href={tool.href}
                className={`block p-6 border-2 rounded-lg hover:shadow-md transition-all backdrop-blur-sm ${colorClasses[tool.color as keyof typeof colorClasses]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-800">{tool.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${badgeClasses[tool.color as keyof typeof badgeClasses]}`}>
                    {tool.category}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  {tool.description}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-blue-50/50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">About</h3>
          <p className="text-gray-600">
            This is a collection of tools designed to help with time-consuming tasks in various
            academic courses. All calculations run in your browser - no data is sent to any server.
          </p>
        </div>
      </div>
    </main>
  );
}

