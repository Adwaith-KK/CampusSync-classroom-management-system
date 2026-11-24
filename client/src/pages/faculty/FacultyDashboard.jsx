import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ClaimModal from '../../components/classroom/ClaimModal';
import BookingModal from '../../components/booking/BookingModal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { DoorOpen, Building2, CalendarDays, Clock, Plus, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedRoomToClaim, setSelectedRoomToClaim] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [releaseDialog, setReleaseDialog] = useState({ open: false, claimId: null, roomNumber: '' });
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: 'success' });

  const loadData = async () => {
    try {
      const [cRes, fRes, clRes, bRes, tRes] = await Promise.all([
        api.get('/classrooms'),
        api.get('/facilities'),
        api.get('/classroom-claims/my'),
        api.get('/bookings/my'),
        api.get('/timetable')
      ]);
      if (cRes.data.success) setClassrooms(cRes.data.data);
      if (fRes.data.success) setFacilities(fRes.data.data);
      if (clRes.data.success) setMyClaims(clRes.data.data);
      if (bRes.data.success) setMyBookings(bRes.data.data);
      if (tRes.data.success) setTimetable(tRes.data.data);
    } catch (err) {
      console.error('Error loading faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const activeClaim = myClaims.find(c => c.status === 'active' && new Date(c.end_time) > new Date());

  const handleClaimSubmit = async ({ classroomId, durationMinutes, purpose }) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/classrooms/${classroomId}/claim`, { durationMinutes, purpose });
      if (res.data.success) {
        setActionMessage({ text: res.data.message, type: 'success' });
        setClaimModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Failed to claim classroom.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseConfirm = async () => {
    if (!releaseDialog.claimId) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/classroom-claims/${releaseDialog.claimId}/release`);
      if (res.data.success) {
        setActionMessage({ text: res.data.message, type: 'success' });
        setReleaseDialog({ open: false, claimId: null, roomNumber: '' });
        await loadData();
      }
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Failed to release claim.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingSubmit = async (bookingData) => {
    setSubmitting(true);
    try {
      const res = await api.post('/bookings', bookingData);
      if (res.data.success) {
        setActionMessage({ text: res.data.message, type: 'success' });
        setBookingModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setActionMessage({ text: err.response?.data?.message || 'Failed to submit booking request.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading faculty portal..." />;

  const availableRooms = classrooms.filter(c => c.status === 'available');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const myTodayClasses = timetable.filter(t => t.faculty_id === user?.id && t.day_of_week === todayName);

  return (
    <div className="space-y-6">
      {/* Alert Banner for Actions */}
      {actionMessage.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage({ text: '', type: 'success' })} className="font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Active Classroom Claim Banner (If Faculty has an active claim right now) */}
      {activeClaim ? (
        <div className="rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white p-6 shadow-md shadow-amber-600/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                Active Classroom Claim Ongoing
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Classroom {activeClaim.room_number} Claimed</h2>
              <p className="text-xs text-amber-100 mt-1 max-w-xl">
                Purpose: "{activeClaim.purpose}" • Auto-expires at {new Date(activeClaim.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setReleaseDialog({ open: true, claimId: activeClaim.id, roomNumber: activeClaim.room_number })}
                className="px-4 py-2 bg-white text-rose-700 font-bold text-xs rounded-xl shadow hover:bg-rose-50 transition-colors"
              >
                Release Classroom Early
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Welcome Banner */
        <div className="rounded-2xl bg-gradient-to-r from-campus-800 to-campus-600 text-white p-6 shadow-md shadow-campus-900/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Faculty Portal Active
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Welcome, {user?.name}</h1>
              <p className="text-xs text-campus-100 mt-1 max-w-xl">
                Claim free classrooms for immediate unscheduled sessions or submit future facility/event requests.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBookingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Request Booking
              </button>
              <Link
                to="/classrooms"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-campus-700 font-bold text-xs rounded-xl shadow hover:bg-campus-50 transition-colors"
              >
                Claim Free Room
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Available Classrooms"
          value={availableRooms.length}
          icon={DoorOpen}
          color="emerald"
          subtitle="Ready for claim"
        />
        <DashboardCard
          title="My Teaching Slots Today"
          value={myTodayClasses.length}
          icon={CalendarDays}
          color="indigo"
          subtitle={`${todayName} Schedule`}
        />
        <DashboardCard
          title="Pending Bookings"
          value={myBookings.filter(b => b.status === 'pending').length}
          icon={Clock}
          color="amber"
          subtitle="Awaiting HOD/Coordinator"
        />
        <DashboardCard
          title="Approved Bookings"
          value={myBookings.filter(b => b.status === 'approved').length}
          icon={CheckCircle}
          color="campus"
          subtitle="Confirmed reservations"
        />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Teaching Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-campus-600" />
              <h3 className="font-bold text-sm text-slate-800">My Teaching Schedule ({todayName})</h3>
            </div>
            <Link to="/timetable" className="text-xs font-semibold text-campus-600 hover:text-campus-700">
              Weekly Timetable
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {myTodayClasses.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No official classes assigned to you today.</p>
            ) : (
              myTodayClasses.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-campus-700 uppercase tracking-wider bg-campus-50 border border-campus-200 px-1.5 py-0.5 rounded">
                      {item.course_code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-1">{item.course_name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Room {item.room_number} • {item.semester} ({item.section})</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {item.start_time?.slice(0, 5) ?? '--:--'} - {item.end_time?.slice(0, 5) ?? '--:--'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Booking Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-campus-600" />
              <h3 className="font-bold text-sm text-slate-800">My Resource Booking Requests</h3>
            </div>
            <Link to="/bookings" className="text-xs font-semibold text-campus-600 hover:text-campus-700">
              View All ({myBookings.length})
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {myBookings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-slate-400">No booking requests submitted yet.</p>
                <button
                  onClick={() => setBookingModalOpen(true)}
                  className="mt-2 text-xs font-bold text-campus-600 hover:text-campus-700"
                >
                  + Submit a Facility Request
                </button>
              </div>
            ) : (
              myBookings.slice(0, 4).map((b) => (
                <div key={b.id} className="p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{b.purpose}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {b.booking_type === 'classroom' ? `Classroom ${b.room_number}` : b.facility_name} • {b.booking_date} ({b.start_time?.slice(0, 5) ?? '--'} - {b.end_time?.slice(0, 5) ?? '--'})
                    </p>
                    {b.status === 'rejected' && b.rejection_reason && (
                      <p className="text-[10px] text-rose-600 mt-1 font-medium">Reason: {b.rejection_reason}</p>
                    )}
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Claim Classroom Modal */}
      {selectedRoomToClaim && (
        <ClaimModal
          isOpen={claimModalOpen}
          onClose={() => { setClaimModalOpen(false); setSelectedRoomToClaim(null); }}
          classroom={selectedRoomToClaim}
          onConfirm={handleClaimSubmit}
          loading={submitting}
        />
      )}

      {/* Submit Booking Request Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSubmit={handleBookingSubmit}
        loading={submitting}
        facilities={facilities}
        classrooms={classrooms}
      />

      {/* Confirmation for early release */}
      <ConfirmationDialog
        isOpen={releaseDialog.open}
        onClose={() => setReleaseDialog({ open: false, claimId: null, roomNumber: '' })}
        onConfirm={handleReleaseConfirm}
        title="Confirm Early Room Release"
        message={`Are you sure you want to release classroom ${releaseDialog.roomNumber}? It will immediately become available for other faculty members.`}
        confirmText="Release Room"
        type="warning"
        loading={submitting}
      />
    </div>
  );
}
