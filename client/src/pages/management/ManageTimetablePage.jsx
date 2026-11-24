import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import TimetableModal from '../../components/timetable/TimetableModal';
import { CalendarDays, Plus, Trash2, X, Clock, MapPin, User } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function ManageTimetablePage() {
  const [timetable, setTimetable] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [addModal, setAddModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, courseName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadAll = async () => {
    try {
      const [tRes, cRes, uRes] = await Promise.all([
        api.get('/timetable'),
        api.get('/classrooms'),
        api.get('/users'),
      ]);
      if (tRes.data.success) setTimetable(tRes.data.data);
      if (cRes.data.success) setClassrooms(cRes.data.data);
      if (uRes.data.success) setFaculties(uRes.data.data.filter(u => u.role === 'faculty'));
    } catch (err) {
      console.error('Error loading timetable data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleAddEntry = async (formData) => {
    setSubmitting(true);
    try {
      const res = await api.post('/timetable', formData);
      if (res.data.success) {
        setMessage({ text: 'Timetable entry added successfully.', type: 'success' });
        setAddModal(false);
        await loadAll();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to add timetable entry.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/timetable/${deleteDialog.id}`);
      if (res.data.success) {
        setMessage({ text: 'Timetable entry removed.', type: 'success' });
        setDeleteDialog({ open: false, id: null, courseName: '' });
        await loadAll();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Delete failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const dayEntries = timetable.filter(t => t.day_of_week === selectedDay);

  if (loading) return <LoadingSpinner message="Loading timetable management..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-campus-600" />
            Manage Timetable
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{timetable.length} total entries — conflict-free scheduling enforced</p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Day Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors ${
              selectedDay === day ? 'bg-campus-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-campus-400'
            }`}
          >
            {day} ({timetable.filter(t => t.day_of_week === day).length})
          </button>
        ))}
      </div>

      {/* Entries for selected day */}
      {dayEntries.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={`No classes on ${selectedDay}`}
          description="Click 'Add Entry' to schedule a class for this day."
        />
      ) : (
        <div className="space-y-2">
          {dayEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-3 shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[10px] font-bold text-campus-700 uppercase tracking-wider bg-campus-50 border border-campus-200 px-2 py-0.5 rounded">
                    {entry.course_code}
                  </span>
                  <span className="text-[10px] text-slate-400">{entry.semester} • {entry.section}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800">{entry.course_name}</h4>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {entry.start_time?.slice(0,5)} – {entry.end_time?.slice(0,5)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {entry.room_number} ({entry.building})
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <User className="w-3 h-3 text-slate-400" />
                    {entry.faculty_name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDeleteDialog({ open: true, id: entry.id, courseName: entry.course_name })}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Timetable Entry Modal */}
      <TimetableModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onSubmit={handleAddEntry}
        classrooms={classrooms}
        faculties={faculties}
        loading={submitting}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, courseName: '' })}
        onConfirm={handleDelete}
        title="Remove Timetable Entry"
        message={`Remove "${deleteDialog.courseName}" from the ${selectedDay} timetable? Classroom availability will be updated accordingly.`}
        confirmText="Remove Entry"
        type="danger"
        loading={submitting}
      />
    </div>
  );
}
