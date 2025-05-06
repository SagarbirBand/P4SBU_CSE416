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
  meterRate: number;
  coordinates: string;
  capacityTotal: number;
};

type SpotCount = {
  name: string;
  count: number;
};

export default function ParkingManagementPage() {
  const router = useRouter();
  const [userID, setUserID] = useState<number | null>(null);

  // Lots + related data
  const [lots, setLots] = useState<Lot[]>([]);
  const [spotData, setSpotData] = useState<Record<number, SpotCount[]>>({});
  const [meterRates, setMeterRates] = useState<Record<number, number>>({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<Record<number, boolean>>({});
  const [backupSpotData, setBackupSpotData] = useState<Record<number, SpotCount[]>>({});
  const [backupMeterRates, setBackupMeterRates] = useState<Record<number, number>>({});

  // Add New Lot modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLotName, setNewLotName] = useState('');
  const [newMeterRate, setNewMeterRate] = useState(0);
  const [newCords, setNewCords] = useState('');
  const [newCapacity, setNewCapacity] = useState(0);
  const [newLocation, setNewLocation] = useState('');
  const [newSpotCounts, setNewSpotCounts] = useState<SpotCount[]>(
    SPOT_TYPES.map(name => ({ name, count: 0 }))
  );

  // Fetch user and lots
  useEffect(() => {
    async function init() {
      try {
        const resU = await fetch('/api/login?includeUser=true');
        const ju = await resU.json();
        if (!ju.loggedIn) return router.push('/login');
        setUserID(ju.user.id);

        const resL = await fetch('/api/parkingLots');
        if (!resL.ok) throw new Error('Failed to load lots');
        const dataL: Lot[] = await resL.json();
        setLots(dataL);

        // initialize spotData & rates
        const ratesInit: Record<number, number> = {};
        const spotsInit: Record<number, SpotCount[]> = {};
        dataL.forEach(l => {
          ratesInit[l.id] = l.meterRate;
          spotsInit[l.id] = SPOT_TYPES.map(name => ({ name, count: 0 }));
        });
        setMeterRates(ratesInit);
        setSpotData(spotsInit);

        // fetch spot types
        const resS = await fetch('/api/parkingSpotTypes');
        if (!resS.ok) throw new Error('Failed to load spot types');
        const allSpots: { lotID: number; permitType: string; currentAvailable: number }[] = await resS.json();
        const updatedSpots = { ...spotsInit };
        allSpots.forEach(s => {
          const arr = updatedSpots[s.lotID];
          const idx = SPOT_TYPES.indexOf(s.permitType);
          if (idx >= 0) arr[idx].count = s.currentAvailable;
        });
        setSpotData(updatedSpots);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  const filteredLots = lots.filter(lot =>
    lot.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers for edit, delete, save, cancel
  function handleEdit(lotId: number) {
    setBackupSpotData(prev => ({ ...prev, [lotId]: [...spotData[lotId]] }));
    setBackupMeterRates(prev => ({ ...prev, [lotId]: meterRates[lotId] }));
    setEditing(prev => ({ ...prev, [lotId]: true }));
  }
  function handleCancel(lotId: number) {
    setSpotData(prev => ({ ...prev, [lotId]: backupSpotData[lotId] }));
    setMeterRates(prev => ({ ...prev, [lotId]: backupMeterRates[lotId] }));
    setEditing(prev => ({ ...prev, [lotId]: false }));
  }


  async function handleSave(lotId: number) {

    //first update meterRate in parkingLots
    const res = await fetch(`/api/parkingLots/byID/${lotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meterRate: meterRates[lotId] }),
    });
    if (!res.ok) return alert('Failed to update meter rate');

    //then update spotTypes capacity + currentAvailable

    //get backup to compare if we need to create or del
    const prev = backupSpotData[lotId];
    const curr = spotData[lotId];

    const prevMap = Object.fromEntries(prev.map(s => [s.name, s.count]));
    const currMap = Object.fromEntries(curr.map(s => [s.name, s.count]));

    await Promise.all(
      Array.from(new Set([...Object.keys(prevMap), ...Object.keys(currMap)])).map(async name => {
        const prevCount = prevMap[name] || 0; //get count for old permit type
        const currCount = currMap[name] || 0; //get count for curr permit type

        //get spotID + # of reservations active with spotID
        const resSpotData = await fetch(`/api/parkingSpotTypes/activeRes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lotID: lotId, permitType: name }),
        })
        const responseData = await resSpotData.json();
        const activeRes = responseData.activeReservations;

        if (prevCount === 0 && currCount > 0) {
          // create
          return fetch('/api/parkingSpotTypes/createSpotType', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lotID: lotId,
              permitType: name,
              count: currCount,
              currentAvailable: currCount,
            }),
          });
        } 
        else if (prevCount > 0 && currCount === 0) {
          // delete
          return fetch(`/api/parkingSpotTypes/${lotId}/${encodeURIComponent(name)}`, {
            method: 'DELETE',
          });
        } 
        else if (prevCount !== currCount && currCount > 0) {
          // update
          let newCurr = currCount - activeRes;
          return fetch(`/api/parkingSpotTypes/${lotId}/${encodeURIComponent(name)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              count: currCount,
              currentAvailable: newCurr, //can be negative but its okay. Worst case delete and then recreate upon SHRINKING
            }),
          });
        }

        return Promise.resolve(); //checkifnec
      })
    );

    setEditing(prev => ({ ...prev, [lotId]: false }));
  }


  async function handleDelete(lotId: number) {
    if (!confirm('Delete this lot?')) return;
    const res = await fetch(`/api/parkingLots/byID/${lotId}`, { method: 'DELETE' });
    if (res.ok) setLots(prev => prev.filter(l => l.id !== lotId));
    else alert('Failed to delete');
  }

  function handleSpotCountChange(lotId: number, idx: number, count: number) {
    setSpotData(prev => {
      const arr = [...prev[lotId]];
      arr[idx] = { ...arr[idx], count };
      return { ...prev, [lotId]: arr };
    });
  }
  function handleRateChange(lotId: number, rate: number) {
    setMeterRates(prev => ({ ...prev, [lotId]: rate }));
  }

  // Add New Lot Modal Actions
  async function handleAddSave() {
    if (!newLotName) return alert('Name required');
    const newCapacity = newSpotCounts.reduce((sum, s) => sum + s.count, 0);
    // create lot
    const res = await fetch('/api/parkingLots/createLot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLotName, meterRate: newMeterRate, coordinates: newCords, capacityTotal: newCapacity, location: newLocation }),
    });
    if (!res.ok) return alert('Failed to create lot');
    const resJson = await res.json();
    const created: Lot = resJson.data;
    console.log(created.id);
    // create spot types
    await Promise.all(
      newSpotCounts.filter(s => s.count > 0).map(s =>
        fetch('/api/parkingSpotTypes/createSpotType', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lotID: created.id, permitType: s.name, count: s.count, currentAvailable: s.count }),
        })
      )
    );
    // refresh local data
    setLots(prev => [...prev, created]);
    setMeterRates(prev => ({ ...prev, [created.id]: created.meterRate }));
    setSpotData(prev => ({ ...prev, [created.id]: newSpotCounts }));
    // reset and close
    setNewLotName(''); setNewMeterRate(0); setNewCords(''); setNewCapacity(0); setNewLocation('');
    setNewSpotCounts(SPOT_TYPES.map(name => ({ name, count: 0 })));
    setShowAddModal(false);
  }

  return (
    <main className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Parking Management</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Add New Lot
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search parking lot…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full border-gray-300 rounded-lg py-3 px-4 shadow-sm text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>

        {/* Loading / Error */}
        {loading && <p className="text-center text-gray-800">Loading lots…</p>}
        {error && <p className="text-center text-red-600">Error: {error}</p>}

        {/* Lot cards */}
        {!loading && !error && (
          <div className="space-y-6">
            {filteredLots.map(lot => (
              <div key={lot.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{lot.name}</h2>
                  <div className="space-x-2">
                    {editing[lot.id] ? (
                      <>
                        <button onClick={() => handleSave(lot.id)} className="bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700">Save</button>
                        <button onClick={() => handleCancel(lot.id)} className="bg-gray-300 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-400">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(lot.id)} className="bg-red-600 text-white py-1 px-3 rounded-md hover:bg-red-700">Edit Rate & Spots</button>
                        <button onClick={() => handleDelete(lot.id)} className="bg-gray-300 text-gray-800 py-1 px-3 rounded-md hover:bg-gray-400">Delete</button>
                      </>
                    )}
                  </div>
                </div>
                {/* Rate */}
                <div className="mb-4 flex justify-between items-center">
                  <span className="text-gray-800">Meter Rate ($/hr)</span>
                  {editing[lot.id] ? (
                    <input type="number" step="0.1" value={meterRates[lot.id]} onChange={e => handleRateChange(lot.id, parseFloat(e.target.value))} className="w-32 border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400" />
                  ) : (
                    <span className="font-medium text-gray-800">{meterRates[lot.id].toFixed(2)}</span>
                  )}
                </div>
                {/* Spots grid */}
                <div className="grid grid-cols-2 gap-4">
                  {spotData[lot.id]?.map((spt, idx) => (
                    <div key={spt.name} className="flex justify-between items-center">
                      <span className="text-gray-800">{spt.name}</span>
                      {editing[lot.id] ? (
                        <input type="number" min={0} value={spt.count} onChange={e => handleSpotCountChange(lot.id, idx, parseInt(e.target.value))} className="w-20 border-gray-300 rounded-md py-1 px-2 text-black focus:outline-none focus:ring-2 focus:ring-red-400" />
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

        {/* Go back */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            &larr; Back to Home
          </Link>
        </div>
      </div>

      {/* Add New Lot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Add New Parking Lot</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input value={newLotName} onChange={e => setNewLotName(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input value={newLocation} onChange={e => setNewLocation(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Meter Rate ($/hr)</label>
                <input type="number" step="0.1" value={newMeterRate} onChange={e => setNewMeterRate(parseFloat(e.target.value))} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Coordinates ex.(x,y)</label>
                <input value={newCords} onChange={e => setNewCords(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm p-2 text-black" />
              </div>
              <div className="grid grid-cols-2 gap-4 max-h-64 overflow-auto">
                {newSpotCounts.map((s, i) => (
                  <div key={s.name} className="flex justify-between items-center text-black">
                    <span>{s.name}</span>
                    <input type="number" min={0} value={s.count} onChange={e => {
                      const cnt = parseInt(e.target.value);
                      setNewSpotCounts(prev => {
                        const arr = [...prev]; arr[i] = { ...arr[i], count: cnt }; return arr;
                      });
                    }} className="w-16 border-gray-300 rounded-md shadow-sm p-1 text-black" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleAddSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
