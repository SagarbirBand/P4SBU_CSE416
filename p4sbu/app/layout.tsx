// app/layout.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import "./globals.css";
import RefreshHandler from './components/RefreshHandler';
import LogoutButton from './components/LogoutButton';
import { getUserFromToken } from '../lib/auth';

export const metadata = {
  title: "P4SBU",
  description: "Parking Website",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Why are we not doing this server side?
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  const user = token ? await getUserFromToken(token) : null;

  const isLoggedIn = Boolean(user);
  const isAuth = user?.isAuth ?? false; // safely extract isAuth

  //console.log("isAuth:", isAuth); // Optional: debug check

  return (
    <html lang="en">
      <body className="bg-white">
        <RefreshHandler />
        <nav className="w-full bg-white flex items-center justify-between px-8 py-4 border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold text-red-600">
            P4SBU
          </Link>
          <div className="space-x-6">
          {!isLoggedIn ? (
            
            
            //not logged in case
            <>
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
            </>
          ) : !isAuth ? (
            
            
            //generic user case
            <>
              <Link href="/reserve" className="text-black hover:text-red-600">
                Reserve
              </Link>
              <Link href="/profile" className="text-black hover:text-red-600">
                Profile
              </Link>
              <LogoutButton />
            </>
          ) : (
            
            
            //admin case
            <>
              <Link href="/auth" className="text-black hover:text-red-600">
                User Auth.
              </Link>
              <Link href="/parking" className="text-black hover:text-red-600">
                Parking Mgmt.
              </Link>
              <Link href="/reports" className="text-black hover:text-red-600">
                Reports
              </Link>
              <LogoutButton />
            </>
          )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
