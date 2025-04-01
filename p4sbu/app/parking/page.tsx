// app/parking/page.tsx
'use client';
import { useState, useEffect } from 'react';

interface ParkingLot {
  id: number;
  name: string;
  capacity: number;
  costPerHour: number;
  distance: number; // distance from selected building
}

export default function ParkingPage() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [filter, setFilter] = useState<'proximity' | 'cost' | 'capacity'>('proximity');

  useEffect(() => {
    // Fetch parking lots from API (stubbed)
    async function fetchLots() {
      const res = await fetch('/api/parking/lots');
      const data = await res.json();
      setLots(data);
    }
    fetchLots();
  }, []);

  const sortedLots = lots.sort((a, b) => {
    if (filter === 'proximity') return a.distance - b.distance;
    if (filter === 'cost') return a.costPerHour - b.costPerHour;
    if (filter === 'capacity') return b.capacity - a.capacity;
    return 0;
  });

  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">Available Parking Lots</h1>
      <div className="mb-4">
        <label className="mr-2">Sort By:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="p-2 border rounded">
          <option value="proximity">Proximity</option>
          <option value="cost">Cost</option>
          <option value="capacity">Capacity</option>
        </select>
      </div>
      <ul className="space-y-4">
        {sortedLots.map((lot) => (
          <li key={lot.id} className="p-4 bg-white shadow rounded">
            <h2 className="text-xl font-semibold">{lot.name}</h2>
            <p>Capacity: {lot.capacity}</p>
            <p>Cost per Hour: ${lot.costPerHour}</p>
            <p>Distance: {lot.distance} meters</p>
            <a href={`/reservations/new?lotId=${lot.id}`} className="text-blue-600 hover:underline">
              Reserve Now
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
