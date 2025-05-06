'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Order = {
  id: number;
  userID: number;
  spotID: number;
  paymentID: string;
  startTime: string;
  endTime: string;
  numSlots: number;
  isApproved: boolean;
};

export default function OrderAuthPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await fetch('/api/bulkReserve');
        if (!res.ok) throw new Error('Failed to load orders');
        const data: Order[] = await res.json();
        setOrders(data.filter(order => !order.isApproved));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  async function handleConfirm(orderId: number) {
    try {
      const res = await fetch(`/api/bulkReserve/${orderId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to confirm order');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDeny(orderId: number) {
    try {
      const res = await fetch(`/api/bulkReserve/${orderId}/deny`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to deny order');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e: any) {
      setError(e.message);
    }
  }

  const filteredOrders = orders.filter(order =>
    Object.values(order)
      .map(val => String(val).toLowerCase())
      .some(str => str.includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Order Authentication</h1>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search orders by ID, userID, spotID…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-3 px-4 shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {loading && <p className="text-center text-gray-800">Loading orders…</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <div className="space-y-6">
            {filteredOrders.length === 0 ? (
              <p className="text-center text-gray-600">No orders pending authentication.</p>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 text-gray-800">
                      <p><span className="font-semibold">Order ID:</span> {order.id}</p>
                      <p><span className="font-semibold">User ID:</span> {order.userID}</p>
                      <p><span className="font-semibold">Spot ID:</span> {order.spotID}</p>
                      <p><span className="font-semibold">Start Time:</span> {order.startTime}</p>
                      <p><span className="font-semibold">End Time:</span> {order.endTime}</p>
                      <p><span className="font-semibold">Slots:</span> {order.numSlots}</p>
                      <p><span className="font-semibold">Approved:</span> {order.isApproved ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleConfirm(order.id)}
                        className="bg-green-600 text-white rounded-md py-1 px-4 hover:bg-green-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleDeny(order.id)}
                        className="bg-gray-500 text-white rounded-md py-1 px-4 hover:bg-gray-600"
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