// app/page.tsx
import Link from 'next/link';
import BGIMG from './components/BGIMG.tsx';
import { cookies } from "next/headers";

export default async function Home() {

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const isLoggedIn = Boolean(token);

  const destinationUrl = isLoggedIn ? "/reserve" : "/login";

  return (
    <main className="relative flex flex-col items-center justify-center">
      <BGIMG url="/map-bg.jpg" />
      <div className="relative z-10 text-center">
        <h1 className="text-4xl font-bold mb-4 text-red-500">
          Welcome to P4SBU Parking System
        </h1>
        <p className="mb-6 text-black">
          Easily reserve your parking spot at Stony Brook University!
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href={destinationUrl}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
          >
            Reserve Now
          </Link>
        </div>
      </div>
    </main>
  );
}
