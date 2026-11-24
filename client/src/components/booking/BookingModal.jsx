import React, { useState } from 'react';
import Modal from '../common/Modal';
import { Calendar, Clock, Users, Building, AlertCircle } from 'lucide-react';

export default function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  facilities = [],
  classrooms = [],
  initialResource = null // { type: 'facility'|'classroom', id: number }
}) {
  const [bookingType, setBookingType] = useState(initialResource?.type || 'facility');
  const [facilityId, setFacilityId] = useState(initialResource?.type === 'facility' ? initialResource.id : (facilities[0]?.id || ''));
  const [classroomId, setClassroomId] = useState(initialResource?.type === 'classroom' ? initialResource.id : (classrooms[0]?.id || ''));
  
  // Tomorrow's date as default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = new Date().toISOString().split('T')[0];
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [bookingDate, setBookingDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');
  const [participants, setParticipants] = useState(50);
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!purpose.trim()) {
      setError('Please provide a purpose for this booking request.');
      return;
    }
    if (startTime >= endTime) {
      setError('Start time must be strictly earlier than end time.');
      return;
    }
    if (bookingDate < minDate) {
      setError('Booking date cannot be in the past.');
      return;
    }

    setError('');
    onSubmit({
      bookingType,
      facilityId: bookingType === 'facility' ? parseInt(facilityId, 10) : null,
      classroomId: bookingType === 'classroom' ? parseInt(classroomId, 10) : null,
      bookingDate,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      participants: parseInt(participants, 10) || 1,
      purpose: purpose.trim(),
      description: description.trim()
    });
  };

  const selectedFacility = facilities.find(f => f.id === parseInt(facilityId, 10));
  const selectedClassroom = classrooms.find(c => c.id === parseInt(classroomId, 10));

  const approverNote = bookingType === 'classroom'
    ? 'Planned classroom event requests route to the Head of Department (HOD) for official academic approval.'
    : (selectedFacility?.type === 'Seminar Hall' || selectedFacility?.type === 'Conference Room')
    ? 'Requests for seminar halls & conference suites require HOD departmental approval.'
    : 'Campus facility & sports arena requests route to Program Coordinator for scheduling confirmation.';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Resource Booking Request" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Resource Type Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Booking Category</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBookingType('facility')}
              className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                bookingType === 'facility'
                  ? 'bg-campus-600 text-white border-campus-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building className="w-4 h-4" />
              Campus Facility (Auditorium / Sports)
            </button>
            <button
              type="button"
              onClick={() => setBookingType('classroom')}
              className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${
                bookingType === 'classroom'
                  ? 'bg-campus-600 text-white border-campus-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Future Classroom Event (HOD Approval)
            </button>
          </div>
        </div>

        {/* Resource Selector */}
        {bookingType === 'facility' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Facility</label>
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            >
              {facilities.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.type} — Capacity: {f.capacity} — {f.location})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Classroom</label>
            <select
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            >
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>
                  {c.roomNumber} ({c.type} — {c.building}, Floor {c.floor} — Capacity: {c.capacity})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date & Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Date</label>
            <input
              type="date"
              required
              min={minDate}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Time</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Time</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
        </div>

        {/* Purpose & Participants */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Event Title / Purpose</label>
            <input
              type="text"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Guest Lecture on Cloud Security"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected Attendees</label>
            <input
              type="number"
              min="1"
              required
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Detailed Description / Equipment Needs</label>
          <textarea
            rows="2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe technical requirements, AV setups, or special considerations..."
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
        </div>

        {/* Approver Routing Note */}
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
          <Clock className="w-4 h-4 text-campus-600 flex-shrink-0 mt-0.5" />
          <span>{approverNote}</span>
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
            className="px-5 py-2 text-xs font-semibold text-white bg-campus-600 hover:bg-campus-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Submitting Request...' : 'Submit Booking Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
