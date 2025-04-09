"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RefreshHandler() {
  const router = useRouter();
  
  useEffect(() => {
    // This will refresh the page on component mount
    router.refresh();
  }, [router]);
  
  // This component doesn't render anything
  return null;
}