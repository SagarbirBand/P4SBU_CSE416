// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to P4SBU Parking System</h1>
      <p className="mb-6">Reserve your parking spot at Stony Brook University easily!</p>
      <div className="flex space-x-4">
        <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Login
        </Link>
        <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          Register
        </Link>
      </div>
      <div className="mt-8">
        <Link href="/contact" className="text-blue-500 hover:underline">
          Contact Us
        </Link>
      </div>
    </main>
  );
}
