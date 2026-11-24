import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import BookingModal from '../../components/booking/BookingModal';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Building2, Users, MapPin, Calendar, Plus, RefreshCw, AlertCircle, Info } from 'lucide-react';

export default function FacilitiesPage() {
  const { user } = useAuth();
  const role = user?.role;
  const isStudent = role === 'student';
  const isCoordinator = role === 'coordinator';

  const [facilities, setFacilities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [targetFacility, setTargetFacility] = useState(null);

  // Create Facility Modal (Coordinator)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFacility, setNewFacility] = useState({
    name: '',
    type: 'Auditorium',
    location: '',
    capacity: 100,
    status: 'available',
    description: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState({ text: '', type: 'success' });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fRes, cRes] = await Promise.all([
        api.get('/facilities'),
        api.get('/classrooms')
      ]);
      if (fRes.data.success) setFacilities(fRes.data.data);
      if (cRes.data.success) setClassrooms(cRes.data.data);
    } catch (err) {
      console.error('Error fetching facilities:', err);
      setAlert({ text: 'Failed to load campus facilities.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenBooking = (facility) => {
    setTargetFacility(facility);
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    setActionLoading(true);
    try {
      const res = await api.post('/bookings', bookingData);
      if (res.data.success) {
        setAlert({ text: res.data.message, type: 'success' });
        setBookingModalOpen(false);
        setTargetFacility(null);
        await loadData();
      }
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Failed to submit booking request.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFacility = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/facilities', newFacility);
      if (res.data.success) {
        setAlert({ text: res.data.message, type: 'success' });
        setCreateModalOpen(false);
        setNewFacility({
          name: '',
          type: 'Auditorium',
          location: '',
          capacity: 100,
          status: 'available',
          description: ''
        });
        await loadData();
      }
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Failed to create facility.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(f => {
    if (selectedType && f.type !== selectedType) return false;
    if (selectedStatus && f.status !== selectedStatus) return false;
    return true;
  });

  const types = ['Auditorium', 'Basketball Court', 'Football Ground', 'Badminton Court', 'Seminar Hall', 'Conference Room', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campus Facilities & Arenas</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse campus auditoriums, seminar halls, sports complexes, and conference suites.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh facilities"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {!isStudent && (
            <button
              onClick={() => { setTargetFacility(null); setBookingModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Request Booking
            </button>
          )}
          {isCoordinator && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Facility
            </button>
          )}
        </div>
      </div>

      {alert.text && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          alert.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{alert.text}</span>
          <button onClick={() => setAlert({ text: '', type: 'success' })} className="font-bold underline ml-2">Dismiss</button>
        </div>
      )}

      {isStudent && (
        <div className="rounded-xl bg-sky-50 border border-sky-200 p-3.5 text-xs text-sky-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <span>Students have view-only access to facility availability. Official booking requests must be submitted through Faculty or Coordinators.</span>
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value="">All Facility Types</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {(selectedType || selectedStatus) && (
          <button
            onClick={() => { setSelectedType(''); setSelectedStatus(''); }}
            className="text-xs text-campus-600 hover:text-campus-700 font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Facilities Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Loading campus facilities catalog..." />
      ) : filteredFacilities.length === 0 ? (
        <EmptyState
          title="No facilities found"
          description="There are no campus facilities matching the selected criteria."
          icon={Building2}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="p-5 pb-3 border-b border-slate-100 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-campus-50 text-campus-600">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">{f.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{f.type}</p>
                    </div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[3rem]">
                    {f.description || 'Modern multi-purpose campus venue equipped for university events, sports meets, and conferences.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{f.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Capacity: {f.capacity}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  {f.upcoming_bookings_count > 0 ? `${f.upcoming_bookings_count} upcoming bookings` : 'No upcoming bookings'}
                </span>
                {!isStudent && f.status === 'available' && (
                  <button
                    onClick={() => handleOpenBooking(f)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-campus-600 hover:bg-campus-700 text-white shadow-sm transition-colors"
                  >
                    Request Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => { setBookingModalOpen(false); setTargetFacility(null); }}
        onSubmit={handleBookingSubmit}
        loading={actionLoading}
        facilities={facilities}
        classrooms={classrooms}
        initialResource={targetFacility ? { type: 'facility', id: targetFacility.id } : null}
      />

      {/* Add Facility Modal (Coordinator) */}
      {isCoordinator && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Add New Campus Facility"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateFacility} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name</label>
              <input
                type="text"
                required
                value={newFacility.name}
                onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                placeholder="e.g. Olympic Swimming Complex"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={newFacility.type}
                  onChange={(e) => setNewFacility({ ...newFacility, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Capacity</label>
                <input
                  type="number"
                  required
                  min="5"
                  value={newFacility.capacity}
                  onChange={(e) => setNewFacility({ ...newFacility, capacity: parseInt(e.target.value, 10) || 50 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Zone</label>
              <input
                type="text"
                required
                value={newFacility.location}
                onChange={(e) => setNewFacility({ ...newFacility, location: e.target.value })}
                placeholder="e.g. West Campus Sports Complex"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Amenities</label>
              <textarea
                rows="2"
                value={newFacility.description}
                onChange={(e) => setNewFacility({ ...newFacility, description: e.target.value })}
                placeholder="Details on court flooring, lighting, sound system..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-semibold text-white bg-campus-600 hover:bg-campus-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {actionLoading ? 'Creating...' : 'Register Facility'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
