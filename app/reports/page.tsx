"use client";

import { useState, useEffect } from 'react';
import Card from '../components/ui/card.tsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData { day: string; revenue: number; }
interface SourceData { name: string; value: number; }
interface FinesData { date: string; count: number; totalAmount: number; }
interface UsersData { date: string; newUsers: number; }
interface BookingData { lotName: string; bookings: number; }

export default function AdminAnalyticsPage() {
  const [revenue, setRevenue] = useState<number>(0);
  const [revenueSeries, setRevenueSeries] = useState<RevenueData[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceData[]>([]);
  const [finesStats, setFinesStats] = useState<FinesData[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [newUsersSeries, setNewUsersSeries] = useState<UsersData[]>([]);
  const [topBookings, setTopBookings] = useState<BookingData[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      const revRes = await fetch('/api/analytics/revenue');
      const { total, series } = await revRes.json();
      setRevenue(total);
      setRevenueSeries(series);

      const sbRes = await fetch('/api/analytics/source-revenue');
      setSourceBreakdown(await sbRes.json());

      const fRes = await fetch('/api/analytics/fines');
      setFinesStats(await fRes.json());

      const auRes = await fetch('/api/analytics/active-users');
      const auJson = await auRes.json();
      setActiveUsers(auJson.count);

      const nuRes = await fetch('/api/analytics/new-users');
      setNewUsersSeries(await nuRes.json());

      const bkRes = await fetch('/api/analytics/top-bookings');
      setTopBookings(await bkRes.json());
    }
    fetchAnalytics();
  }, []);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A'];

  return (
    <main className="p-8 bg-gray-100 text-black">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="Total Revenue" className="text-black">
          <p className="text-2xl font-bold text-black">${revenue.toLocaleString()}</p>
        </Card>
        <Card title="Active Users" className="text-black">
          <p className="text-2xl font-bold text-black">{activeUsers}</p>
        </Card>
        <Card title="Fines Issued" className="text-black">
          <p className="text-2xl font-bold text-black">
            {finesStats.reduce((sum, f) => sum + f.count, 0)}
          </p>
        </Card>
        <Card title="New Users (7d)" className="text-black">
          <p className="text-2xl font-bold text-black">
            {newUsersSeries.reduce((sum, d) => sum + d.newUsers, 0)}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Over Time */}
        <Card title="Revenue Over Time" className="text-black">
          {revenueSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueSeries} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <XAxis dataKey="day" stroke="#000" tick={{ fill: '#000' }} />
                <YAxis stroke="#000" tick={{ fill: '#000' }} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No revenue data</div>
          )}
        </Card>

        {/* Revenue Breakdown */}
        <Card title="Revenue Breakdown" className="text-black">
          {sourceBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                  stroke="#000"
                >
                  {sourceBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No breakdown data</div>
          )}
        </Card>

        {/* Fines Trend */}
        <Card title="Fines Issued & Amounts" className="text-black">
          {finesStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={finesStats} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <XAxis dataKey="date" stroke="#000" tick={{ fill: '#000' }} />
                <YAxis stroke="#000" tick={{ fill: '#000' }} />
                <Tooltip />
                <Bar dataKey="count" name="Count" fill="#82ca9d" />
                <Bar dataKey="totalAmount" name="Amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No fines data</div>
          )}
        </Card>

        {/* New Users Over Time */}
        <Card title="New Users Over Time" className="text-black">
          {newUsersSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={newUsersSeries} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <XAxis dataKey="date" stroke="#000" tick={{ fill: '#000' }} />
                <YAxis stroke="#000" tick={{ fill: '#000' }} />
                <Tooltip />
                <Line dataKey="newUsers" stroke="#ff7300" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No new users data</div>
          )}
        </Card>

        {/* Top Booked Lots */}
        <Card title="Top Booked Lots" className="text-black lg:col-span-2">
          {topBookings.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topBookings} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                <XAxis type="number" stroke="#000" tick={{ fill: '#000' }} />
                <YAxis dataKey="lotName" type="category" stroke="#000" tick={{ fill: '#000' }} width={100} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#413ea0" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">No booking data</div>
          )}
        </Card>
      </div>
    </main>
  );
}
