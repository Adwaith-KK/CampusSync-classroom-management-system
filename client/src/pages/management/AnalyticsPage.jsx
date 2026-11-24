import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DashboardCard from '../../components/common/DashboardCard';
import { BarChart3, DoorOpen, Building2, BookOpen, Users, TrendingUp } from 'lucide-react';

function ProgressBar({ value, max, color = 'campus' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full bg-${color}-500 transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/analytics/overview');
        if (res.data.success) setData(res.data.data);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;
  if (!data) return <p className="text-sm text-slate-500">Failed to load analytics data.</p>;

  const { classrooms, facilities, bookings, users } = data;

  const userMap = {};
  users.forEach(u => { userMap[u.role] = u.count; });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-campus-600" />
          Analytics Overview
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Live campus resource utilization and booking statistics</p>
      </div>

      {/* Classroom KPIs */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <DoorOpen className="w-4 h-4 text-campus-500" /> Classroom Status
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: classrooms.total, color: 'slate' },
            { label: 'Available', value: classrooms.available, color: 'emerald' },
            { label: 'Claimed', value: classrooms.claimed, color: 'amber' },
            { label: 'Scheduled', value: classrooms.scheduled, color: 'indigo' },
            { label: 'Occupied', value: classrooms.occupied, color: 'rose' },
            { label: 'Maintenance', value: classrooms.maintenance, color: 'slate' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wide text-${color}-600 mt-0.5`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Utilization Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mt-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Classroom Utilization Rate</span>
            <span className="text-sm font-bold text-campus-700">{classrooms.utilizationRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${classrooms.utilizationRate > 70 ? 'bg-rose-500' : classrooms.utilizationRate > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${classrooms.utilizationRate}%` }}
            />
          </div>
        </div>
      </section>

      {/* Booking KPIs */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-campus-500" /> Booking Statistics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: bookings.total, cls: 'text-slate-700' },
            { label: 'Pending', value: bookings.pending, cls: 'text-amber-700' },
            { label: 'Approved', value: bookings.approved, cls: 'text-emerald-700' },
            { label: 'Rejected', value: bookings.rejected, cls: 'text-rose-700' },
            { label: 'Cancelled', value: bookings.cancelled, cls: 'text-slate-500' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
              <p className={`text-2xl font-bold ${cls}`}>{value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Approval rate bar */}
        {bookings.total > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mt-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Approval Rate</span>
              <span className="text-sm font-bold text-emerald-700">
                {Math.round((bookings.approved / (bookings.approved + bookings.rejected || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 flex overflow-hidden">
              <div
                className="h-3 bg-emerald-500 transition-all"
                style={{ width: `${(bookings.approved / bookings.total) * 100}%` }}
              />
              <div
                className="h-3 bg-rose-400 transition-all"
                style={{ width: `${(bookings.rejected / bookings.total) * 100}%` }}
              />
              <div
                className="h-3 bg-amber-400 transition-all"
                style={{ width: `${(bookings.pending / bookings.total) * 100}%` }}
              />
            </div>
            <div className="flex gap-4 mt-1.5">
              {[{ c: 'bg-emerald-500', l: 'Approved' }, { c: 'bg-rose-400', l: 'Rejected' }, { c: 'bg-amber-400', l: 'Pending' }].map(({ c, l }) => (
                <span key={l} className="flex items-center gap-1 text-[10px] text-slate-500">
                  <span className={`w-2 h-2 rounded-full ${c}`} />{l}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Two column: Most claimed rooms + Top facilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Claimed Classrooms */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-campus-500" /> Most Claimed Classrooms
          </h3>
          {classrooms.topClaimed?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No claim data available yet.</p>
          ) : (
            <div className="space-y-2.5">
              {classrooms.topClaimed?.map((room, i) => (
                <div key={room.room_number}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{room.room_number} <span className="text-slate-400 font-normal">({room.building})</span></span>
                    <span className="font-bold text-campus-700">{room.claim_count} claims</span>
                  </div>
                  <ProgressBar value={room.claim_count} max={classrooms.topClaimed[0]?.claim_count || 1} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Booked Facilities */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-campus-500" /> Most Booked Facilities
          </h3>
          {facilities.topBooked?.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No approved booking data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {facilities.topBooked?.map((f) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{f.name} <span className="text-slate-400 font-normal">({f.type})</span></span>
                    <span className="font-bold text-campus-700">{f.booking_count} bookings</span>
                  </div>
                  <ProgressBar value={f.booking_count} max={facilities.topBooked[0]?.booking_count || 1} color="indigo" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Counts */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-campus-500" /> Active Users by Role
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['student', 'faculty', 'hod', 'coordinator'].map(role => (
            <div key={role} className="bg-white rounded-xl border border-slate-200 p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-slate-800">{userMap[role] || 0}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mt-0.5">
                {role === 'hod' ? 'HOD' : role === 'coordinator' ? 'Coordinator' : role === 'faculty' ? 'Faculty' : 'Students'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
