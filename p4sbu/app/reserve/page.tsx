"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';


type Lot = {
  id: number;
  name: string;
};

export default function Reserve() {
  const [lots, setLots] = useState<Lot[]>([]);
  //const [lotID, setLotID] = useState(Number);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [userID, setUserID] = useState(Number);
  //const [spotID, setSpotID] = useState(Number);
  //const [paymentID, setPaymentID] = useState(Number);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLots() {
      try {
        setLoading(true);
        setError("");
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


  const router = useRouter();
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const loginRes = await fetch('/api/login?includeUser=true');
        const loginData = await loginRes.json();


        if (!loginData.loggedIn) {
          router.push('/login');
          return;
        }

        const userIdent = loginData.user?.id;
        if (!userIdent) {
          throw new Error('User ID not found');
        }

        setUserID(userIdent);
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.push('/login');
      }
    }

    fetchUserInfo();
  }, [router]);


  const handleReserve = async (selectedLotID: number) => {


    //Grab spotID (for now we just use selected lotID)
    let spotID = selectedLotID;
    console.log("spotID valid");

    //Set startTime to now and endTime to an hour from now
    const curr = new Date();
    const hrLater = new Date();
    hrLater.setHours(hrLater.getHours() + 1);
    const startTime = curr.toISOString();
    const endTime = hrLater.toISOString();

    //Call API to create a payment and get paymentID
    let amount = 5.00;

    try {
      const res1 = await fetch('/api/payments/createPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userID,
          amount
        }),
      });
  
      if (res1.ok) {
        console.log("payment created");
        const data = await res1.json();
        let paymentID = data.paymentID;


        //createReservationAPI called
        try {
          const res = await fetch('/api/reservations/createReservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userID,
              spotID,
              paymentID,
              startTime,
              endTime,
            }),
          });
      
          if (res.ok) {
            console.log("res.ok good");
            router.push('/profile');
          } else {
            console.log(res.ok);
            const data = await res.json();
            setError(data.message || 'Registration failed');
          }
        } catch (err) {
          setError('An unexpected error occurred createRes');
        }


      } else {
        const data = await res1.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred payment');
    }

  };

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
                  onClick={() => {handleReserve(lot.id);} }
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
