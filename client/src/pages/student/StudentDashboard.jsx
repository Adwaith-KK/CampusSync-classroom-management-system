import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { DoorOpen, Building2, CalendarDays, ArrowRight, Info, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cRes, fRes, tRes] = await Promise.all([
          api.get('/classrooms'),
          api.get('/facilities'),
          api.get('/timetable')
        ]);
        if (cRes.data.success) setClassrooms(cRes.data.data);
        if (fRes.data.success) setFacilities(fRes.data.data);
        if (tRes.data.success) setTimetable(tRes.data.data);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading campus availability and timetable..." />;

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <AlertCircle className="w-10 h-10 text-red-400" />
      <p className="text-sm font-semibold text-slate-700">{error}</p>
    </div>
  );

  const availableRoomsCount = classrooms.filter(c => c.status === 'available').length;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const todayClasses = timetable.filter(t => t.day_of_week === todayName);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-campus-800 to-campus-600 text-white p-6 shadow-md shadow-campus-900/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Student Portal Active
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name}</h1>
            <p className="text-xs text-campus-100 mt-1 max-w-xl">
              {user?.department} — Real-time tracking of classroom occupancy, campus sports courts, auditoriums, and your academic schedule.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              to="/classrooms"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-campus-700 font-bold text-xs rounded-xl shadow hover:bg-campus-50 transition-colors"
            >
              Check Availability
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Role Notice Card */}
      <div className="rounded-xl bg-sky-50 border border-sky-200 p-4 text-xs text-sky-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Student Role Notice:</span> As a student, your account has live view-only access to classroom availability, timetable occupancy, and campus facility status. Temporary classroom claims and booking reservations are restricted to authorized Faculty and Coordinators.
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Available Classrooms"
          value={`${availableRoomsCount} / ${classrooms.length}`}
          icon={DoorOpen}
          color="emerald"
          subtitle="Currently free rooms"
        />
        <DashboardCard
          title="Today's Classes"
          value={todayClasses.length}
          icon={CalendarDays}
          color="indigo"
          subtitle={`${todayName} Schedule`}
        />
        <DashboardCard
          title="Campus Facilities"
          value={facilities.length}
          icon={Building2}
          color="campus"
          subtitle="Auditoriums & Courts"
        />
        <DashboardCard
          title="Active Claims"
          value={classrooms.filter(c => c.status === 'temporarily_claimed').length}
          icon={Clock}
          color="amber"
          subtitle="Ad-hoc faculty sessions"
        />
      </div>

      {/* Two Column Grid: Today's Schedule & Quick Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-campus-600" />
              <h3 className="font-bold text-sm text-slate-800">Today's Class Schedule ({todayName})</h3>
            </div>
            <Link to="/timetable" className="text-xs font-semibold text-campus-600 hover:text-campus-700">
              Full Timetable
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {todayClasses.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No official classes scheduled for today.</p>
            ) : (
              todayClasses.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-campus-700 uppercase tracking-wider bg-campus-50 border border-campus-200 px-1.5 py-0.5 rounded">
                      {item.course_code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-1">{item.course_name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Faculty: {item.faculty_name}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Room {item.room_number} ({item.building})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-slate-700">
                      {item.start_time?.slice(0, 5) ?? '--:--'} - {item.end_time?.slice(0, 5) ?? '--:--'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Classroom Status Quick Glance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-campus-600" />
              <h3 className="font-bold text-sm text-slate-800">Classroom Availability Live</h3>
            </div>
            <Link to="/classrooms" className="text-xs font-semibold text-campus-600 hover:text-campus-700">
              View All ({classrooms.length})
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {classrooms.slice(0, 5).map((room) => (
              <div key={room.id} className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{room.room_number}</span>
                    <span className="text-[10px] text-slate-400">({room.building} - F{room.floor})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{room.type} • {room.capacity} Seats</p>
                </div>
                <StatusBadge status={room.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
