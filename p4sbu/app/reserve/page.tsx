// app/parking/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { buildingCoordinates, BuildingName } from '../../lib/buildings';
import {
  useLoadScript,
  GoogleMap,
  Marker,
  DirectionsRenderer,
} from '@react-google-maps/api';

type Coordinates = [number, number];
type LatLngLiteral = google.maps.LatLngLiteral;

interface ParkingLotApi {
  id: number;
  name: string;
  location: string;
  coordinates: string; // "(lat, lng)"
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
};

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

export default function ParkingPage() {
  // ─── State ───────────────────────────────────────────────
  const [lots, setLots] = useState<LotWithTypes[]>([]);
  const [allTypes] = useState<PermitType[]>([...ALL_PERMIT_TYPES]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<PermitType[]>([]);
  const [hideFull, setHideFull] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);

  const [listSortBy, setListSortBy] = useState<'capacity' | 'proximity'>(
    'capacity'
  );

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

  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [directions, setDirections] = useState<
    google.maps.DirectionsResult | null
  >(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(true);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

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

  // ─── Distance proxy ──────────────────────────────
  const recalcDistances = useCallback(
    async (origin: Coordinates) => {
      if (!lots.length) return;
      const originStr = origin.join(',');
      const chunkSize = 25;
      const allDist: number[] = [];
      for (let i = 0; i < lots.length; i += chunkSize) {
        const slice = lots.slice(i, i + chunkSize);
        const destParam = slice.map((l) => l.coordinates.join(',')).join('|');
        try {
          const resp = await fetch(
            `/api/distance?origin=${encodeURIComponent(
              originStr
            )}&destinations=${encodeURIComponent(destParam)}`
          );
          if (!resp.ok) {
            allDist.push(...Array(slice.length).fill(Infinity));
            continue;
          }
          const json = await resp.json();
          if (json.status !== 'OK') {
            allDist.push(...Array(slice.length).fill(Infinity));
            continue;
          }
          allDist.push(
            ...json.rows[0].elements.map((e: any) =>
              e.status === 'OK' ? e.distance.value : Infinity
            )
          );
        } catch {
          allDist.push(...Array(slice.length).fill(Infinity));
        }
      }
      setLots((cur) =>
        cur.map((l, idx) => ({ ...l, distance: allDist[idx] ?? Infinity }))
      );
    },
    [lots]
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

  // ─── Toggle view & reset ──────────────────────────────
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

  // ─── Compute route ───────────────────────────────────────
  useEffect(() => {
    if (selectedLot !== null && map) {
      const lot = lots.find((l) => l.id === selectedLot)!;
      const origin = new google.maps.LatLng(
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
          { origin, destination: dest, travelMode: google.maps.TravelMode.WALKING },
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
        const rem = matching.reduce((s, t) => s + t.currentAvailable, 0);
        return {
          ...l,
          remainingCapacity: rem,
          hasMatch: !selectedTypes.length || matching.length > 0,
          typesToShow: matching,
        };
      })
      .filter((l) => l.hasMatch)
      .filter((l) => (hideFull ? l.remainingCapacity > 0 : true))
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
  }, [lots, searchTerm, selectedTypes, hideFull, listSortBy, mapView, selectedBuilding, customOrigin]);

  if (mapView && !isLoaded)
    return <div className="p-4 text-black">Loading map…</div>;

  // handleReserve now takes parameters
  const handleReserve = (
    lotName: string,
    permitType: string,
    start: string,
    end: string
  ) => {
    console.log('Reserve', { lotName, permitType, start, end });
  };

  return (
    <main className="flex flex-col" style={{ height: 'calc(100vh - 73px)' }}>
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
                              <span className="truncate mr-4">{t.permitType}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReserve(
                                    l.name,
                                    t.permitType,
                                    startTime,
                                    endTime
                                  );
                                }}
                                disabled={t.currentAvailable === 0}
                                className={`px-2 py-1 rounded text-white ${
                                  t.currentAvailable > 0
                                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                                    : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                                }`}
                              >
                                Reserve
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
                      <p>Walking dist: {Math.round(l.distance)} m</p>
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
                            <span className="truncate mr-4">{t.permitType}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReserve(
                                  l.name,
                                  t.permitType,
                                  startTime,
                                  endTime
                                );
                              }}
                              disabled={t.currentAvailable === 0}
                              className={`px-2 py-1 rounded text-white ${
                                t.currentAvailable > 0
                                  ? 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                                  : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                              }`}
                            >
                              Reserve
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
              {/* pin only when no lot selected */}
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

              {/* route */}
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
    </main>
  );
}
