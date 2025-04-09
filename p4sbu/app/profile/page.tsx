"use client";

import { useState } from "react";

export default function ProfilePage() {
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
      {/* ACCOUNT SETTINGS FORM */}
      <h1 className="text-2xl font-bold text-black mb-6">Profile Page</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
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

        {/* Name */}
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

        {/* Password */}
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

        {/* Permit Type (Dropdown) */}
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

        {/* License Plate */}
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

        {/* ID Number */}
        <div>
          <label
            htmlFor="idNumber"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ID Number
          </label>
          <input
            type="text"
            id="idNumber"
            name="idNumber"
            value={formData.idNumber}
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

      {/* COLLAPSIBLE SECTIONS */}
      <div className="mt-10">
        {/* Active Reservations */}
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
            <div className="mt-2 text-black">
              {/* Placeholder content or dynamic reservation data */}
              <p>No active reservations at this time.</p>
            </div>
          )}
        </div>

        {/* Active Fines */}
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
              {/* Placeholder content or dynamic fines data */}
              <p>You have no active fines currently.</p>
            </div>
          )}
        </div>

        {/* Order History */}
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
              {/* Placeholder content or dynamic order data */}
              <p>You have no orders in your history.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
