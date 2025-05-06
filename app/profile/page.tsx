"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import type { StripeElements } from "@stripe/stripe-js";

// Data interfaces
interface Reservation {
  id: number;
  userID: number;
  spotID: number;
  paymentID: number;
  startTime: string;
  endTime: string;
}
interface Fine {
  id: number;
  userID: number;
  amount: number;
  createdAt: string;
  description: string;
  statusPaid: boolean;
}
interface Payment {
  id: number;
  userID: number;
  amount: number;
  createdAt: string;
}
interface SpotType {
  id: number;
  lotID: number;
}
interface Lot {
  id: number;
  name: string;
}

// Load Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Payment modal component
function PaymentModal({
  fine,
  onClose,
  onPaid
}: {
  fine: Fine;
  onClose: () => void;
  onPaid: (id: number) => void;
}) {
  const stripe = useStripe();
  const elements = useElements() as StripeElements;
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handlePay = async () => {
    if (!stripe || !elements) {
      setErrorMsg("Stripe not loaded");
      return;
    }
    try {
      // Create payment intent
      const initRes = await fetch("/api/payments/createPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: fine.userID, amount: fine.amount })
      });
      const { clientSecret } = await initRes.json();

      // Confirm card payment
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Card element not found");
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card }
      });
      if (error || paymentIntent?.status !== "succeeded") {
        throw new Error(error?.message || "Payment failed");
      }

      // Mark fine as paid on server
      await fetch(`/api/fines/${fine.id}`, { method: "PUT" });
      onPaid(fine.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h4 className="text-lg font-semibold mb-4">Pay Fine ${fine.amount.toFixed(2)}</h4>
        {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
        <CardElement options={{ hidePostalCode: true }} className="border p-2 mb-4" />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={handlePay} className="px-4 py-2 bg-indigo-600 text-white rounded">Pay</button>
        </div>
      </div>
    </div>
  );
}

