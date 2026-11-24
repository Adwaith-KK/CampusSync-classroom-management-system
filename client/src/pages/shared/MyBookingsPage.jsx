import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { BookOpen, Plus, X, Filter } from 'lucide-react';
import BookingModal from '../../components/booking/BookingModal';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [cancelDialog, setCancelDialog] = useState({ open: false, bookingId: null });
  const [facilities, setFacilities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadData = async () => {
    try {
      const [bRes, fRes, cRes] = await Promise.all([
        api.get('/bookings/my'),
        api.get('/facilities'),
        api.get('/classrooms'),
      ]);
      if (bRes.data.success) setBookings(bRes.data.data);
      if (fRes.data.success) setFacilities(fRes.data.data);
      if (cRes.data.success) setClassrooms(cRes.data.data);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleBookingSubmit = async (bookingData) => {
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', bookingData);
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setBookingModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to submit booking.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelDialog.bookingId) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/bookings/${cancelDialog.bookingId}/cancel`);
      if (res.data.success) {
        setMessage({ text: 'Booking cancelled successfully.', type: 'success' });
        setCancelDialog({ open: false, bookingId: null });
        await loadData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to cancel booking.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const statuses = ['all', 'pending', 'approved', 'rejected', 'cancelled', 'completed'];
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const canBook = user?.role !== 'student';

  if (loading) return <LoadingSpinner message="Loading your bookings..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-campus-600" />
            My Booking Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{bookings.length} total request{bookings.length !== 1 ? 's' : ''}</p>
        </div>
        {canBook && (
          <button
            onClick={() => setBookingModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Request
          </button>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="font-bold ml-2"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors flex-shrink-0 ${
              filter === s
                ? 'bg-campus-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-campus-400'
            }`}
          >
            {s === 'all' ? `All (${bookings.length})` : `${s} (${bookings.filter(b => b.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={filter === 'all' ? 'No Booking Requests' : `No ${filter} requests`}
          description={canBook ? 'Submit your first facility or classroom booking request.' : 'No requests match the selected filter.'}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      b.booking_type === 'classroom'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-campus-50 text-campus-700 border-campus-200'
                    }`}>
                      {b.booking_type === 'classroom' ? '📚 Classroom' : '🏛️ Facility'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Requested: {new Date(b.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{b.purpose}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {b.booking_type === 'classroom'
                      ? `Classroom ${b.room_number} (${b.building})`
                      : `${b.facility_name} — ${b.facility_type}`}
                    {' • '}{b.booking_date}
                    {' • '}{b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}
                    {' • '}{b.participants} participants
                  </p>
                  {b.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 italic">"{b.description}"</p>
                  )}
                  {b.status === 'rejected' && b.rejection_reason && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      ✗ Reason: {b.rejection_reason}
                    </p>
                  )}
                  {b.reviewer_name && b.status !== 'pending' && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Reviewed by {b.reviewer_name}
                      {b.reviewed_at ? ` on ${new Date(b.reviewed_at).toLocaleDateString('en-IN')}` : ''}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Awaiting: <span className="font-semibold uppercase">{b.approver_role}</span> approval
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={b.status} />
                  {(b.status === 'pending') && (
                    <button
                      onClick={() => setCancelDialog({ open: true, bookingId: b.id })}
                      className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
        loading={submitting}
        facilities={facilities}
        classrooms={classrooms}
      />

      {/* Cancel Confirmation */}
      <ConfirmationDialog
        isOpen={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, bookingId: null })}
        onConfirm={handleCancel}
        title="Cancel Booking Request"
        message="Are you sure you want to cancel this booking request? This action cannot be undone."
        confirmText="Cancel Booking"
        type="danger"
        loading={submitting}
      />
    </div>
  );
}
