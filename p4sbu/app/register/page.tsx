// app/register/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BGIMG from '../components/BGIMG';
import FormInput from '../components/FormInput';


export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [permitType, setPermit] = useState('');
  const [licensePlate, setLicense] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  /*useEffect(() => {
    async function checkLogin() {
      try {
        const res = await fetch('/api/login', { method: 'GET' });
        const data = await res.json();
        if (data.loggedIn) {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error checking login status', err);
      }
    }
    checkLogin();
  }, [router]);*/

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          permitType,
          licensePlate,
          address,
        }),
      });
  
      if (res.ok) {
        router.push('/dashboard');
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
      <BGIMG url="/map-bg.jpg" />
      <form
        onSubmit={handleRegister}
        className="relative z-10 text-black bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <FormInput
            label="Name"
            name="name"
            type="text"
            value={fullName}
            onChange={(e) => setName(e.target.value)}
            required
          />
        <FormInput
            label="Email:"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        <FormInput
            label="Password:"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        <label htmlFor="permit" className="block mb-4">
            <span className='text-gray-700'>Permit Type</span>
          <select
            id="permit"
            value={permitType}
            onChange={(e) => setPermit(e.target.value)}
            required
            className="w-full border mt-1 p-2 rounded"
          >
            <option value="">Select a permit</option>
            <option value="Resident">Resident</option>
            <option value="Commuter">Commuter</option>
            <option value="Commuter Premium">Commuter Premium</option>
            <option value="Faculty/Staff">Faculty/Staff</option>
            <option value="ADA">ADA</option>
            <option value="Other/Misc.">Other/Misc.</option>
            <option value="None">None</option>
          </select>
        </label>
        <FormInput
          label="License"
          name="license"
          type="text"
          value={licensePlate}
          onChange={(e) => setLicense(e.target.value)}
          required
        />
        <FormInput
          label="Address"
          name="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Register
        </button>
        <p className="mt-4 text-center">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700"
          >
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
