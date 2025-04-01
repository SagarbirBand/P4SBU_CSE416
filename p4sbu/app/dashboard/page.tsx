// app/dashboard/page.tsx
'use client';
import Link from 'next/link';

export default function Dashboard() {
  // This page would typically fetch user info from session or API
  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <nav>
          <Link href="/profile" className="mr-4 text-blue-600">
            Profile
          </Link>
          <Link href="/parking" className="mr-4 text-blue-600">
            Find Parking
          </Link>
          <Link href="/reservations" className="text-blue-600">
            My Reservations
          </Link>
        </nav>
      </header>
      <section>
        <p>Welcome to your dashboard. Here you can view your reservations, update your profile, and check fines.</p>
      </section>
    </main>
  );
}
