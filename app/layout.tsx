import Link from "next/link";
import { cookies } from "next/headers";
import "./globals.css";
import RefreshHandler from './components/RefreshHandler';
import { getUserFromToken } from './api/lib/auth';

const LogoutButton = () => <a
                              href="/api/logout"
                              className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300"
                            >
                              Log Out
                           </a>

export const metadata = {
  title: "P4SBU",
  description: "Parking Website"
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Why are we not doing this server side?
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const user = token ? await getUserFromToken(token) : null;

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.isAuth ?? false;
  
  const isConfirmed = user?.isConfirmed || false;

  if (isLoggedIn && !isConfirmed) {

    return (
    <html lang="en">
      <body className="bg-white">
        <RefreshHandler />
        <nav className="w-full bg-white flex items-center justify-between px-8 py-4 border-b border-gray-200">
          <Link href="/" className="text-2xl font-bold text-red-600">
            P4SBU
          </Link>
          <div className="space-x-6">
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
          </div>
        </nav>
        {children}
      </body>
    </html>
    );
  }

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
          ) : !isAdmin ? (
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
            <>
              <Link href="/ParkingMgmt" className="text-black hover:text-red-600">
                Parking Mgmt.
              </Link>
              <Link href="/userAuth" className="text-black hover:text-red-600">
                User Authentication
              </Link>
              <Link href="/giveFines" className="text-black hover:text-red-600">
                Fines
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