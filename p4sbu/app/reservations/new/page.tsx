// app/reservations/new/page.tsx
'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function NewReservationPage() {
  const searchParams = useSearchParams();
  const lotId = searchParams.get('lotId');
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState('');
  const [reservationDuration, setReservationDuration] = useState('');
  const [error, setError] = useState('');

  const handleReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotId, vehicleType, reservationDuration }),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Reservation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <main className="min-h-screen p-4 bg-gray-50">
      <form onSubmit={handleReservation} className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Reserve Parking Spot</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label>Vehicle Type:</label>
          <input
            type="text"
            className="mt-1 p-2 border rounded w-full"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label>Reservation Duration (hours):</label>
          <input
            type="number"
            className="mt-1 p-2 border rounded w-full"
            value={reservationDuration}
            onChange={(e) => setReservationDuration(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Confirm Reservation
        </button>
      </form>
    </main>
  );
}
