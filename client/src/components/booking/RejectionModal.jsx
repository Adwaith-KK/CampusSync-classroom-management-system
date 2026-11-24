import React, { useState } from 'react';
import Modal from '../common/Modal';
import { AlertTriangle } from 'lucide-react';

export default function RejectionModal({ isOpen, onClose, onConfirm, booking, loading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A rejection reason is mandatory.');
      return;
    }
    setError('');
    onConfirm(booking.id, reason.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Booking Request" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>
            You are rejecting request #{booking.id} ({booking.purpose}). The requester will receive an immediate notification with your explanation.
          </span>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reason for Rejection
          </label>
          <textarea
            required
            rows="3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Conflicted with scheduled campus accreditation or exam session..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
