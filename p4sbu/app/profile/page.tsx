"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


type Reservation = {
  id: number;
  userID: number;
  spotID: number;
  paymentID: number;
  startTime: string; //timestamp
  endTime: string; //timestamp
};

export default function ProfilePage() {


  const router = useRouter();
  const [userID, setUserID] = useState<number | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  //console.log("check0");

  useEffect(() => {
    async function fetchUserInfo() {
      //console.log("check4");
      try {
        //console.log("check1");
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

        console.log(userIdent);

        setUserID(userIdent);
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.push('/login');
      }
    }

    fetchUserInfo();
  }, [router]);

  useEffect(() => {
    //console.log("check5");
    async function fetchReservations() {
      //console.log("check2");
      if (!userID) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/reservations/user/${userID}`);
        const data = await res.json();

        if (res.ok) {
          setReservations(data);
          console.log(data);
        } else {
          //console.log("error");
          console.error('Error fetching reservations:', data.error || 'Unknown error');
          setReservations([]);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, [userID]);
















  const [formData, setFormData] = useState({
    email: "support@profilepress.net",
    name: "John Doe",
    password: "",
    permitType: "student",
    licensePlate: "",
    idNumber: "",

  });

  // Collapsible sections state: you can toggle each individually
  const [expandedSections, setExpandedSections] = useState({
    activeReservations: false,
    activeFines: false,
    orderHistory: false,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Submit form data to your backend or Supabase
    console.log("Account settings updated:", formData);
    alert("Your profile has been updated!");
  }

  // Toggle a specific section open/closed
  function toggleSection(sectionKey: keyof typeof expandedSections) {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }

  return (
    <main className="max-w-4xl mx-auto p-4">

      <h1 className="text-2xl font-bold text-black mb-6">Profile Page</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black"
            required
          />
        </div>

   
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black"
            required
          />
        </div>


        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black"
            required
          />
        </div>

        <div>
          <label
            htmlFor="permitType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Permit Type
          </label>
          <select
            id="permitType"
            name="permitType"
            value={formData.permitType}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black"
            required
          >
            <option value="student">Student</option>
            <option value="commuter">Commuter</option>
            <option value="ada">ADA</option>
            <option value="faculty staff">Faculty Staff</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="licensePlate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            License Plate
          </label>
          <input
            type="text"
            id="licensePlate"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded py-2 px-3 text-black"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-black text-white rounded py-2 px-4 hover:bg-gray-800"
        >
          Save Changes
        </button>
      </form>

      <div className="mt-10">

        <div className="border-b border-gray-200 pb-2 mb-4">
          <button
            type="button"
            onClick={() => toggleSection("activeReservations")}
            className="w-full flex justify-between items-center text-left"
          >
            <span className="text-lg font-semibold text-black">
              Active Reservations
            </span>
            <span className="text-lg">
              {expandedSections.activeReservations ? "▲" : "▼"}
            </span>
          </button>
          {expandedSections.activeReservations && (
            <div className="mt-2 text-black space-y-2">
              {reservations.length > 0 ? (
                reservations.map((res) => (
                  <div
                    key={res.id}
                    className="border rounded p-3 bg-gray-50 text-sm"
                  >
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
            <span className="text-lg">
              {expandedSections.activeFines ? "▲" : "▼"}
            </span>
          </button>
          {expandedSections.activeFines && (
            <div className="mt-2 text-black">
              <p>You have no active fines currently.</p>
            </div>
          )}
        </div>

        <div className="border-b border-gray-200 pb-2 mb-4">
          <button
            type="button"
            onClick={() => toggleSection("orderHistory")}
            className="w-full flex justify-between items-center text-left"
          >
            <span className="text-lg font-semibold text-black">
              Order History
            </span>
            <span className="text-lg">
              {expandedSections.orderHistory ? "▲" : "▼"}
            </span>
          </button>
          {expandedSections.orderHistory && (
            <div className="mt-2 text-black">
              <p>You have no orders in your history.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}




/*'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Reservation = {
  id: number;
  userID: number;
  spotID: number;
  paymentID: number;
  startTime: string; //timestamp
  endTime: string; //timestamp
};

export default function ProfilePage() {

  const router = useRouter();
  const [userID, setUserID] = useState<number | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  console.log("check0");

  useEffect(() => {
    async function fetchUserInfo() {
      console.log("check4");
      try {
        console.log("check1");
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

        console.log(userIdent);

        setUserID(userIdent);
      } catch (error) {
        console.error('Error fetching user info:', error);
        router.push('/login');
      }
    }

    fetchUserInfo();
  }, [router]);

  useEffect(() => {
    console.log("check5");
    async function fetchReservations() {
      console.log("check2");
      if (!userID) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/reservations/user/${userID}`);
        const data = await res.json();

        if (res.ok) {
          setReservations(data);
          //console.log(data);
        } else {
          //console.log("error");
          console.error('Error fetching reservations:', data.error || 'Unknown error');
          setReservations([]);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, [userID]);

  return (
    <div>
      <h1>Profile Page</h1>

      <div>
        <h2>Your Reservations</h2>
        {loading ? (
          <p>Loading reservations...</p>
        ) : reservations.length > 0 ? (
          <ul>
            {reservations.map((reservation, index) => (
              <li key={index}>
                <p>Reservation ID: {reservation.id}</p>
                <p>Details: {reservation.details}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No active reservations at this time.</p>
        )}
      </div>

      <div>
        <h2>Your Fines</h2>
        <p>You have no active fines currently.</p>
      </div>

      <div>
        <h2>Your Order History</h2>
        <p>You have no orders in your history.</p>
      </div>
    </div>
  );
}*/