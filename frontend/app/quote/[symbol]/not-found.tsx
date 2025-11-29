import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <h1 className="text-4xl font-bold mb-4">404 - Stock Not Found</h1>
      <p className="text-gray-600 mb-6">
        The stock symbol you&apos;re looking for doesn&apos;t exist or is
        invalid.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-500"
      >
        Go back to home
      </Link>
    </div>
  );
}
