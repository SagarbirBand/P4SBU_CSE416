// app/layout.tsx
import Link from "next/link";
import "./globals.css";

// TODO: Add footer

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
      <body className="bg-white">
        {/* TODO: We need to figure out a way to make the navbar dynamic without forcing every page to use "use-client" */}
        <nav className="w-full bg-white flex items-center justify-between px-8 py-4 border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold text-red-600">
            P4SBU
          </Link>
          <div className="space-x-6">
            <Link href="/profile" className="text-black hover:text-red-600">
              Profile
            </Link>
            <Link href="/reserve" className="text-black hover:text-red-600">
              Reserve
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
        {children}
      </body>
    </html>
  );
}
