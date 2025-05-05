"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type User = {
  [key: string]: any;
  id: number;
  authenticated: boolean;
};

export default function UserAuthPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();

  // Fetch all unauthenticated users
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');
        const data: User[] = await res.json();
        setUsers(data.filter(u => !u.isConfirmed));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Authenticate a user
  async function handleAuthenticate(userId: number) {
    try {
      const res = await fetch(`/api/users/${userId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      if (!res.ok) throw new Error('Failed to authenticate');
      setUsers((prev: any[]) => prev.filter((u: { id: number; }) => u.id !== userId));
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Deny a user (remove from pending list)
  async function handleDeny(userId: number) {
    try {
      const res = await fetch(`/api/users/${userId}/deny`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });
      if (!res.ok) throw new Error('Failed to deny');
      setUsers((prev: any[]) => prev.filter((u: { id: number; }) => u.id !== userId));
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Filter users by name, email, licensePlate, or id
  const filtered = users.filter((u: { name?: string; email?: string; licensePlate?: string; id: any; }) => {
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.licensePlate?.toLowerCase().includes(term) ||
      String(u.id).includes(term)
    );
  });

  return (
    <main className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Authentication</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, license, or id…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-3 px-4 shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {loading && <p className="text-center text-gray-800">Loading users…</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-600">No users pending authentication.</p>
            ) : (
              filtered.map((user: User) => (
                <div key={user.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      {Object.entries(user)
                        .filter(([key]) => key !== 'passBcrypt' && key !== 'authenticated')
                        .map(([key, val]) => (
                          <p key={key} className="text-gray-800">
                            <span className="font-semibold">{key}:</span> {String(val)}
                          </p>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAuthenticate(user.id)}
                        className="bg-red-600 text-white rounded-md py-1 px-4 hover:bg-red-700"
                      >
                        Authenticate
                      </button>
                      <button
                        onClick={() => handleDeny(user.id)}
                        className="bg-gray-400 text-white rounded-md py-1 px-4 hover:bg-gray-500"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
