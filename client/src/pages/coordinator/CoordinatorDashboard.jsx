import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RejectionModal from '../../components/booking/RejectionModal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { 
  ShieldAlert, 
  DoorOpen, 
  Building2, 
  CalendarDays, 
  Clock, 
  CheckCheck, 
  XCircle, 
  Users, 
  Activity, 
  ArrowRight,
  Plus
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [approveDialog, setApproveDialog] = useState({ open: false, booking: null });
  const [rejectionDialog, setRejectionDialog] = useState({ open: false, booking: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerNotice, setBannerNotice] = useState({ text: '', type: 'success' });

  const loadData = async () => {
    try {
      const [cRes, fRes, bRes, aRes, audRes] = await Promise.all([
        api.get('/classrooms'),
        api.get('/facilities'),
        api.get('/bookings?status=pending'),
        api.get('/analytics/overview'),
        api.get('/audit-logs?limit=5')
      ]);
      if (cRes.data.success) setClassrooms(cRes.data.data);
      if (fRes.data.success) setFacilities(fRes.data.data);
      if (bRes.data.success) setPendingBookings(bRes.data.data);
      if (aRes.data.success) setAnalytics(aRes.data.data);
      if (audRes.data.success) setRecentAudits(audRes.data.data);
    } catch (err) {
      console.error('Error loading coordinator dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async () => {
    if (!approveDialog.booking) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/bookings/${approveDialog.booking.id}/approve`);
      if (res.data.success) {
        setBannerNotice({ text: res.data.message, type: 'success' });
        setApproveDialog({ open: false, booking: null });
        await loadData();
      }
    } catch (err) {
      setBannerNotice({ text: err.response?.data?.message || 'Approval failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (bookingId, reason) => {
    setActionLoading(true);
    try {
      const res = await api.put(`/bookings/${bookingId}/reject`, { reason });
      if (res.data.success) {
        setBannerNotice({ text: res.data.message, type: 'success' });
        setRejectionDialog({ open: false, booking: null });
        await loadData();
      }
    } catch (err) {
      setBannerNotice({ text: err.response?.data?.message || 'Rejection failed.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading Program Coordinator operations hub..." />;

  const availableClassrooms = classrooms.filter(c => c.status === 'available').length;
  const activeClaims = classrooms.filter(c => c.status === 'temporarily_claimed').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 to-campus-800 text-white p-6 shadow-md shadow-indigo-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
              <Activity className="w-3.5 h-3.5" />
              Program Coordinator Management Hub
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{user?.name}</h1>
            <p className="text-xs text-indigo-200 mt-1 max-w-xl">
              Campus Resource Coordination — Manage classrooms, official timetable assignments, campus facilities, review approvals, and monitor audit trails.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/classrooms"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors"
            >
              Classroom Directory
            </Link>
            <Link
              to="/timetable"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow hover:bg-indigo-50 transition-colors"
            >
              Manage Timetable
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {bannerNotice.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          bannerNotice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{bannerNotice.text}</span>
          <button onClick={() => setBannerNotice({ text: '', type: 'success' })} className="font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Pending Facility Approvals"
          value={pendingBookings.length}
          icon={Clock}
          color="amber"
          subtitle="Requests awaiting action"
        />
        <DashboardCard
          title="Available Classrooms"
          value={`${availableClassrooms} / ${classrooms.length}`}
          icon={DoorOpen}
          color="emerald"
          subtitle="Currently free"
        />
        <DashboardCard
          title="Active Temporary Claims"
          value={activeClaims}
          icon={ShieldAlert}
          color="indigo"
          subtitle="Real-time faculty claims"
        />
        <DashboardCard
          title="Total Campus Facilities"
          value={facilities.length}
          icon={Building2}
          color="campus"
          subtitle="Managed amenities"
        />
      </div>

      {/* Quick Admin Actions Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resource Management Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/classrooms"
            className="p-3 rounded-xl border border-slate-200 hover:border-campus-400 hover:bg-campus-50/40 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-lg bg-campus-50 text-campus-600 group-hover:scale-110 transition-transform">
              <DoorOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2">Manage Classrooms</span>
            <span className="text-[10px] text-slate-400">Add, edit, maintenance</span>
          </Link>

          <Link
            to="/timetable"
            className="p-3 rounded-xl border border-slate-200 hover:border-campus-400 hover:bg-campus-50/40 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2">Manage Timetables</span>
            <span className="text-[10px] text-slate-400">Conflict-free scheduling</span>
          </Link>

          <Link
            to="/facilities"
            className="p-3 rounded-xl border border-slate-200 hover:border-campus-400 hover:bg-campus-50/40 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2">Manage Facilities</span>
            <span className="text-[10px] text-slate-400">Capacity & status</span>
          </Link>

          <Link
            to="/users"
            className="p-3 rounded-xl border border-slate-200 hover:border-campus-400 hover:bg-campus-50/40 transition-all flex flex-col items-center text-center group"
          >
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800 mt-2">User Directory</span>
            <span className="text-[10px] text-slate-400">Activate / Deactivate</span>
          </Link>
        </div>
      </div>

      {/* Two Column Grid: Pending Requests & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Booking Approvals */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-800">Pending Booking Approvals</h3>
            </div>
            <Link to="/bookings" className="text-xs font-semibold text-campus-600 hover:text-campus-700">
              View All ({pendingBookings.length})
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {pendingBookings.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No pending facility booking requests at this moment.</p>
            ) : (
              pendingBookings.slice(0, 3).map((req) => (
                <div key={req.id} className="p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-800">{req.purpose}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {req.booking_type === 'classroom' ? `Classroom ${req.room_number}` : req.facility_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Requested by {req.requester_name} ({req.requester_role}) • {req.booking_date} ({req.start_time.slice(0, 5)} - {req.end_time.slice(0, 5)})
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setRejectionDialog({ open: true, booking: req })}
                      className="p-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                      title="Reject request"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setApproveDialog({ open: true, booking: req })}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Approve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Audit Log Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-campus-600" />
              <h3 className="font-bold text-sm text-slate-800">System Activity Audit Trail</h3>
            </div>
            <Link to="/audit-logs" className="text-xs font-semibold text-campus-600 hover:text-campus-700">
              Full Logs
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {recentAudits.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent audit activity records found.</p>
            ) : (
              recentAudits.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                    <span className="font-bold uppercase tracking-wider bg-slate-200/80 px-1.5 py-0.5 rounded text-slate-700">
                      {log.action}
                    </span>
                    <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <p className="text-slate-800 font-medium truncate">{log.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation & Rejection Modals */}
      <ConfirmationDialog
        isOpen={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, booking: null })}
        onConfirm={handleApprove}
        title="Approve Resource Booking"
        message={`Confirm approval of "${approveDialog.booking?.purpose}" for ${approveDialog.booking?.requester_name} on ${approveDialog.booking?.booking_date}? The facility will be reserved and requester notified.`}
        confirmText="Confirm Approval"
        type="success"
        loading={actionLoading}
      />

      <RejectionModal
        isOpen={rejectionDialog.open}
        onClose={() => setRejectionDialog({ open: false, booking: null })}
        onConfirm={handleReject}
        booking={rejectionDialog.booking}
        loading={actionLoading}
      />
    </div>
  );
}
