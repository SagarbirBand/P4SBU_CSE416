"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Predefined spot types
const SPOT_TYPES = [
  'Faculty/Staff',
  'Commuter Premium',
  'Metered',
  'Commuter',
  'Resident',
  'ADA',
  'Reserved/Misc.',
  'State Vehicles Only',
  'Special Service Vehicles Only',
  'State and Special Service Vehicles',
  'EV Charging',
];

type Lot = {
  id: number;
  name: string;
  meterPrice: number;
};

type SpotCount = {
  name: string;
  count: number;
};

export default function ParkingManagementPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Spot counts per lot
  const [spotData, setSpotData] = useState<Record<number, SpotCount[]>>({});
  // Meter rates per lot
  const [meterRates, setMeterRates] = useState<Record<number, number>>({});

  // Editing & backups
  const [editing, setEditing] = useState<Record<number, boolean>>({});
  const [backupSpotData, setBackupSpotData] = useState<Record<number, SpotCount[]>>({});
  const [backupMeterRates, setBackupMeterRates] = useState<Record<number, number>>({});

  const router = useRouter();
  const [userID, setUserID] = useState<number | null>(null);

  // Fetch user info
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch('/api/login?includeUser=true');
        const json = await res.json();
        if (!json.loggedIn) { router.push('/login'); return; }
        setUserID(json.user.id);
      } catch {
        router.push('/login');
      }
    }
    fetchUserInfo();
  }, [router]);

  // Fetch lots and initialize data
  useEffect(() => {
    async function fetchLots() {
      try {
        setLoading(true);
        const res = await fetch('/api/parkingLots');
        if (!res.ok) throw new Error('Failed to load lots');
        const data: Lot[] = await res.json();
        setLots(data);

        // Initialize spot counts & meter rates
        const spotsInit: Record<number, SpotCount[]> = {};
        const ratesInit: Record<number, number> = {};
        data.forEach(lot => {
          spotsInit[lot.id] = SPOT_TYPES.map(name => ({ name, count: 0 }));
          ratesInit[lot.id] = lot.meterPrice;
        });
        setSpotData(spotsInit);
        setMeterRates(ratesInit);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLots();
  }, []);

  const filteredLots = lots.filter(lot =>
    lot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleEdit(lotId: number) {
    // backup
    setBackupSpotData(prev => ({ ...prev, [lotId]: [...(spotData[lotId] || [])] }));
    setBackupMeterRates(prev => ({ ...prev, [lotId]: meterRates[lotId] }));
    setEditing(prev => ({ ...prev, [lotId]: true }));
  }

  function handleCancel(lotId: number) {
    // revert
    setSpotData(prev => ({ ...prev, [lotId]: backupSpotData[lotId] }));
    setMeterRates(prev => ({ ...prev, [lotId]: backupMeterRates[lotId] }));
    setEditing(prev => ({ ...prev, [lotId]: false }));
  }

  function handleSave(lotId: number) {
    setEditing(prev => ({ ...prev, [lotId]: false }));
    // TODO: send spotData[lotId] and meterRates[lotId] to backend
  }

  function handleCountChange(lotId: number, idx: number, newCount: number) {
    setSpotData(prev => {
      const updated = [...prev[lotId]];
      updated[idx] = { ...updated[idx], count: newCount };
      return { ...prev, [lotId]: updated };
    });
  }

  function handleRateChange(lotId: number, newRate: number) {
    setMeterRates(prev => ({ ...prev, [lotId]: newRate }));
  }

  return (
    <main className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Parking Management</h1>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search parking lot…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-3 px-4 shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {/* Loading/Error */}
        {loading && <p className="text-center text-gray-800">Loading lots…</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {/* Lots */}
        {!loading && !error && (
          <div className="space-y-6">
            {filteredLots.map(lot => (
              <div key={lot.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{lot.name}</h2>
                  {editing[lot.id] ? (
                    <div className="space-x-2">
                      <button
                        onClick={() => handleSave(lot.id)}
                        className="bg-red-600 text-white rounded-md py-1 px-3 hover:bg-red-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => handleCancel(lot.id)}
                        className="bg-gray-300 text-gray-800 rounded-md py-1 px-3 hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(lot.id)}
                      className="bg-red-600 text-white rounded-md py-1 px-3 hover:bg-red-700"
                    >
                      Edit Rate & Spots
                    </button>
                  )}
                </div>

                {/* Meter Rate */}
                <div className="mb-4 flex justify-between items-center">
                  <span className="text-gray-800">Meter Rate ($/hr)</span>
                  {editing[lot.id] ? (
                    <input
                      type="number"
                      step="0.1"
                      value={meterRates[lot.id]}
                      onChange={e => handleRateChange(lot.id, parseFloat(e.target.value))}
                      className="ml-2 w-32 border border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  ) : (
                    <span className="font-medium text-gray-800">{meterRates[lot.id]?.toFixed(2)}</span>
                  )}
                </div>

                {/* Spot Types */}
                <div className="grid grid-cols-2 gap-4">
                  {spotData[lot.id]?.map((spt, idx) => (
                    <div key={spt.name} className="flex justify-between items-center">
                      <span className="text-gray-800">{spt.name}</span>
                      {editing[lot.id] ? (
                        <input
                          type="number"
                          min={0}
                          value={spt.count}
                          onChange={e => handleCountChange(lot.id, idx, parseInt(e.target.value))}
                          className="ml-2 w-20 border border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{spt.count}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