// Main Profile Page
export default function ProfilePage() {
  const router = useRouter();
  const [userID, setUserID] = useState<number | null>(null);
  const [formData, setFormData] = useState({ email: "", name: "", password: "", permitType: "", licensePlate: "", idNumber: "" });
  const [backupFormData, setBackupFormData] = useState<typeof formData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orderHistory, setOrderHistory] = useState<Reservation[]>([]);
  const [activeFines, setActiveFines] = useState<Fine[]>([]);
  
  const [lotNames, setLotNames] = useState<Record<number,string>>({});
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number,number>>({});

  const [expanded, setExpanded] = useState({ reservations: true, fines: false, history: false });
  const [loading, setLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);

  // 1) Fetch logged-in user data
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/login?includeUser=true");
      const data = await res.json();
      if (!data.loggedIn) {
        router.push("/login");
        return;
      }
      setUserID(data.user.id);
      setFormData({
        email: data.user.email || "",
        name: data.user.name || "",
        password: "",
        permitType: data.user.permitType || "",
        licensePlate: data.user.licensePlate || "",
        idNumber: data.user.idNumber || ""
      });
    }
    fetchUser();
  }, [router]);

  // 2) Load all related data once userID is known
  useEffect(() => {
    if (!userID) return;
    async function loadData() {
      setLoading(true);
      
      // Build lotId -> lotName map
      const lotRes = await fetch("/api/parkingLots");
      const lots: Lot[] = await lotRes.json();
      const lotMap: Record<number,string> = {};
      lots.forEach(l => lotMap[l.id] = l.name);
      
      // Build paymentId -> amount map
      const payRes = await fetch("/api/payments");
      const payments: Payment[] = await payRes.json();
      const payMap: Record<number,number> = {};
      payments.forEach(p => payMap[p.id] = p.amount);
      
      // Fetch reservations for this user
      const resRes = await fetch(`/api/reservations/user/${userID}`);
      const allRes: Reservation[] = await resRes.json();
      const now = Date.now();
      setReservations(allRes.filter(r => new Date(r.endTime).getTime() > now));
      setOrderHistory(allRes.filter(r => new Date(r.endTime).getTime() <= now));

            // Fetch all spot type records and build spot->lot map
      const stRes = await fetch('/api/parkingSpotTypes');
      const spotTypes: SpotType[] = await stRes.json();
      const spotMap: Record<number,string> = {};
      spotTypes.forEach(st => {
        spotMap[st.id] = lotMap[st.lotID] || 'Unknown Lot';
      });
      setLotNames(spotMap);
      setPaymentAmounts(payMap);

      // Fetch active fines
      const fRes = await fetch(`/api/fines/user/${userID}`);
      const fines: Fine[] = await fRes.json();
      setActiveFines(fines);

      setLoading(false);
    }
    loadData();
  }, [userID]);

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleEdit = () => { setBackupFormData(formData); setIsEditing(true); };
  const handleCancel = () => { if (backupFormData) setFormData(backupFormData); setIsEditing(false); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/users/${userID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    setIsEditing(false);
  };
  const toggleSection = (sec: keyof typeof expanded) => setExpanded(prev => ({ ...prev, [sec]: !prev[sec] }));
  const openPaymentModal = (fine: Fine) => { setSelectedFine(fine); setShowModal(true); };
  const handleFinePaid = (id: number) => setActiveFines(prev => prev.map(f => f.id === id ? { ...f, statusPaid: true } : f));

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 text-black">
      {/* Profile Form */}
      <div className="max-w-3xl mx-auto mb-8 bg-white shadow rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-6">Profile</h2>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!isEditing} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} className="w-full border rounded p-2" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} disabled={!isEditing} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Permit Type</label>
              <select name="permitType" value={formData.permitType} onChange={handleChange} disabled={!isEditing} className="w-full border rounded p-2 bg-white">
                <option value="">Select...</option>
                <option>Faculty/Staff</option>
                <option>Resident</option>
                <option>Commuter</option>
                <option>Commuter Premium</option>
                <option>ADA</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">License Plate</label>
              <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} disabled={!isEditing} className="w-full border rounded p-2" />
            </div>
          </div>
          <div className="mt-4">
            {isEditing ? (
              <div className="flex space-x-3">
                <button type="button" onClick={handleCancel} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
              </div>
            ) : (
              <button type="button" onClick={handleEdit} className="px-4 py-2 bg-indigo-600 text-white rounded">Edit Profile</button>
            )}
          </div>
        </form>
      </div>

      {/* Data Sections */}
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Active Reservations */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Active Reservations</h3>
            <button onClick={() => toggleSection("reservations")} className="text-xl">{expanded.reservations ? '▲' : '▼'}</button>
          </div>
          {expanded.reservations && (
            <ul className="divide-y">
              {loading && <li className="p-3 text-gray-500">Loading...</li>}
              {!loading && reservations.length === 0 && <li className="p-3 text-gray-500">No active reservations.</li>}
              {reservations.map(r => (
                <li key={r.id} className="flex justify-between p-3">
                  <div>
                    <p><strong>Lot:</strong> {lotNames[r.spotID] || 'Unknown'}</p>
                    <p><strong>Start:</strong> {new Date(r.startTime).toLocaleString()}</p>
                    <p><strong>End:</strong> {new Date(r.endTime).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Amount:</strong> ${paymentAmounts[r.paymentID]?.toFixed(2) || '0.00'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active Fines */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Active Fines</h3>
            <button onClick={() => toggleSection("fines")} className="text-xl">{expanded.fines ? '▲' : '▼'}</button>
          </div>
          {expanded.fines && (
            <ul className="divide-y">
              {loading && <li className="p-3 text-gray-500">Loading...</li>}
              {!loading && activeFines.length === 0 && <li className="p-3 text-gray-500">No active fines.</li>}
              {activeFines.map(f => (
                <li key={f.id} className="flex justify-between p-3">
                  <div>
                    <p><strong>Date:</strong> {new Date(f.createdAt).toLocaleDateString()}</p>
                    <p><strong>Description:</strong> {f.description}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p><strong>Amount:</strong> ${f.amount.toFixed(2)}</p>
                    {!f.statusPaid 
                      ? <button onClick={() => openPaymentModal(f)} className="px-3 py-1 bg-red-600 text-white rounded">Pay Now</button>
                      : <span className="text-green-600">Paid</span>
                    }
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Order History */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Order History</h3>
            <button onClick={() => toggleSection("history")} className="text-xl">{expanded.history ? '▲' : '▼'}</button>
          </div>
          {expanded.history && (
            <ul className="divide-y">
              {loading && <li className="p-3 text-gray-500">Loading...</li>}
              {!loading && orderHistory.length === 0 && <li className="p-3 text-gray-500">No past reservations.</li>}
              {orderHistory.map(r => (
                <li key={r.id} className="flex justify-between p-3">
                  <div>
                    <p><strong>Lot:</strong> {lotNames[r.spotID] || 'Unknown'}</p>
                    <p><strong>Start:</strong> {new Date(r.startTime).toLocaleString()}</p>
                    <p><strong>End:</strong> {new Date(r.endTime).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p><strong>Amount:</strong> ${paymentAmounts[r.paymentID]?.toFixed(2) || '0.00'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Stripe modal */}
      {showModal && selectedFine && (
        <Elements stripe={stripePromise}>
          <PaymentModal fine={selectedFine} onClose={() => setShowModal(false)} onPaid={handleFinePaid} />
        </Elements>
      )}
    </main>
  );
}
