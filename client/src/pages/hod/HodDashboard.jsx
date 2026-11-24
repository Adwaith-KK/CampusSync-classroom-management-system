import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import DashboardCard from '../../components/common/DashboardCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import RejectionModal from '../../components/booking/RejectionModal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { CheckCheck, XCircle, Clock, DoorOpen, Building2, BarChart2, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';

export default function HodDashboard() {
  const { user } = useAuth();
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [approveDialog, setApproveDialog] = useState({ open: false, booking: null });
  const [rejectionDialog, setRejectionDialog] = useState({ open: false, booking: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerNotice, setBannerNotice] = useState({ text: '', type: 'success' });

  const loadData = async () => {
    try {
      const [bRes, cRes, aRes] = await Promise.all([
        api.get('/bookings?status=pending'),
        api.get('/classrooms'),
        api.get('/analytics/overview')
      ]);
      if (bRes.data.success) {
        // Filter requests that require HOD approval or from HOD's department
        setPendingApprovals(bRes.data.data.filter(b => b.approver_role === 'hod' || b.user_id !== user?.id));
      }
      if (cRes.data.success) setClassrooms(cRes.data.data);
      if (aRes.data.success) setAnalytics(aRes.data.data);
    } catch (err) {
      console.error('Error loading HOD dashboard:', err);
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

  if (loading) return <LoadingSpinner message="Loading HOD oversight portal..." />;

  const availableRoomsCount = classrooms.filter(c => c.status === 'available').length;
  const activeClaimsCount = classrooms.filter(c => c.status === 'temporarily_claimed').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-800 text-white p-6 shadow-md shadow-purple-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Department Head Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{user?.name}</h1>
            <p className="text-xs text-purple-200 mt-1 max-w-xl">
              Department of {user?.department} — Authorize planned academic classroom events, review departmental seminar halls, and monitor live utilization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/bookings"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-purple-900 font-bold text-xs rounded-xl shadow hover:bg-purple-50 transition-colors"
            >
              Approval Queue ({pendingApprovals.length})
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
          title="Pending Approvals"
          value={pendingApprovals.length}
          icon={Clock}
          color="amber"
          subtitle="Awaiting your review"
        />
        <DashboardCard
          title="Available Classrooms"
          value={`${availableRoomsCount} / ${classrooms.length}`}
          icon={DoorOpen}
          color="emerald"
          subtitle="Currently free"
        />
        <DashboardCard
          title="Active Temporary Claims"
          value={activeClaimsCount}
          icon={UserCheck}
          color="indigo"
          subtitle="Faculty unscheduled sessions"
        />
        <DashboardCard
          title="Classroom Utilization"
          value={`${analytics?.classrooms?.utilizationRate || 0}%`}
          icon={BarChart2}
          color="purple"
          subtitle="Department campus rate"
        />
      </div>

      {/* Pending Approvals Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-800">Requests Requiring HOD Approval</h3>
          </div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            {pendingApprovals.length} Action Needed
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {pendingApprovals.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No pending booking requests requiring HOD approval at this time. All caught up!
            </div>
          ) : (
            pendingApprovals.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-slate-200 hover:border-campus-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{req.purpose}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      {req.booking_type === 'classroom' ? `Classroom ${req.room_number}` : req.facility_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Requested by <span className="font-semibold text-slate-800">{req.requester_name}</span> ({req.requester_role}) • Dept: {req.requester_dept}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Date: <span className="font-semibold text-slate-700">{req.booking_date}</span> • Slot: {req.start_time.slice(0, 5)} - {req.end_time.slice(0, 5)} • Attendees: {req.participants}
                  </p>
                  {req.description && (
                    <p className="text-[11px] text-slate-400 italic">Notes: {req.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setRejectionDialog({ open: true, booking: req })}
                    disabled={actionLoading}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => setApproveDialog({ open: true, booking: req })}
                    disabled={actionLoading}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
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

      {/* Confirmation & Rejection Modals */}
      <ConfirmationDialog
        isOpen={approveDialog.open}
        onClose={() => setApproveDialog({ open: false, booking: null })}
        onConfirm={handleApprove}
        title="Approve Resource Request"
        message={`Confirm approval of "${approveDialog.booking?.purpose}" for ${approveDialog.booking?.requester_name} on ${approveDialog.booking?.booking_date}? The resource will be formally locked and the requester notified.`}
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
