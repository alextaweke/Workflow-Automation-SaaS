import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
          Workflow SaaS
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Simple team task management
        </p>
        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full bg-blue-600 text-white py-4 px-8 rounded-xl hover:bg-blue-700 font-semibold text-lg"
          >
            Get Started
          </Link>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Demo Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
