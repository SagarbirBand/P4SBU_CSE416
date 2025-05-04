// app/profile/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Reservation = {
  id: number;
  userID: number;
  spotID: number;
  paymentID: number;
  startTime: string;
  endTime: string;
};

type Fine = {
  id: number;
  userID: number;
  amount: number;
  createdAt: string;
  statusPaid: boolean;
  payBy: string;
  description: string;
};

type Payment = {
  id: number;
  userID: number;
  amount: number;
  createdAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [userID, setUserID] = useState<number | null>(null);

  // form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    permitType: "",
    licensePlate: "",
    idNumber: "",
  });
  const [backupFormData, setBackupFormData] = useState<typeof formData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // data sections
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orderHistory, setOrderHistory] = useState<Reservation[]>([]);
  const [activeFines, setActiveFines] = useState<Fine[]>([]);
  const [lotNames, setLotNames] = useState<Record<number, string>>({});
  const [paymentAmounts, setPaymentAmounts] = useState<Record<number, number>>({});

  // UI state
  const [expanded, setExpanded] = useState({
    reservations: true,
    fines: false,
    history: false,
  });
  const [loading, setLoading] = useState(false);

  // payment modal
  const [showModal, setShowModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [cardInfo, setCardInfo] = useState({ name: "", number: "", exp: "", cvv: "" });
  const [paymentError, setPaymentError] = useState("");

  // fetch current user
  useEffect(() => {
    async function fetchUser() {
      const res = await fetch("/api/login?includeUser=true");
      const data = await res.json();
      if (!data.loggedIn) return router.push("/login");
      setUserID(data.user.id);
      setFormData({
        email: data.user.email,
        name: data.user.name,
        password: "",
        permitType: data.user.permitType,
        licensePlate: data.user.licensePlate,
        idNumber: data.user.idNumber,
      });
    }
    fetchUser();
  }, [router]);

  // fetch reservations, payments, fines, lot names
  useEffect(() => {
    if (!userID) return;
    async function fetchData() {
      setLoading(true);

      // --- Reservations ---
      const resR = await fetch(`/api/reservations/user/${userID}`);
      const dataR: Reservation[] = await resR.json();
      const now = Date.now();
      setReservations(dataR.filter(r => new Date(r.endTime).getTime() > now));
      setOrderHistory(dataR.filter(r => new Date(r.endTime).getTime() <= now));

      // --- Lot names ---
      const spotIDs = Array.from(new Set(dataR.map(r => r.spotID)));
      const names: Record<number, string> = {};
      await Promise.all(
        spotIDs.map(async id => {
          const resp = await fetch(`/api/parkinglots/${id}`);
          const lot = await resp.json();
          names[id] = lot.name;
        })
      );
      setLotNames(names);

      // --- Payments for reservations ---
      const paymentIDs = Array.from(new Set(dataR.map(r => r.paymentID)));
      const amounts: Record<number, number> = {};
      await Promise.all(
        paymentIDs.map(async pid => {
          const resp = await fetch(`/api/payments/${pid}`);
          const pay: Payment = await resp.json();
          amounts[pid] = pay.amount;
        })
      );
      setPaymentAmounts(amounts);

      // --- Fines ---
      const resF = await fetch(`/api/fines/user/${userID}`);
      const dataF: Fine[] = await resF.json();
      setActiveFines(dataF);

      setLoading(false);
    }
    fetchData();
  }, [userID]);

  // form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleEdit = () => {
    setBackupFormData(formData);
    setIsEditing(true);
  };
  const handleCancel = () => {
    if (backupFormData) setFormData(backupFormData);
    setIsEditing(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const upd = {
      email: formData.email,
      name: formData.name,
      permitType: formData.permitType,
      licensePlate: formData.licensePlate,
      password: formData.password,
    };
    const res = await fetch(`/api/users/${userID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upd),
    });
    if (res.ok) {
      setIsEditing(false);
      setFormData(f => ({ ...f, password: "" }));
    } else {
      alert("Failed to update profile.");
    }
  };

  // section toggles
  const toggleSection = (key: "reservations" | "fines" | "history") =>
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  // fine payment modal
  const openPayment = (fine: Fine) => {
    setSelectedFine(fine);
    setCardInfo({ name: "", number: "", exp: "", cvv: "" });
    setPaymentError("");
    setShowModal(true);
  };
  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCardInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const processPayment = async () => {
    if (!selectedFine) return;
    try {
      const payRes = await fetch("/api/payments/createPayment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: selectedFine.userID, amount: selectedFine.amount }),
      });
      if (!payRes.ok) throw new Error("Payment creation failed");
      const updRes = await fetch(`/api/fines/${selectedFine.id}`, { method: "PUT" });
      if (!updRes.ok) throw new Error("Updating fine failed");
      setActiveFines(f => f.map(x => (x.id === selectedFine.id ? { ...x, statusPaid: true } : x)));
      setShowModal(false);
    } catch (err: any) {
      setPaymentError(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* -------- Profile Form -------- */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Profile</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            {/** Email **/}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="
                  mt-1 w-full border-gray-300 rounded-md shadow-sm
                  disabled:opacity-100 disabled:text-gray-800
                "
              />
            </div>

            {/** Name **/}
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="
                  mt-1 w-full border-gray-300 rounded-md shadow-sm
                  disabled:opacity-100 disabled:text-gray-800
                "
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/** Password **/}
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="
                    mt-1 w-full border-gray-300 rounded-md shadow-sm
                    disabled:opacity-100 disabled:text-gray-800
                  "
                />
              </div>

              {/** Permit Type **/}
              <div>
                <label className="block text-sm font-medium text-gray-700">Permit Type</label>
                <select
                  name="permitType"
                  value={formData.permitType}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  className="
                    mt-1 w-full border-gray-300 rounded-md shadow-sm
                    disabled:opacity-100 disabled:text-gray-800
                  "
                >
                  <option>Resident</option>
                  <option>Commuter</option>
                  <option>Commuter Premium</option>
                  <option>Faculty/Staff</option>
                  <option>ADA</option>
                  <option>Other/Misc.</option>
                  <option>None</option>
                </select>
              </div>
            </div>

            {/** License Plate **/}
            <div>
              <label className="block text-sm font-medium text-gray-700">License Plate</label>
              <input
                name="licensePlate"
                type="text"
                value={formData.licensePlate}
                onChange={handleChange}
                disabled={!isEditing}
                required
                className="
                  mt-1 w-full border-gray-300 rounded-md shadow-sm
                  disabled:opacity-100 disabled:text-gray-800
                "
              />
            </div>

            {/** Buttons **/}
            <div className="pt-4">
              {isEditing ? (
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>

        {/* -------- Data Sections -------- */}
        <div className="space-y-6">
          {/** Active Reservations **/}
          <section className="bg-white shadow rounded-lg overflow-hidden">
            <header
              className="flex justify-between items-center px-6 py-4 cursor-pointer"
              onClick={() => toggleSection("reservations")}
            >
              <h3 className="text-lg font-medium text-gray-800">Active Reservations</h3>
              <span>{expanded.reservations ? "▲" : "▼"}</span>
            </header>
            {expanded.reservations && (
              <div className="border-t px-6 py-4 space-y-4">
                {reservations.length > 0 ? (
                  reservations.map(r => (
                    <div
                      key={r.id}
                      className="bg-gray-50 border rounded-lg p-4 flex flex-col space-y-1"
                    >
                      <div className="flex justify-between text-sm text-gray-700">
                        <span><strong>Lot:</strong> {lotNames[r.spotID] || "Loading..."}</span>
                        <span>
                          <strong>Amount:</strong>{" "}
                          {paymentAmounts[r.paymentID] != null
                            ? `$${paymentAmounts[r.paymentID].toFixed(2)}`
                            : "Loading..."}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>
                          <strong>Start:</strong>{" "}
                          {new Date(r.startTime).toLocaleString()}
                        </span>
                        <span>
                          <strong>End:</strong>{" "}
                          {new Date(r.endTime).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No active reservations at this time.</p>
                )}
              </div>
            )}
          </section>

          {/** Active Fines **/}
          <section className="bg-white shadow rounded-lg overflow-hidden">
            <header
              className="flex justify-between items-center px-6 py-4 cursor-pointer"
              onClick={() => toggleSection("fines")}
            >
              <h3 className="text-lg font-medium text-gray-800">Active Fines</h3>
              <span>{expanded.fines ? "▲" : "▼"}</span>
            </header>
            {expanded.fines && (
              <div className="border-t px-6 py-4 space-y-4">
                {loading ? (
                  <p className="text-gray-500">Loading fines...</p>
                ) : activeFines.length > 0 ? (
                  activeFines.map(f => (
                    <div key={f.id} className="bg-gray-50 border rounded-lg p-4 space-y-1">
                      <p className="text-sm text-gray-700">
                        <strong>Assigned:</strong>{" "}
                        {new Date(f.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Pay By:</strong>{" "}
                        {new Date(f.payBy).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Amount:</strong> ${f.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Description:</strong> {f.description}
                      </p>
                      <p className="text-sm">
                        <strong>Status:</strong>{" "}
                        <span className={f.statusPaid ? "text-green-600" : "text-red-600"}>
                          {f.statusPaid ? "Paid" : "Unpaid"}
                        </span>
                      </p>
                      {!f.statusPaid && (
                        <button
                          onClick={() => openPayment(f)}
                          className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No active fines at this time.</p>
                )}
              </div>
            )}
          </section>

          {/** Order History **/}
          <section className="bg-white shadow rounded-lg overflow-hidden">
            <header
              className="flex justify-between items-center px-6 py-4 cursor-pointer"
              onClick={() => toggleSection("history")}
            >
              <h3 className="text-lg font-medium text-gray-800">Order History</h3>
              <span>{expanded.history ? "▲" : "▼"}</span>
            </header>
            {expanded.history && (
              <div className="border-t px-6 py-4 space-y-4">
                {orderHistory.length > 0 ? (
                  orderHistory.map(r => (
                    <div key={r.id} className="bg-gray-50 border rounded-lg p-4 space-y-1">
                      <div className="flex justify-between text-sm text-gray-700">
                        <span><strong>Lot:</strong> {lotNames[r.spotID] || "Loading..."}</span>
                        <span>
                          <strong>Amount:</strong>{" "}
                          {paymentAmounts[r.paymentID] != null
                            ? `$${paymentAmounts[r.paymentID].toFixed(2)}`
                            : "Loading..."}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700">
                        <span>
                          <strong>Start:</strong>{" "}
                          {new Date(r.startTime).toLocaleString()}
                        </span>
                        <span>
                          <strong>End:</strong>{" "}
                          {new Date(r.endTime).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No past reservations found.</p>
                )}
              </div>
            )}
          </section>
        </div>

        {/** Payment Modal **/}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Payment for Fine</h4>
              {paymentError && <p className="text-red-600 mb-2">{paymentError}</p>}
              <input
                name="name"
                placeholder="Cardholder Name"
                value={cardInfo.name}
                onChange={handleCardChange}
                className="w-full mb-2 border-gray-300 rounded-md shadow-sm p-2"
              />
              <input
                name="number"
                placeholder="Card Number"
                value={cardInfo.number}
                onChange={handleCardChange}
                className="w-full mb-2 border-gray-300 rounded-md shadow-sm p-2"
              />
              <div className="flex space-x-2">
                <input
                  name="exp"
                  placeholder="MM/YY"
                  value={cardInfo.exp}
                  onChange={handleCardChange}
                  className="w-1/2 mb-2 border-gray-300 rounded-md shadow-sm p-2"
                />
                <input
                  name="cvv"
                  placeholder="CVV"
                  value={cardInfo.cvv}
                  onChange={handleCardChange}
                  className="w-1/2 mb-2 border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-800 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
