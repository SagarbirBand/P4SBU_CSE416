// app/contact/page.tsx
'use client';
import { useState } from 'react';
import BGIMG from '../components/BGIMG';
import FormInput from '../components/FormInput';
import FormTextArea from '../components/FormTextArea';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState('');

  // Universal change handler for both inputs and textareas
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setStatus('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatus('Failed to send message.');
      }
    } catch (err) {
      setStatus('An unexpected error occurred');
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4">
      <BGIMG url="/map-bg.jpg" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-white p-6 rounded shadow-md w-full max-w-lg text-black"
      >
        <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
        {status && <p className="mb-4">{status}</p>}
        <FormInput
          label="Name:"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <FormInput
          label="Email:"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <FormTextArea
          label="Message:"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Send Message
        </button>
      </form>
    </main>
  );
}
