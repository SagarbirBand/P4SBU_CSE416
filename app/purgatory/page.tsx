import { cookies } from "next/headers";
import { getUserFromToken } from '../api/lib/auth';
import { redirect } from "next/navigation";

export default async function PurgatoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const user = token ? await getUserFromToken(token) : null;

  if (!user) {
    redirect('/login'); // If no user, send to login
  }

  const name = user.name ?? "User"; // fallback in case name is missing

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-8">
      <h1 className="text-4xl font-bold mb-6 text-red-600">Welcome, {name}!</h1>
      <p className="text-lg text-gray-700 mb-4">
        Thank you for registering. Your account is currently pending confirmation by an administrator.
      </p>
      <p className="text-lg text-gray-700 mb-8">
        Please wait patiently. If you believe there is an issue, feel free to reach out to us via the <a href="/contact" className="text-red-600 underline hover:text-red-800">Contact</a> page.
      </p>
    </div>
  );
}