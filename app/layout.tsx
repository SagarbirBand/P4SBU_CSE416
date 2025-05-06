import Link from "next/link";
import { cookies } from "next/headers";
import "./globals.css";
import { getUserFromToken } from './api/lib/auth';

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

  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/" className="text-2xl font-bold text-red-600">
            P4SBU
          </Link>
          <div className="space-x-6">
          {!isLoggedIn && !isConfirmed ? (
            <>
              <Link href="/contact" className="nav-btn-1">
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
                className="nav-btn-2"
              >
                Register
              </Link>
            </>
          ) : (
            <>
            {!isAdmin ? (
                <>
                <Link href="/reserve" className="nav-btn-1">
                  Reserve
                </Link>
                <Link href="/profile" className="nav-btn-1">
                  Profile
                </Link>
                </>
              ) : (
                <>
                  <Link href="/ParkingMgmt" className="nav-btn-1">
                    Parking Mgmt.
                  </Link>
                  <Link href="/userAuth" className="nav-btn-1">
                    User Authentication
                  </Link>
                  <Link href="/giveFines" className="nav-btn-1">
                    Fines
                  </Link>
                  <Link href="/reports" className="nav-btn-1">
                    Reports
                  </Link>
                </>
              )}
              <Link href="/api/logout" className="nav-btn-2">
                Log Out
              </Link>
            </>
          )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}