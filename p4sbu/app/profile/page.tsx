"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

export default function ProfilePage() {
  const router = useRouter();
  const [userID, setUserID] = useState<number | null>(null);
  const [reservations, setActiveReservations] = useState<Reservation[]>([]);
  const [orderHistory, setOrderHistory] = useState<Reservation[]>([]);
  const [activeFines, setActiveFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Profile form state
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

  // Payment modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [cardInfo, setCardInfo] = useState({ name: '', number: '', exp: '', cvv: '' });
  const [paymentError, setPaymentError] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    activeReservations: false,
    activeFines: false,
    orderHistory: false,
  });

  // Fetch user and initialize
  useEffect(() => {
    async function fetchUserInfo() {
      const loginRes = await fetch('/api/login?includeUser=true');
      const loginData = await loginRes.json();
      if (!loginData.loggedIn) {
        router.push('/login');
        return;
      }
      const id = loginData.user.id;
      setUserID(id);
      setFormData({
        email: loginData.user.email,
        name: loginData.user.name,
        password: '',
        permitType: loginData.user.permitType,
        licensePlate: loginData.user.licensePlate,
        idNumber: loginData.user.idNumber,
      });
    }
    fetchUserInfo();
  }, [router]);

  // Fetch reservations & fines
  useEffect(() => {
    if (!userID) return;
    async function fetchData() {
      setLoading(true);
      // Reservations
      const resR = await fetch(`/api/reservations/user/${userID}`);
      const dataR: Reservation[] = await resR.json();
      const now = new Date();
      setActiveReservations(
        dataR.filter(r => now.getTime() - new Date(r.endTime).getTime() < 24 * 3600 * 1000)
      );
      setOrderHistory(
        dataR.filter(r => now.getTime() - new Date(r.endTime).getTime() >= 24 * 3600 * 1000)
      );
      // Fines
      const resF = await fetch(`/api/fines/user/${userID}`);
      const dataF: Fine[] = await resF.json();
      setActiveFines(dataF);
      setLoading(false);
    }
    fetchData();
  }, [userID]);

  // Profile handlers
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }
  function handleEdit() {
    setBackupFormData(formData);
    setIsEditing(true);
  }
  function handleCancel() {
    if (backupFormData) setFormData(backupFormData);
    setIsEditing(false);
  }
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: update profile via API
    setIsEditing(false);
  }
  function toggleSection(key: keyof typeof expandedSections) {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Payment handlers
  function openPayment(fine: Fine) {
    setSelectedFine(fine);
    setCardInfo({ name: '', number: '', exp: '', cvv: '' });
    setPaymentError('');
    setShowModal(true);
  }
  function handleCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCardInfo({ ...cardInfo, [e.target.name]: e.target.value });
  }
  async function processPayment() {
    if (!selectedFine) return;
    try {
      const res = await fetch(`/api/fines/${selectedFine.id}/pay`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Payment failed');
      setActiveFines(prev =>
        prev.map(f => (f.id === selectedFine.id ? { ...f, statusPaid: true } : f))
      );
      setShowModal(false);
    } catch (e: any) {
      setPaymentError(e.message);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-black mb-6">Profile Page</h1>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
          <input
            type="email" id="email" name="email" value={formData.email} onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text" id="name" name="name" value={formData.name} onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password" id="password" name="password" value={formData.password} onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>
        <div>
          <label htmlFor="permitType" className="block text-sm font-medium text-gray-700 mb-1">Permit Type</label>
          <select
            id="permitType" name="permitType" value={formData.permitType} onChange={handleChange}
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
          <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
          <input
            type="text" id="licensePlate" name="licensePlate" value={formData.licensePlate} onChange={handleChange}
            disabled={!isEditing}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>
        <div className="flex space-x-4">
          {isEditing ? (
            <>
              <button type="submit" className="bg-black text-white rounded py-2 px-4 hover:bg-gray-800">Save</button>
              <button type="button" onClick={handleCancel} className="bg-gray-300 text-black rounded py-2 px-4 hover:bg-gray-400">Cancel</button>
            </>
          ) : (
            <button type="button" onClick={handleEdit} className="bg-black text-white rounded py-2 px-4 hover:bg-gray-800">Edit</button>
          )}
        </div>
      </form>

      <div className="mt-10">
        {/* Active Reservations section */}
        <div className="border-b border-gray-200 pb-2 mb-4">
          <button type="button" onClick={() => toggleSection('activeReservations')} className="w-full flex justify-between items-center text-left">
            <span className="text-lg font-semibold text-black">Active Reservations</span>
            <span className="text-lg text-black">{expandedSections.activeReservations ? '▲' : '▼'}</span>
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

        {/* Active Fines section */}
        <div className="border-b border-gray-200 pb-2 mb-4">
          <button type="button" onClick={() => toggleSection('activeFines')} className="w-full flex justify-between items-center text-left">
            <span className="text-lg font-semibold text-black">Active Fines</span>
            <span className="text-lg text-black">{expandedSections.activeFines ? '▲' : '▼'}</span>
          </button>
          {expandedSections.activeFines && (
            <div className="mt-2 text-black space-y-4">
              {loading ? (
                <p>Loading fines...</p>
              ) : activeFines.length > 0 ? (
                activeFines.map(f => (
                  <div key={f.id} className="border rounded p-3 bg-gray-50 text-sm">
                    <p><strong>Date Assigned:</strong> {new Date(f.createdAt).toLocaleString()}</p>
                    <p><strong>Pay By:</strong> {new Date(f.payBy).toLocaleDateString()}</p>
                    <p><strong>Amount:</strong> ${f.amount.toFixed(2)}</p>
                    <p><strong>Description:</strong> {f.description}</p>
                    <p><strong>Status:</strong>{' '}
                      <span className={f.statusPaid ? 'text-green-500' : 'text-red-500'}>
                        {f.statusPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </p>
                    {!f.statusPaid && (
                      <button onClick={() => openPayment(f)} className="mt-2 bg-red-600 text-white py-1 px-4 rounded hover:bg-red-700">Pay</button>
                    )}
                  </div>
                ))
              ) : (
                <p>No active fines at this time.</p>
              )}
            </div>
          )}
        </div>

        {/* Order History section */}
        <div className="border-b border-gray-200 pb-2 mb-4">
          <button type="button" onClick={() => toggleSection('orderHistory')} className="w-full flex justify-between items-center text-left">
            <span className="text-lg font-semibold text-black">Order History</span>
            <span className="text-lg text-black">{expandedSections.orderHistory ? '▲' : '▼'}</span>
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

      {/* Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-black">Enter Payment Info</h3>
            {paymentError && (
              <p className="text-red-600 mb-2">{paymentError}</p>
            )}
            <input
              name="name"
              placeholder="Cardholder Name"
              value={cardInfo.name}
              onChange={handleCardChange}
              className="w-full mb-2 border p-2 text-black placeholder-gray-700"
            />
            <input
              name="number"
              placeholder="Card Number"
              value={cardInfo.number}
              onChange={handleCardChange}
              className="w-full mb-2 border p-2 text-black placeholder-gray-700"
            />
            <input
              name="exp"
              placeholder="MM/YY"
              value={cardInfo.exp}
              onChange={handleCardChange}
              className="w-full mb-2 border p-2 text-black placeholder-gray-700"
            />
            <input
              name="cvv"
              placeholder="CVV"
              value={cardInfo.cvv}
              onChange={handleCardChange}
              className="w-full mb-4 border p-2 text-black placeholder-gray-700"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded text-black"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}