'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BGIMG from '../components/BGIMG';
import FormInput from '../components/FormInput';

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: '', password: '', stayLoggedIn: false });
  const [error, setError] = useState('');

  // On mount, check if the user is already logged in
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center">
      <BGIMG url="/map-bg.jpg" />
      <form
        onSubmit={handleLogin}
        className="relative z-10 text-black bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <FormInput
          label="Email:"
          type="email"
          name="email"
          value={credentials.email}
          onChange={handleChange}
          required
        />
        <FormInput
          label="Password:"
          type="password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          required
        />
        <label className="block mb-4">
          <input
            type="checkbox"
            name="stayLoggedIn"
            checked={credentials.stayLoggedIn}
            onChange={handleChange}
            className="mr-2"
          />
          Stay logged in
        </label>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
        <p className="mt-4 text-center">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-700">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}
