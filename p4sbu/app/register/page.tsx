// app/register/page.tsx
"use client";

import { useState } from "react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    driversLicense: "",
    vehiclePlateNumber: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle registration logic here
    console.log("Register attempt:", formData);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[url('/map-bg.jpg')] bg-cover bg-center">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-white/70"></div>

      {/* Form Card */}
      <div className="relative z-10 w-full max-w-lg bg-white/80 rounded shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 text-red-600 text-center">
          Register
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="driversLicense"
              className="block text-sm font-medium text-gray-700"
            >
              Driver's License Number
            </label>
            <input
              id="driversLicense"
              name="driversLicense"
              type="text"
              value={formData.driversLicense}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label
              htmlFor="vehiclePlateNumber"
              className="block text-sm font-medium text-gray-700"
            >
              Vehicle Plate Number
            </label>
            <input
              id="vehiclePlateNumber"
              name="vehiclePlateNumber"
              type="text"
              value={formData.vehiclePlateNumber}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800"
          >
            Register Now
          </button>
        </form>
      </div>
    </div>
  );
}
