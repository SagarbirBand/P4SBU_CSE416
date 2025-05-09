"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  name?: string;
  email?: string;
  licensePlate?: string;
  isConfirmed? : boolean;
};

type Fine = {
  date: string;
  time: string;
  description: string;
  payBy: string;
  amount: number;
};

export default function GiveFinesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fine, setFine] = useState<Fine>({ date: '', time: '', description: '', payBy: '', amount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [finesMap, setFinesMap] = useState<Record<number, Fine[]>>({});
  const [expandedFines, setExpandedFines] = useState<Record<number, boolean>>({});

  const [userID, setUserID] = useState(0);
  const router = useRouter();
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/login?includeUser=true");
      const data = await res.json();
      if (!data.loggedIn || !data.user || !data.user.isAdmin) {
        router.push("/login");
        return;
      }
      setUserID(data.user.id);
    }
    fetchUser();
  }, [router]);


  
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');
        const data: User[] = await res.json();
        setUsers(data.filter(u => u.isConfirmed));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter(u =>
    u.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleSelect(user: User) {
    setSelectedUser(user);
    setError('');
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFine(prev => ({ ...prev, [name]: name === 'amount' ? parseFloat(value) : value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/fines/user/${selectedUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, ...fine }),
      });
      if (!res.ok) throw new Error('Failed to give fine');
      setSelectedUser(null);
      setFine({ date: '', time: '', description: '', payBy: '', amount: 0 });
      alert('Fine issued successfully');
    } catch (e: any) {
      setError(e.message);
    }
  }

  // Toggle and fetch fines for a user
  async function handleViewFines(userId: number) {
    if (expandedFines[userId]) {
      setExpandedFines(prev => ({ ...prev, [userId]: false }));
      return;
    }
    try {
      const res = await fetch(`/api/fines/user/${userId}`);
      if (!res.ok) throw new Error('Failed to load fines');
      const data: Fine[] = await res.json();
      setFinesMap(prev => ({ ...prev, [userId]: data }));
      setExpandedFines(prev => ({ ...prev, [userId]: true }));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Give Fine</h1>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by license plate…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-2 px-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {loading && <p className="text-gray-800">Loading users…</p>}
        {error && <p className="text-red-600 mb-4">Error: {error}</p>}

        {/* User list */}
        {!loading && !selectedUser && (
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <p className="text-gray-600">No users found.</p>
            ) : (
              filtered.map(user => (
                <div key={user.id}>
                  <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-800">{user.name || '—'}</p>
                      <p className="text-gray-600">{user.licensePlate}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelect(user)}
                        className="bg-red-600 text-white rounded-md py-1 px-4 hover:bg-red-700"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => handleViewFines(user.id)}
                        className="bg-blue-600 text-white rounded-md py-1 px-4 hover:bg-blue-700"
                      >
                        {expandedFines[user.id] ? 'Hide Fines' : 'View Fines'}
                      </button>
                    </div>
                  </div>
                  {expandedFines[user.id] && (
                    <div className="bg-white p-4 rounded-lg shadow-sm mt-2 space-y-2">
                      {(finesMap[user.id] && finesMap[user.id].length > 0) ? (
                        finesMap[user.id].map((f, idx) => (
                          <div key={idx} className="border-b pb-2">
                            <p className="text-gray-800">Date: {f.date} {f.time}</p>
                            <p className="text-gray-800">Description: {f.description}</p>
                            <p className="text-gray-800">Amount: ${f.amount.toFixed(2)}</p>
                            <p className="text-gray-800">Pay By: {f.payBy}</p>
                          </div>
                        ) )
                      ) : (
                        <p className="text-gray-600">No fines for this user.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Fine form */}
        {selectedUser && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">User: {selectedUser.licensePlate}</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  value={fine.date}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  name="time"
                  value={fine.time}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={fine.description}
                onChange={handleChange}
                className="mt-1 w-full border border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Pay By</label>
                <input
                  type="date"
                  name="payBy"
                  value={fine.payBy}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  value={fine.amount}
                  onChange={handleChange}
                  className="mt-1 w-full border border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-red-600 text-white rounded-md py-2 px-4 hover:bg-red-700"
              >
                Give Fine
              </button>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="bg-gray-300 text-gray-800 rounded-md py-2 px-4 hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
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
