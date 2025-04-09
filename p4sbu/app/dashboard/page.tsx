/* 
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BGIMG from '../components/BGIMG';

export default function Dashboard() {
  const router = useRouter();

  // On mount, check if the user is logged in. If not, redirect to login.
  useEffect(() => {
    async function checkLogin() {
      try {
        const res = await fetch('/api/login', { method: 'GET' });
        const data = await res.json();
        if (!data.loggedIn) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking login status', error);
        router.push('/login');
      }
    }
    checkLogin();
  }, [router]);

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
            href="/reserve"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reserve Now
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
*/


'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BGIMG from '../components/BGIMG';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  type User = {
    name: string;
    email: string;
    passBcrypt: string;
    permitType: string;
    licensePlate: string;
    address: string;
    isAuth: boolean;
  };

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        // 1. Check login status and get user ID
        const loginRes = await fetch('/api/login?includeUser=true');
        const loginData = await loginRes.json();

        if (!loginData.loggedIn) {
          router.push('/login');
          return;
        }

        const userID = loginData.user?.id;
        if (!userID) {
          throw new Error('User ID not found');
        }

        // 2. Fetch user data from your user route
        const userRes = await fetch(`/api/users/${userID}`);
        const userData = await userRes.json();

        if (userData.error) {
          throw new Error(userData.error);
        }

        setUser(userData);
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.push('/login');
      }
    }

    fetchUserInfo();
  }, [router]);

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gray-100">
      <BGIMG url="/sbu-tree.jpg" />
      <div className="relative z-10 bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-black mb-6">Dashboard</h1>

        {user && (
          <div className="mb-4 text-gray-800">
            <p className="text-lg font-medium">Welcome, {user.name}!</p>
            <p className="text-sm text-gray-600">Email: {user.email}</p>
            <p className="text-sm text-gray-600">License Plate: {user.licensePlate}</p>
          </div>
        )}

        <nav className="flex flex-wrap gap-4 mb-6">
          <Link href="/profile" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Profile</Link>
          <Link href="/parking" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Find Parking</Link>
          <Link href="/reservations" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">My Reservations</Link>
          <Link href="/fines" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Fines</Link>
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

