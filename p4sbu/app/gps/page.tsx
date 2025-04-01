// app/gps/page.tsx
'use client';
import { useState, useEffect } from 'react';

export default function GPSPage() {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(pos.coords),
        (err) => setError('Unable to retrieve your location.')
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">GPS & Navigation</h1>
      {error && <p className="text-red-500">{error}</p>}
      {location ? (
        <div>
          <p>Your current location:</p>
          <p>Latitude: {location.latitude}</p>
          <p>Longitude: {location.longitude}</p>
          {/* Integration with Google Maps API can go here */}
          <a href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View on Google Maps
          </a>
        </div>
      ) : (
        <p>Retrieving location...</p>
      )}
    </main>
  );
}
