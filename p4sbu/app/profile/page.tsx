"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Reservation = {
  id: number;
  userID: number;
  spotID: number;
  paymentID: number;
  startTime: string; // timestamp
  endTime: string; // timestamp
};

type Fine = {
  id: number;
  userID: number;
  amount: number;
  createdAt: string; // timestamp
  statusPaid: boolean;
  payBy: string; // timestamp
  description: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [userID, setUserID] = useState<number | null>(null);
  const [reservations, setActiveReservations] = useState<Reservation[]>([]);
  const [orderHistory, setOrderHistory] = useState<Reservation[]>([]);
  const [activeFines, setActiveFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state
  const [formData, setFormData] = useState({
    email: "support@profilepress.net",
    name: "John Doe",
    password: "",
    permitType: "student",
    licensePlate: "",
    idNumber: "",
  });
  const [backupFormData, setBackupFormData] = useState<typeof formData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const loginRes = await fetch('/api/login?includeUser=true');
        const loginData = await loginRes.json();
        if (!loginData.loggedIn) {
          router.push('/login');
          return;
        }
        const id = loginData.user?.id;
        if (!id) throw new Error('User ID not found');
        setUserID(id);
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.push('/login');
      }
    }
    fetchUserInfo();
  }, [router]);



  useEffect(() => {
    async function fetchFines() {
      if (!userID) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/fines/user/${userID}`);
        const data = await res.json();
        if (res.ok) setActiveFines(data);
        else setActiveFines([]);
      } catch (error) {
        console.error('Error fetching fines:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFines();
  }, [userID]);



  function isOlderThan24Hours(reservationEndTime: string) {
    const reservationEnd = new Date(reservationEndTime);
    const currentTime = new Date();
    const differenceInHours = (currentTime.getTime() - reservationEnd.getTime()) / (1000 * 60 * 60);
    return differenceInHours > 24;
  }

  useEffect(() => {
    async function fetchReservations() {
      if (!userID) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/reservations/user/${userID}`);
        const data = await res.json();
        if (res.ok) {
          // Split reservations into active and order history based on 24 hours check
          const activeReservations = data.filter(
            (res: Reservation) => !isOlderThan24Hours(res.endTime)
          );
          const orderHistory = data.filter(
            (res: Reservation) => isOlderThan24Hours(res.endTime)
          );
          setActiveReservations(activeReservations);
          setOrderHistory(orderHistory);
        } else {
          setActiveReservations([]);
          setOrderHistory([]);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReservations();
  }, [userID]);


  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleEdit() {
    setBackupFormData(formData);
    setIsEditing(true);
  }

  function handleCancel() {
    if (backupFormData) {
      setFormData(backupFormData);
    }
    setIsEditing(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: send formData to backend
    console.log('Account settings updated:', formData);
    alert('Your profile has been updated!');
    setIsEditing(false);
  }

  const [expandedSections, setExpandedSections] = useState({
    activeReservations: false,
    activeFines: false,
    orderHistory: false,
  });

  function toggleSection(key: keyof typeof expandedSections) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-black mb-6">Profile Page</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div>
          <label htmlFor="permitType" className="block text-sm font-medium text-gray-700 mb-1">
            Permit Type
          </label>
          <select
            id="permitType"
            name="permitType"
            value={formData.permitType}
            onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="student">Student</option>
            <option value="commuter">Commuter</option>
            <option value="ada">ADA</option>
            <option value="faculty staff">Faculty Staff</option>
          </select>
        </div>

        <div>
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
            License Plate
          </label>
          <input
            type="text"
            id="licensePlate"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div className="flex space-x-4">
          {isEditing ? (
            <>
              <button
                type="submit"
                className="bg-black text-white rounded py-2 px-4 hover:bg-gray-800"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-black rounded py-2 px-4 hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="bg-black text-white rounded py-2 px-4 hover:bg-gray-800"
            >
              Edit
            </button>
          )}
        </div>
      </form>

      <div className="mt-10">
        {/* Collapsible Sections */}
        <div className="border-b border-gray-200 pb-2 mb-4">
          <button
            type="button"
            onClick={() => toggleSection("activeReservations")}
            className="w-full flex justify-between items-center text-left"
          >
            <span className="text-lg font-semibold text-black">Active Reservations</span>
            <span className="text-lg">{expandedSections.activeReservations ? "▲" : "▼"}</span>
          </button>
          {expandedSections.activeReservations && (
            <div className="mt-2 text-black space-y-2">
              {reservations.length > 0 ? (
                reservations.map(res => (
                  <div key={res.id} className="border rounded p-3 bg-gray-50 text-sm">
                    <p><strong>Start:</strong> {new Date(res.startTime).toLocaleString()}</p>
                    <p><strong>End:</strong> {new Date(res.endTime).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p>No active reservations at this time.</p>
              )}
            </div>
          )}
        </div>

        <div className="border-b border-gray-200 pb-2 mb-4">
          <button
            type="button"
            onClick={() => toggleSection("activeFines")}
            className="w-full flex justify-between items-center text-left"
          >
            <span className="text-lg font-semibold text-black">Active Fines</span>
            <span className="text-lg">{expandedSections.activeFines ? "▲" : "▼"}</span>
          </button>
          {expandedSections.activeFines && (
            <div className="mt-2 text-black space-y-2">
            {activeFines.length > 0 ? (
              activeFines.map(res => (
                <div key={res.id} className="border rounded p-3 bg-gray-50 text-sm">
                  <p><strong>Date Assigned:</strong> {new Date(res.createdAt).toLocaleString()}</p>
                  <p><strong>Pay By:</strong> {new Date(res.payBy).toLocaleString()}</p>
                  <p><strong>Amount:</strong> {"$" + res.amount}</p>
                  <p><strong>Description:</strong> {res.description}</p>
                  <p>
                    <strong>Status: </strong> 
                    <span className={res.statusPaid ? "text-green-500" : "text-red-500"}>
                      {res.statusPaid ? "Paid" : "Not Paid"}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <p>No active reservations at this time.</p>
            )}
          </div>
          )}
        </div>

        <div className="border-b border-gray-200 pb-2 mb-4">
          <button
            type="button"
            onClick={() => toggleSection("orderHistory")}
            className="w-full flex justify-between items-center text-left"
          >
            <span className="text-lg font-semibold text-black">Order History</span>
            <span className="text-lg">{expandedSections.orderHistory ? "▲" : "▼"}</span>
          </button>
          {expandedSections.orderHistory && (
            <div className="mt-2 text-black space-y-2">
            {orderHistory.length > 0 ? (
              orderHistory.map(res => (
                <div key={res.id} className="border rounded p-3 bg-gray-50 text-sm">
                  <p><strong>Start:</strong> {new Date(res.startTime).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(res.endTime).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p>No active reservations at this time.</p>
            )}
          </div>
          )}
        </div>
      </div>
    </main>
  );
}
