import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      

      {/* HERO SECTION */}
      <div className="relative w-full flex-grow bg-[url('/map-bg.jpg')] bg-cover bg-center flex items-center justify-center">
        {/* Optional semi-transparent overlay */}
        <div className="absolute inset-0 bg-white/70"></div>

        <div className="relative z-10 text-center p-8">
          <h1 className="text-5xl font-bold text-red-600 mb-4">
            Welcome to P4SBU
          </h1>
          <p className="text-xl text-black mb-8">Find Parking Now</p>
          <Link
            href="/reserve"
            className="bg-red-600 text-white px-6 py-3 rounded font-medium hover:bg-red-700"
          >
            Reserve Now
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="w-full p-4 bg-white text-center text-black border-t border-gray-200">
        <p>
          &copy; {new Date().getFullYear()} P4SBU. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
