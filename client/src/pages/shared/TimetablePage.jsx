import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePage() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = dayNames[new Date().getDay()];
    return DAYS.includes(today) ? today : 'Monday';
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/timetable');
        if (res.data.success) setTimetable(res.data.data);
      } catch (err) {
        console.error('Error loading timetable:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const dayEntries = timetable.filter(t => t.day_of_week === selectedDay);

  const todayName = (() => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[new Date().getDay()];
  })();

  if (loading) return <LoadingSpinner message="Loading timetable..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-campus-600" />
          Campus Timetable
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Official MCA Semester 3 schedule — {timetable.length} total entries</p>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${
              selectedDay === day
                ? 'bg-campus-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-campus-400'
            }`}
          >
            {day}
            {day === todayName && (
              <span className={`ml-1 text-[9px] font-bold ${selectedDay === day ? 'text-campus-200' : 'text-campus-500'}`}>
                (Today)
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Timetable Entries */}
      {dayEntries.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={`No classes on ${selectedDay}`}
          description="No official timetable entries scheduled for this day."
        />
      ) : (
        <div className="space-y-3">
          {dayEntries.map(entry => (
            <div
              key={entry.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-campus-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Course badge */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-campus-700 uppercase tracking-wider bg-campus-50 border border-campus-200 px-2 py-0.5 rounded">
                      {entry.course_code}
                    </span>
                    <span className="text-[10px] text-slate-400 border border-slate-200 px-2 py-0.5 rounded">
                      {entry.semester} • Section {entry.section}
                    </span>
                  </div>

                  {/* Course name */}
                  <h3 className="text-sm font-bold text-slate-800">{entry.course_name}</h3>

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      {entry.faculty_name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {entry.room_number} — {entry.building}, F{entry.floor}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <CalendarDays className="w-3 h-3 text-slate-400" />
                      {entry.room_type}
                    </span>
                  </div>
                </div>

                {/* Time Block */}
                <div className="flex-shrink-0 text-right sm:text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm font-mono font-bold text-slate-700">
                      {entry.start_time?.slice(0, 5)} – {entry.end_time?.slice(0, 5)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {DAYS.map(day => {
          const count = timetable.filter(t => t.day_of_week === day).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`p-3 rounded-xl border text-center transition-colors ${
                selectedDay === day
                  ? 'border-campus-300 bg-campus-50'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <p className="text-[10px] font-semibold text-slate-500">{day.slice(0, 3)}</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{count}</p>
              <p className="text-[10px] text-slate-400">classes</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
