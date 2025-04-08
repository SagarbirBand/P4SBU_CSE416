// app/register/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BGIMG from '../components/bg_image.tsx';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    displayName: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center">
      <BGIMG url='/map-bg.jpg' />
      <form onSubmit={handleRegister} className="text-black bg-white p-6 rounded shadow-md w-full max-w-md z-10">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <label className="block mb-2">
          First Name:
          <input
            type="text"
            name="firstName"
            className="mt-1 p-2 border rounded w-full"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </label>
        <label className="block mb-2">
          Last Name:
          <input
            type="text"
            name="lastName"
            className="mt-1 p-2 border rounded w-full"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </label>
        <label className="block mb-2">
          Email:
          <input
            type="email"
            name="email"
            className="mt-1 p-2 border rounded w-full"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <label className="block mb-2">
          Display Name:
          <input
            type="text"
            name="displayName"
            className="mt-1 p-2 border rounded w-full"
            value={formData.displayName}
            onChange={handleChange}
            required
          />
        </label>
        <label className="block mb-4">
          Password:
          <input
            type="password"
            name="password"
            className="mt-1 p-2 border rounded w-full"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Register
        </button>
      </form>
    </main>
  );
}
