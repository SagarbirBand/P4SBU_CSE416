// app/dashboard/page.tsx
'use client';
import Link from 'next/link';
import BGIMG from '../components/BGIMG';

// TODO: If admin, add lot management page to nav
// TODO: If not logged in, page must redirect to login WITHOUT RENDERING ANYTHING BEFOREHAND

export default function Dashboard() {
  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gray-100">
      <BGIMG url="/sbu-tree.jpg" />
      <div className="relative z-10 bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-black mb-6">Dashboard</h1>
        <nav className="flex flex-wrap gap-4 mb-6">
          <Link
            href="/profile"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Profile
          </Link>
          <Link
            href="/parking"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Find Parking
          </Link>
          <Link
            href="/reservations"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            My Reservations
          </Link>
          <Link
            href="/fines"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Fines
          </Link>
        </nav>
        <div className="text-gray-700">
          <p>
            Welcome to your dashboard. Here you can view your reservations, create new ones,
            update your profile, and check fines.
          </p>
        </div>
      </div>
    </main>
  );
}
