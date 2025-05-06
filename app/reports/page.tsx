"use client";

import { useState, useEffect } from "react";
import Card from "../components/ui/Card";
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
} from "recharts";

interface RevenueData { day: string; revenue: number; }
interface SourceData  { name: string; value: number; }
interface FinesData   { date: string; count: number; totalAmount: number; }
interface BookingData { lotName: string; bookings: number; }

export default function AdminAnalyticsPage() {
  const [totalRevenue, setTotalRevenue]           = useState<number>(0);
  const [sourceBreakdown, setSourceBreakdown]     = useState<SourceData[]>([]);
  const [revenueSeries, setRevenueSeries]         = useState<RevenueData[]>([]);
  const [finesStats, setFinesStats]               = useState<FinesData[]>([]);
  const [reservationsCount, setReservationsCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount]     = useState<number>(0);
  const [topBookings, setTopBookings]             = useState<BookingData[]>([]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [
          payments,
          fines,
          reservations,
          users,
          lots,
          spotTypes
        ] = await Promise.all([
          fetch("/api/payments").then(r => r.json()),
          fetch("/api/fines/all").then(r => r.json()),
          fetch("/api/reservations").then(r => r.json()),
          fetch("/api/users").then(r => r.json()),
          fetch("/api/parkingLots").then(r => r.json()),
          fetch("/api/parkingSpotTypes").then(r => r.json()),
        ]);

        // Reservations count
        setReservationsCount((reservations as any[]).length);

        // Total users
        setTotalUsersCount((users as any[]).length);

        // Revenue: parking vs fines
        const payArr = payments as { id:number; amount:number; createdAt?:string }[];
        const resIds = new Set((reservations as { paymentID:number }[]).map(r => r.paymentID));
        const parkingRev = payArr.filter(p => resIds.has(p.id)).reduce((s,p) => s + p.amount, 0);
        const finesArr = (fines as { amount:number }[]);
        const finesRev = finesArr.reduce((s,f) => s + f.amount, 0);
        setTotalRevenue(parkingRev + finesRev);
        setSourceBreakdown([
          { name: "Parking", value: parkingRev },
          { name: "Fines",   value: finesRev   }
        ]);

        // Revenue over time
        const revByDay: Record<string,number> = {};
        payArr.forEach(p => {
          if (!p.createdAt) return;
          const d = p.createdAt.slice(0,10);
          revByDay[d] = (revByDay[d] || 0) + p.amount;
        });
        setRevenueSeries(
          Object.entries(revByDay)
            .map(([day, revenue]) => ({ day, revenue }))
            .sort((a,b) => a.day.localeCompare(b.day))
        );

        // Fines stats
        const finesByDay: Record<string,{count:number; total:number}> = {};
        finesArr.forEach(f => {
          const createdAt = (f as any).createdAt;
          if (!createdAt) return;
          const d = createdAt.slice(0,10);
          if (!finesByDay[d]) finesByDay[d] = { count:0, total:0 };
          finesByDay[d].count++;
          finesByDay[d].total += f.amount;
        });
        setFinesStats(
          Object.entries(finesByDay)
            .map(([date,{count, total}]) => ({ date, count, totalAmount: total }))
            .sort((a,b) => a.date.localeCompare(b.date))
        );

        // Top booked lots
        const spotMap = (spotTypes as { id:number; lotID:number }[])
          .reduce((m, s) => ({ ...m, [s.id]: s.lotID }), {} as Record<number,number>);
        const bookCount: Record<number,number> = {};
        (reservations as { spotID:number }[]).forEach(r => {
          const lid = spotMap[r.spotID];
          if (!lid) return;
          bookCount[lid] = (bookCount[lid]||0) + 1;
        });
        const lotsArr = lots as { id:number; name:string }[];
        setTopBookings(
          Object.entries(bookCount)
            .map(([lid, bookings]) => {
              const id = Number(lid);
              const lot = lotsArr.find(l => l.id === id);
              return { lotName: lot?.name || `Lot ${id}`, bookings };
            })
            .sort((a,b) => b.bookings - a.bookings)
        );
      } catch(e) {
        console.error(e);
      }
    }
    loadAnalytics();
  }, []);

  // width for scrollable chart
  const chartWidth = Math.max(topBookings.length * 100, 500);

  return (
    <main className="p-8 bg-gray-100 min-h-screen text-black">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card title="Total Revenue">${totalRevenue.toFixed(2)}</Card>
        <Card title="Reservations Made">{reservationsCount}</Card>
        <Card title="Fines Issued">{finesStats.reduce((s,f) => s + f.count, 0)}</Card>
        <Card title="Total Users">{totalUsersCount}</Card>
      </div>

      {/* Top Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card title="Revenue Over Time">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueSeries} margin={{ top:10,right:20,left:0,bottom:10 }}>
              <XAxis dataKey="day" stroke="#000" tick={{ fill:'#000' }} />
              <YAxis domain={[0,'dataMax']} stroke="#000" tick={{ fill:'#000' }} />
              <Tooltip />
              <Line dataKey="revenue" stroke="#8884d8" dot={{ r:3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenue Breakdown">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={sourceBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {sourceBreakdown.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 gap-8">
        <Card title="Fines Issued & Amounts">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={finesStats} margin={{ top:10,right:20,left:0,bottom:10 }}>
              <XAxis dataKey="date" stroke="#000" tick={{ fill:'#000' }} />
              <YAxis stroke="#000" tick={{ fill:'#000' }} />
              <Tooltip />
              <Bar dataKey="count"      name="Count"  fill="#82ca9d" />
              <Bar dataKey="totalAmount" name="Amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Reservations by Lot">
          <div className="overflow-x-auto">
            <div style={{ width: chartWidth, height: 300 }}>
              <BarChart data={topBookings} width={chartWidth} height={300} margin={{ top:10,right:20,left:40,bottom:60 }}>
                <XAxis dataKey="lotName" stroke="#000" interval={0} angle={-45} textAnchor="end" height={60} tick={{ fill:'#000', fontSize:12 }} />
                <YAxis stroke="#000" tick={{ fill:'#000' }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#413ea0" />
              </BarChart>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
