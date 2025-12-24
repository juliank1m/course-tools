import Link from "next/link";
import Image from "next/image";

const tools = [
  {
    name: "Linear Algebra",
    description: "Matrix operations, determinants, eigenvalues, and more",
    href: "/tools/linear-algebra",
    category: "Math",
    color: "blue",
  },
  {
    name: "Vector Math",
    description: "Vector operations, projections, and geometric equations",
    href: "/tools/vectors",
    category: "Math",
    color: "blue",
  },
  {
    name: "CS Tools",
    description: "Algorithm analysis, number conversions, and CS utilities",
    href: "/tools/cs",
    category: "Computer Science",
    color: "green",
  },
  {
    name: "Calculus",
    description: "Derivatives, integrals, limits, and series",
    href: "/tools/calculus",
    category: "Math",
    color: "purple",
  },
  {
    name: "Proofs",
    description: "Proof helpers and logical reasoning tools",
    href: "/tools/proofs",
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
];

export default function Home() {
  return (
    <main className="min-h-screen px-4 pt-2 pb-8 md:px-10 md:pt-4 md:pb-12 bg-gradient-to-br from-pink-50/60 via-blue-50/60 to-purple-50/60">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-start gap-2 mb-4 md:mb-6">
          <Image
            src="/logo.png"
            alt="JKCT Logo"
            width={240}
            height={80}
            sizes="(max-width: 640px) 160px, (max-width: 768px) 208px, 240px"
            className="w-40 sm:w-52 md:w-60 h-auto drop-shadow-sm"
            priority
          />
          <p className="text-base sm:text-lg md:text-xl text-gray-700">
            Smart, beautifully designed tools for{" "}
            <span className="font-semibold text-blue-400">math</span>,{" "}
            <span className="font-semibold text-purple-400">computer science</span>, and{" "}
            <span className="font-semibold text-pink-400">science</span> courses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
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
                className={`block p-4 sm:p-6 border-2 rounded-lg hover:shadow-md transition-all backdrop-blur-sm ${colorClasses[tool.color as keyof typeof colorClasses]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">{tool.name}</h2>
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

        <div className="mt-8 md:mt-10 p-6 bg-blue-50/50 rounded-lg border border-blue-200">
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

