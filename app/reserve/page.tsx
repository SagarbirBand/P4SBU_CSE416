// app/parking/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildingCoordinates, BuildingName } from '../components/buildings';
import {
  useLoadScript,
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from '@react-google-maps/api';

// ↓ NEW STRIPE IMPORTS ↓
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

type Coordinates = [number, number];
type LatLngLiteral = google.maps.LatLngLiteral;

interface ParkingLotApi {
  id: number;
  name: string;
  location: string;
  coordinates: string; // "(lat, lng)"
  meterRate: number;
}
interface ParkingSpotTypeApi {
  id: number;
  lotID: number;
  permitType: string;
  count: number;
  currentAvailable: number;
}
type ParkingSpotType = ParkingSpotTypeApi;

type LotWithTypes = {
  id: number;
  name: string;
  location: string;
  coordinates: Coordinates;
  types: ParkingSpotType[];
  distance?: number;
  remainingCapacity: number;
  typesToShow?: ParkingSpotType[];
  meterRate: number;
};

interface SelectedReservation {
  lotName: string;
  permitType: string;
  start: string;
  end: string;
  meterRate: number;
  spotTypeID: number;
  quantity: number;
}

const ALL_PERMIT_TYPES = [
  'Faculty/Staff',
  'Resident',
  'ADA',
  'Commuter Premium',
  'Reserved/Misc.',
  'State and Special Service Vehicles',
  'State Vehicles',
  'Special Service Vehicles',
  'EV Charging',
  'Metered',
  'Commuter',
] as const;
type PermitType = typeof ALL_PERMIT_TYPES[number];

const toLatLng = ([lat, lng]: Coordinates): LatLngLiteral => ({ lat, lng });
const defaultCenter: LatLngLiteral = toLatLng(
  buildingCoordinates['Stony Brook Union']
);
const defaultZoom = 15;

/** Format a Date to local `YYYY-MM-DDTHH:00` */
function toLocalHourString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:00`;
}

function calculateCost(
  start: string | null | undefined,
  end: string | null | undefined,
  rate: number | null | undefined,
  permitType?: string | null,
  quantity: number = 1
): number {
  
  // Return 0 if any required parameter is missing
  if (!start || !end || rate == null || !permitType) {
    return 0;
  }
  // Return 0 if the permit type is not "Metered"
  if (permitType !== 'Metered') {
    return 0;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  return diffHours * rate * quantity;
}

// ─── INITIALIZE STRIPE.JS ───────────────────────────────
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Wrap client UI in Elements so useStripe/useElements work
export default function ParkingPage() {
  return (
    <Elements stripe={stripePromise}>
      <ParkingPageContent />
    </Elements>
  );
}

function ParkingPageContent() {
  // ─── State ───────────────────────────────────────────────
  const [lots, setLots] = useState<LotWithTypes[]>([]);
  const [allTypes] = useState<PermitType[]>([...ALL_PERMIT_TYPES]);

  const [userID, setUserID] = useState<number | null>(null);
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<PermitType[]>([]);
  const [hideFull, setHideFull] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);

  const [listSortBy, setListSortBy] = useState<'capacity' | 'proximity'>(
    'capacity'
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Time pickers: default to next full hour +1h
  const [startTime, setStartTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return toLocalHourString(now);
  });
  const [endTime, setEndTime] = useState<string>(() => {
    const later = new Date();
    later.setMinutes(0, 0, 0);
    later.setHours(later.getHours() + 2);
    return toLocalHourString(later);
  });

  const [buildingQuery, setBuildingQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<
    BuildingName | null
  >(null);
  const filteredBuildings = useMemo(
    () =>
      (Object.keys(buildingCoordinates) as BuildingName[]).filter((b) =>
        b.toLowerCase().includes(buildingQuery.toLowerCase())
      ),
    [buildingQuery]
  );

  const [mapView, setMapView] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [customOrigin, setCustomOrigin] = useState<Coordinates | null>(null);
  const [activeCount, setActiveCount] = useState<number>(0);

  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [directions, setDirections] = useState<
    google.maps.DirectionsResult | null
  >(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(true);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<SelectedReservation | null>(null);
  const [paymentError, setPaymentError] = useState('');

  // ─── Stripe hooks (inside Elements) ─────────────────────
  const stripe = useStripe();
  const elements = useElements();

  // ─── Fetch user and initialize ───────────────────────────
  useEffect(() => {
    async function fetchUserInfo() {
      const loginRes = await fetch('/api/login?includeUser=true');
      const loginData = await loginRes.json();
      if (!loginData.loggedIn) {
        router.push('/login');
        return;
      }
      setUserID(loginData.user.id);
      const r = await fetch(`/api/reservations/user/${loginData.user.id}`);
      const arr = await r.json();
      setActiveCount(arr.filter((x: any) => new Date(x.endTime) > new Date()).length);
    }
    fetchUserInfo();
  }, [router]);

  // ─── Fetch lots & types ───────────────────────────────────
  useEffect(() => {
    async function load() {
      const [resLots, resTypes] = await Promise.all([
        fetch('/api/parkingLots'),
        fetch('/api/parkingSpotTypes'),
      ]);
      const rawLots: ParkingLotApi[] = await resLots.json();
      const rawTypes: ParkingSpotTypeApi[] = await resTypes.json();

      const baseLots: LotWithTypes[] = rawLots.map((l) => {
        const [lat, lng] = l.coordinates
          .slice(1, -1)
          .split(',')
          .map((s) => parseFloat(s.trim()));
        return {
          id: l.id,
          name: l.name,
          location: l.location,
          coordinates: [lat, lng],
          types: [],
          distance: undefined,
          remainingCapacity: 0,
          meterRate: l.meterRate,
        };
      });

      const byLot: Record<number, ParkingSpotType[]> = {};
      rawTypes.forEach((t) => (byLot[t.lotID] ||= []).push(t));

      setLots(
        baseLots.map((l) => ({
          ...l,
          types: byLot[l.id] || [],
        }))
      );
    }
    load();
  }, []);

  // ─── EUCLIDEAN DISTANCE ────────────────────────────────
  const recalcDistances = useCallback(
    (origin: Coordinates) => {
      if (!lots.length) return;
      setLots((cur) =>
        cur.map((l) => {
          const [lat, lng] = l.coordinates;
          const dx = origin[0] - lat;
          const dy = origin[1] - lng;
          return { ...l, distance: Math.sqrt(dx * dx + dy * dy) };
        })
      );
    },
    []
  );

  // ─── Recalc on origin change ──────────────────────────────
  useEffect(() => {
    let origin: Coordinates | null = null;
    if (mapView && selectedBuilding)
      origin = buildingCoordinates[selectedBuilding];
    else if (mapView && customOrigin) origin = customOrigin;
    else if (
      !mapView &&
      listSortBy === 'proximity' &&
      (selectedBuilding || customOrigin)
    ) {
      origin = selectedBuilding
        ? buildingCoordinates[selectedBuilding]
        : customOrigin!;
    }
    if (origin) recalcDistances(origin);
  }, [mapView, listSortBy, selectedBuilding, customOrigin, recalcDistances]);

  // ─── Toggle view & reset ────────────────────────────────
  const toggleView = () => {
    setMapView((v) => !v);
    setSelectMode(false);
    setCustomOrigin(null);
    setSelectedBuilding(null);
    setBuildingQuery('');
    setSelectedLot(null);
  };

  // ─── Time handlers ───────────────────────────────────────
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartTime(newStart);
    if (newStart >= endTime) {
      const d = new Date(newStart);
      d.setHours(d.getHours() + 1);
      setEndTime(toLocalHourString(d));
    }
  };
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    if (newEnd > startTime) setEndTime(newEnd);
  };

  // ─── Compute walking route ───────────────────────────────
  useEffect(() => {
    if (selectedLot !== null && map) {
      const lot = lots.find((l) => l.id === selectedLot)!;
      const originLoc = new google.maps.LatLng(
        lot.coordinates[0],
        lot.coordinates[1]
      );
      const dest = selectedBuilding
        ? new google.maps.LatLng(...buildingCoordinates[selectedBuilding])
        : customOrigin
        ? new google.maps.LatLng(...customOrigin)
        : null;
      if (dest) {
        new google.maps.DirectionsService().route(
          {
            origin: originLoc,
            destination: dest,
            travelMode: google.maps.TravelMode.WALKING,
          },
          (result, status) => {
            if (status === 'OK' && result) {
              setDirections(result);
              map.fitBounds(result.routes[0].bounds);
            }
          }
        );
      }
    }
  }, [selectedLot, map, selectedBuilding, customOrigin, lots]);

  // ─── Reset on deselect ───────────────────────────────────
  useEffect(() => {
    if (selectedLot === null && map) {
      setDirections(null);
      map.panTo(defaultCenter);
      map.setZoom(defaultZoom);
    }
  }, [selectedLot, map]);

  // ─── Prepare displayLots ─────────────────────────────────
  const displayLots = useMemo(() => {
    return lots
      .filter((l) =>
        searchTerm ? l.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
      )
      .map((l) => {
        const matching = selectedTypes.length
          ? l.types.filter((t) =>
              selectedTypes.includes(t.permitType as PermitType)
            )
          : l.types;
        const typesToShow = hideFull
        ? matching.filter((t) => t.currentAvailable >= quantity)
        : matching;
        const remainingCapacity = typesToShow.reduce(
          (sum, t) => sum + t.currentAvailable,
          0
        );
        return {
          ...l,
          remainingCapacity,
          hasMatch: !selectedTypes.length || matching.length > 0,
          typesToShow,
        };
      })
      .filter((l) => l.hasMatch)
      .filter((l) => (hideFull ? l.remainingCapacity > quantity : true))
      .sort((a, b) => {
        if (!mapView) {
          if (listSortBy === 'proximity') {
            const da = a.distance ?? Infinity,
                  db = b.distance ?? Infinity;
            if (da !== db) return da - db;
          }
          return b.remainingCapacity - a.remainingCapacity;
        } else {
          if (selectedBuilding || customOrigin) {
            const da = a.distance ?? Infinity,
                  db = b.distance ?? Infinity;
            if (da !== db) return da - db;
          }
          return b.remainingCapacity - a.remainingCapacity;
        }
      });
  }, [
    lots,
    searchTerm,
    selectedTypes,
    hideFull,
    listSortBy,
    mapView,
    selectedBuilding,
    customOrigin,
    quantity
  ]);

  // ─── RESERVATION & PAYMENT ──────────────────────────────
// ─── 1) Reserve button handler: free vs paid, skip modal when free ───
const handleReserve = async (
  lotName: string,
  permitType: string,
  start: string,
  end: string,
  meterRate: number,
  spotTypeID: number,
  quantity: number
) => {
  // Compute cost & admin‐approval need
  const amount = calculateCost(start, end, meterRate, permitType, quantity);
  const needsAdmin = quantity >= 3 || (activeCount + quantity) >= 3;

  if (amount === 0) {
    // FREE case: no modal
    if (needsAdmin) {
      alert('Your free reservation request has been submitted for approval.');
    } else {
      // Create 'quantity' free reservations (paymentID 57)
      for (let i = 0; i < quantity; i++) {
        await fetch('/api/reservations/createReservation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userID,
            spotID: spotTypeID,
            paymentID: 57,
            startTime: start,
            endTime: end,
          }),
        });
      }
      alert('Reservation successful!');
    }
    return;
  }

  // PAID case: show modal
  setSelectedReservation({ lotName, permitType, start, end, meterRate, spotTypeID, quantity });
  setPaymentError('');
  setShowModal(true);
};

// ─── 2) Modal “Pay & Reserve” / “Request” flow ───────────────────────
const handleReservationSubmit = async () => {
  if (!selectedReservation || userID === null) return;

  const { start, end, meterRate, permitType, spotTypeID, quantity } = selectedReservation;
  const amount = calculateCost(start, end, meterRate, permitType, quantity);
  const needsAdmin = quantity >= 3 || (activeCount + quantity) >= 3;

  // Paid + admin‐requesting: skip Stripe, just notify
  if (needsAdmin) {
    setShowModal(false);
    alert('Your paid reservation request has been submitted for approval.');
    return;
  }

  // Paid + immediate: run Stripe
  if (!stripe || !elements) {
    setPaymentError('Stripe has not loaded yet.');
    return;
  }

  // 1) Create Stripe PaymentIntent
  const init = await fetch('/api/payments/createPayment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userID, amount }),
  });
  if (!init.ok) {
    const err = await init.json();
    setPaymentError(err.error || 'Payment init failed');
    return;
  }
  const { clientSecret, paymentIntentId } = await init.json();

  // 2) Confirm with Stripe.js
  const { error: payErr, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    { payment_method: { card: elements.getElement(CardElement)! } }
  );
  if (payErr || paymentIntent?.status !== 'succeeded') {
    setPaymentError(payErr?.message || 'Payment failed');
    return;
  }

  // 3) Create 'quantity' reservations with same paymentIntentId
  for (let i = 0; i < quantity; i++) {
    const res = await fetch('/api/reservations/createReservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userID,
        spotID: spotTypeID,
        paymentID: parseInt(paymentIntent.id, 10),
        startTime: start,
        endTime: end,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      setPaymentError(err.error || 'Reservation failed');
      return;
    }
  }

  setShowModal(false);
  alert('Reservation successful!');
};


  // ─── RENDER ───────────────────────────────────────────────
  if (mapView && !isLoaded)
    return <div className="p-4 text-black">Loading map…</div>;

  return (
    <main className="flex flex-col">
      {/* Header */}
      <header className="flex items-center p-4 border-b text-black">
        <input
          className="border p-2 flex-1 mr-4 text-black"
          placeholder="Search lots…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600 active:bg-green-700"
          onClick={toggleView}
        >
          {mapView ? 'List View' : 'Map View'}
        </button>
        {mapView && (
          <button
            className={`px-4 py-2 rounded ${
              selectMode
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
            } text-white`}
            onClick={() => {
              setSelectMode((s) => !s);
              setSelectedBuilding(null);
              setBuildingQuery('');
              setSelectedLot(null);
            }}
          >
            {selectMode ? 'Cancel Pin' : 'Drop Pin'}
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Filters */}
        <aside className="w-64 resize-x min-w-[240px] max-w-[50%] hover:cursor-col-resize border-r p-4 flex flex-col text-black overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Filters</h2>
            <button onClick={() => setFiltersOpen((o) => !o)}>
              {filtersOpen ? '▲' : '▼'}
            </button>
          </div>

          {filtersOpen && (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block font-medium text-black">Start</label>
                <input
                  type="datetime-local"
                  step={3600}
                  value={startTime}
                  onChange={handleStartChange}
                  className="border p-2 w-full text-black"
                />
              </div>
              <div>
                <label className="block font-medium text-black">End</label>
                <input
                  type="datetime-local"
                  step={3600}
                  value={endTime}
                  onChange={handleEndChange}
                  className="border p-2 w-full text-black"
                />
              </div>
              <div className="mt-4">
                <label className="font-medium text-black">Quantity</label>
                <div className="inline-flex items-center ml-2">
                <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-2 py-1 bg-gray-200 rounded-l"
                  >−</button>
                <span className="px-4 py-1 border-t border-b text-center">{quantity}</span>
                <button
                    onClick={() => setQuantity(q => q + 1)}
                    className="px-2 py-1 bg-gray-200 rounded-r"
                  >+</button>
                </div>
              </div>
              {!mapView && (
                <div>
                  <label className="block font-medium text-black">Sort</label>
                  <select
                    className="border p-2 w-full text-black"
                    value={listSortBy}
                    onChange={(e) =>
                      setListSortBy(e.target.value as any)
                    }
                  >
                    <option value="capacity">Available Spots</option>
                    <option value="proximity">Proximity</option>
                  </select>
                </div>
              )}
              {(mapView || listSortBy === 'proximity') && (
                <div>
                  <label className="block font-medium text-black">
                    Building
                  </label>
                  {selectedBuilding ? (
                    <div className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded">
                      <span>{selectedBuilding}</span>
                      <button
                        className="ml-2 font-bold"
                        onClick={() => {
                          setSelectedBuilding(null);
                          setBuildingQuery('');
                          setCustomOrigin(null);
                          setSelectedLot(null);
                          if (map) {
                            map.panTo(defaultCenter);
                            map.setZoom(defaultZoom);
                          }
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        className="border p-2 w-full text-black"
                        placeholder="Select building…"
                        value={buildingQuery}
                        onChange={(e) => {
                          setBuildingQuery(e.target.value);
                          setSelectedBuilding(null);
                          setCustomOrigin(null);
                          setSelectedLot(null);
                        }}
                      />
                      {buildingQuery && (
                        <ul className="absolute bg-white border w-full max-h-32 overflow-auto z-10 text-black">
                          {filteredBuildings.map((b) => (
                            <li
                              key={b}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedBuilding(b);
                                setBuildingQuery(b);
                              }}
                            >
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div>
                <button
                  onClick={() => setTypesOpen((o) => !o)}
                  className="border p-2 w-full text-left text-black"
                >
                  Permit types {typesOpen ? '▲' : '▼'}
                </button>
                {typesOpen && (
                  <div className="border mt-1 p-3 max-h-48 overflow-auto text-black">
                    {allTypes.map((t) => (
                      <label
                        key={t}
                        className="flex items-center mb-2 text-black"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(t)}
                          onChange={() =>
                            setSelectedTypes((sel) =>
                              sel.includes(t)
                                ? sel.filter((x) => x !== t)
                                : [...sel, t]
                            )
                          }
                        />
                        <span className="ml-2">{t}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <label className="inline-flex items-center text-black">
                <input
                  type="checkbox"
                  checked={hideFull}
                  onChange={(e) => setHideFull(e.target.checked)}
                />
                <span className="ml-2">Hide full</span>
              </label>
            </div>
          )}

          {mapView && (
            <div className="flex-1 overflow-auto">
              <ul className="space-y-4 text-black">
                {displayLots.map((l) => (
                  <li
                    key={l.id}
                    className="border p-3 rounded shadow cursor-pointer text-black"
                    onClick={() =>
                      setSelectedLot((prev) => (prev === l.id ? null : l.id))
                    }
                  >
                    <h2 className="font-semibold">{l.name}</h2>
                    <p>Capacity: {l.remainingCapacity}</p>
                    {selectedLot === l.id && (
                      <div className="mt-2 space-y-1 text-black">
                        {(l.typesToShow || [])
                          .filter((t) =>
                            hideFull ? t.currentAvailable > 0 : true
                          )
                          .map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between"
                            >
                              <span className="truncate mr-4">{`${t.permitType} (${t.currentAvailable} available)`}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReserve(
                                    l.name,
                                    t.permitType,
                                    startTime,
                                    endTime,
                                    l.meterRate,
                                    t.id,
                                    quantity
                                  );
                                }}
                                disabled={t.currentAvailable < quantity}
                                className={`px-2 py-1 rounded text-white ${
                                  t.currentAvailable >= quantity
                                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                                    : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                                }`}
                              >
                                {t.currentAvailable >= quantity ? "Reserve" : "Full"}
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Main content */}
        <section className="flex-1 relative">
          {!mapView ? (
            <ul className="p-4 space-y-4 h-full overflow-auto text-black">
              {displayLots.map((l) => (
                <li
                  key={l.id}
                  className="border p-4 rounded shadow cursor-pointer text-black"
                  onClick={() =>
                    setSelectedLot((prev) => (prev === l.id ? null : l.id))
                  }
                >
                  <h2 className="font-semibold text-lg">{l.name}</h2>
                  <p>Capacity: {l.remainingCapacity}</p>
                  {listSortBy === 'proximity' &&
                    (selectedBuilding || customOrigin) &&
                    typeof l.distance === 'number' && (
                      <p>Walking dist: {Math.round(l.distance)} units</p>
                    )}
                  {selectedLot === l.id && (
                    <div className="mt-2 space-y-1 text-black">
                      {(l.typesToShow || [])
                        .filter((t) =>
                          hideFull ? t.currentAvailable > 0 : true
                        )
                        .map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate mr-4">{`${t.permitType} (${t.currentAvailable} available)`}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReserve(
                                  l.name,
                                  t.permitType,
                                  startTime,
                                  endTime,
                                  l.meterRate,
                                  t.id,
                                  quantity
                                );
                              }}
                              disabled={t.currentAvailable < quantity}
                              className={`px-2 py-1 rounded text-white ${
                                t.currentAvailable >= quantity
                                  ? 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                                  : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                              }`}
                            >
                              {t.currentAvailable >= quantity ? 'Reserve' : 'Full'}
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              onLoad={(m) => setMap(m)}
              center={
                selectedLot == null
                  ? customOrigin
                    ? toLatLng(customOrigin)
                    : selectedBuilding
                    ? toLatLng(buildingCoordinates[selectedBuilding])
                    : defaultCenter
                  : undefined
              }
              zoom={defaultZoom}
              options={{
                disableDefaultUI: true,
                streetViewControl: false,
                scrollwheel: true,
                draggable: true,
                gestureHandling: 'auto',
              }}
              onClick={(e) => {
                if (!selectMode) return;
                setCustomOrigin([e.latLng!.lat(), e.latLng!.lng()]);
                setSelectedBuilding(null);
                setBuildingQuery('');
                setSelectMode(false);
                setSelectedLot(null);
              }}
            >
              {/* Pin only when no lot selected */}
              {selectedLot == null &&
                (customOrigin ? (
                  <Marker
                    position={toLatLng(customOrigin)}
                    icon={{
                      url:
                        'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    }}
                  />
                ) : selectedBuilding ? (
                  <Marker
                    position={toLatLng(
                      buildingCoordinates[selectedBuilding]
                    )}
                    icon={{
                      url:
                        'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    }}
                  />
                ) : null)}

              {/* Route */}
              {selectedLot != null && directions && (
                <>
                  <DirectionsRenderer
                    directions={directions}
                    options={{ suppressMarkers: true }}
                  />
                  {(() => {
                    const lot = lots.find((l) => l.id === selectedLot)!;
                    return (
                      <>
                        <Marker
                          position={toLatLng(lot.coordinates)}
                          icon={{
                            url:
                              'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                          }}
                        />
                        {selectedBuilding ? (
                          <Marker
                            position={toLatLng(
                              buildingCoordinates[selectedBuilding]
                            )}
                            icon={{
                              url:
                                'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                            }}
                          />
                        ) : customOrigin ? (
                          <Marker
                            position={toLatLng(customOrigin)}
                            icon={{
                              url:
                                'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                            }}
                          />
                        ) : null}
                      </>
                    );
                  })()}
                </>
              )}
            </GoogleMap>
          )}
        </section>
      </div>

      {/* Modal */}
      {showModal && selectedReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-black">
              {(quantity >= 3 || activeCount >= 3) ? 'Request Approval'
              : calculateCost(
                selectedReservation.start,
                selectedReservation.end,
                selectedReservation.meterRate,
                selectedReservation.permitType
              ) === 0 ? 'Free Reservation' : 'Enter Payment Info'}
            </h3>
            {paymentError && <p className="text-red-600 mb-2">{paymentError}</p>}
            <p className="mb-2 text-black">
              Reserving: <strong>{selectedReservation.lotName}</strong> ({selectedReservation.permitType})
            </p>
            <p className="mb-4 text-black">
              Total Cost: <strong>${calculateCost(
                selectedReservation.start,
                selectedReservation.end,
                selectedReservation.meterRate,
                selectedReservation.permitType
              ).toFixed(2)}</strong>
            </p>
            <div className="border p-2 mb-4">
              <CardElement options={{ hidePostalCode: true }} />
            </div>
            {(calculateCost(selectedReservation.start, selectedReservation.end, selectedReservation.meterRate, selectedReservation.permitType, quantity) > 0
              && quantity < 3
              && activeCount < 3 ) && (
              <div className="border p-2 mb-4">
                <CardElement options={{ hidePostalCode: true }} />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleReservationSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Pay & Reserve
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
