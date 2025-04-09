"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Lot = {
  id?: number;
  name: string;
  // Include additional columns if your "parkingLots" table has them
};

export default function Reserve() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLots() {
      try {
        setLoading(true);
        setError("");
        // IMPORTANT: Fetch from /api/parkingLots
        const res = await fetch("/api/parkingLots");
        if (!res.ok) {
          throw new Error("Failed to fetch parking lots");
        }
        const data = await res.json();
        setLots(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLots();
  }, []);

  // Filter lots by matching the searchTerm
  const filteredLots = lots.filter((lot) =>
    lot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stub function for "Reserve" button
  function handleReserve(lotName: string) {
    // In a real app, you'd call your reservation endpoint
    alert(`Reserving lot: ${lotName}`);
  }

  return (
    <main className="min-h-screen p-8 bg-white">
      <h1 className="text-4xl font-bold text-red-600 text-center mb-8">
        Reserve a Parking Lot
      </h1>

      {/* Search Bar */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search by lot name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-400 rounded px-4 py-2 w-full max-w-md text-black"
        />
      </div>

      {/* Loading/Error States */}
      {loading && (
        <p className="text-center text-black">Loading parking lots...</p>
      )}
      {error && (
        <p className="text-center text-red-600">Error: {error}</p>
      )}

      {/* Display the list of filtered parking lots */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredLots.length === 0 ? (
            <p className="text-center text-black">No parking lots found.</p>
          ) : (
            filteredLots.map((lot) => (
              <div
                key={lot.name}
                className="border border-black rounded shadow-md p-4 flex items-center justify-between"
              >
                <span className="text-xl font-bold text-black">
                  {lot.name}
                </span>
                <button
                  onClick={() => handleReserve(lot.name)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reserve
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-black hover:text-red-600">
          &larr; Back to Home
        </Link>
      </div>
    </main>
  );
}
