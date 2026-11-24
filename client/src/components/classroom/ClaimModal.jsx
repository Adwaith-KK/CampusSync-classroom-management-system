import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Clock, AlertCircle } from 'lucide-react';

export default function ClaimModal({ isOpen, onClose, classroom, onConfirm, loading }) {
  const [duration, setDuration] = useState(60);
  const [purpose, setPurpose] = useState('Unscheduled Academic Lecture / Remedial Class');
  const [error, setError] = useState('');

  if (!classroom) return null;

  const now = new Date();
  const expiryTime = new Date(now.getTime() + duration * 60 * 1000);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setError('Please provide a purpose for claiming this classroom.');
      return;
    }
    setError('');
    onConfirm({
      classroomId: classroom.id,
      durationMinutes: duration,
      purpose: purpose.trim()
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Claim Classroom ${classroom.roomNumber}`} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info card */}
        <div className="bg-campus-50 rounded-xl p-3.5 border border-campus-200 text-xs text-campus-900">
          <p className="font-semibold text-campus-950">{classroom.building} — Floor {classroom.floor}</p>
          <p className="text-campus-700 mt-0.5">Capacity: {classroom.capacity} seats | Type: {classroom.type}</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Duration selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Select Temporary Claim Duration
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[30, 60, 90, 120].map((mins) => (
              <button
                type="button"
                key={mins}
                onClick={() => setDuration(mins)}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  duration === mins
                    ? 'bg-campus-600 text-white border-campus-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Claim time preview */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Claim Starts</span>
            <span className="font-bold text-slate-800">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <Clock className="w-4 h-4 text-campus-600" />
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Auto-Releases At</span>
            <span className="font-bold text-campus-700">
              {expiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Academic Purpose / Subject
          </label>
          <input
            type="text"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Extra Lab Session, Viva Preparation, Project Review"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500 focus:border-campus-500"
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
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Claiming Room...' : 'Confirm Temporary Claim'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
