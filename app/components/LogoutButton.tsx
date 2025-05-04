"use client";

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    // Call the logout API
    await fetch('/api/logout', { method: 'GET' });
    
    // Refresh the page to update the UI based on new cookie state
    router.refresh();
    
    // Navigate to the home page
    router.push('/');
  };
  
  return (
    <button
      onClick={handleLogout}
      className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
    >
      Log Out
    </button>
  );
}