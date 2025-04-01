// app/layout.tsx
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "P4SBU",
  description: "Parking Website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* NAVBAR */}
        <nav className="w-full bg-white flex items-center justify-between px-8 py-4 border-b border-gray-200">
          {/* Link the P4SBU text back to the home page */}
          <Link href="/" className="text-2xl font-bold text-red-600">
            P4SBU
          </Link>
          <div className="space-x-6">
            <Link href="/about" className="text-black hover:text-red-600">
              About Us
            </Link>
            <Link href="/contact" className="text-black hover:text-red-600">
              Contact
            </Link>
            <Link
              href="/login"
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
            >
              Register
            </Link>
          </div>
        </nav>

        {/* Page Content */}
        {children}
      </body>
    </html>
  );
}
