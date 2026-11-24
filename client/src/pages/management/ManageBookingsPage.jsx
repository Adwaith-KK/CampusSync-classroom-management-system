import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import RejectionModal from '../../components/booking/RejectionModal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { CheckSquare, Filter, Building2, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function ManageBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ open: false, bookingId: null });
  const [approveDialog, setApproveDialog] = useState({ open: false, bookingId: null, resourceName: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadBookings = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/bookings${params}`);
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadBookings();
  }, [filter]);

  const handleApprove = async () => {
    if (!approveDialog.bookingId) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/bookings/${approveDialog.bookingId}/approve`);
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setApproveDialog({ open: false, bookingId: null, resourceName: '' });
        await loadBookings();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to approve booking.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (reason) => {
    if (!rejectionModal.bookingId) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/bookings/${rejectionModal.bookingId}/reject`, { reason });
      if (res.data.success) {
        setMessage({ text: 'Booking request rejected.', type: 'success' });
        setRejectionModal({ open: false, bookingId: null });
        await loadBookings();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to reject booking.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const statuses = ['pending', 'approved', 'rejected', 'cancelled', 'all'];

  if (loading) return <LoadingSpinner message="Loading booking requests..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-campus-600" />
          Manage Booking Requests
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Review, approve, or reject facility and classroom booking requests</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })}><X className="w-3 h-3" /></button>
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
            {s === 'all' ? 'All Requests' : s}
            {s === 'pending' && <span className="ml-1 text-[9px]">●</span>}
          </button>
        ))}
      </div>

      {/* Bookings */}
      {bookings.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={`No ${filter === 'all' ? '' : filter} booking requests`}
          description={filter === 'pending' ? 'No pending requests awaiting your review.' : 'No requests match this filter.'}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map(b => {
            const isExpanded = expandedId === b.id;
            const resourceName = b.booking_type === 'classroom'
              ? `Classroom ${b.room_number} (${b.building})`
              : `${b.facility_name} — ${b.facility_type}`;

            return (
              <div key={b.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Main Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : b.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          b.booking_type === 'classroom'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-campus-50 text-campus-700 border-campus-200'
                        }`}>
                          {b.booking_type}
                        </span>
                        <span className="text-[10px] text-slate-400">#{b.id}</span>
                        <span className="text-[10px] font-semibold text-amber-600 uppercase">
                          → {b.approver_role} Approval
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">{b.purpose}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {resourceName} • {b.booking_date} • {b.start_time?.slice(0,5)} – {b.end_time?.slice(0,5)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        By: <span className="font-semibold">{b.requester_name}</span> ({b.requester_role}) — {b.requester_dept}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.status} />
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 space-y-3">
                    {b.description && (
                      <p className="text-xs text-slate-600"><span className="font-semibold">Description:</span> {b.description}</p>
                    )}
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">Participants:</span> {b.participants}
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-semibold">Submitted:</span> {new Date(b.created_at).toLocaleString('en-IN')}
                    </p>
                    {b.status === 'rejected' && b.rejection_reason && (
                      <p className="text-xs text-rose-700 font-medium">
                        Rejection reason: {b.rejection_reason}
                      </p>
                    )}
                    {b.reviewer_name && (
                      <p className="text-xs text-slate-500">
                        Reviewed by {b.reviewer_name} on {new Date(b.reviewed_at).toLocaleDateString('en-IN')}
                      </p>
                    )}

                    {/* Actions — only for pending */}
                    {b.status === 'pending' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setApproveDialog({ open: true, bookingId: b.id, resourceName }); }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setRejectionModal({ open: true, bookingId: b.id }); }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approve Confirmation */}
      <ConfirmationDialog
        isOpen={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, bookingId: null, resourceName: '' })}
        onConfirm={handleApprove}
        title="Approve Booking Request"
        message={`Are you sure you want to approve this booking request for ${approveDialog.resourceName}? The requester will be notified immediately.`}
        confirmText="Approve Request"
        type="success"
        loading={submitting}
      />

      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.open}
        onClose={() => setRejectionModal({ open: false, bookingId: null })}
        onReject={handleReject}
        loading={submitting}
      />
    </div>
  );
}
