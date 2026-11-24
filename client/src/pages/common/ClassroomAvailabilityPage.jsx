import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ClassroomCard from '../../components/classroom/ClassroomCard';
import ClaimModal from '../../components/classroom/ClaimModal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { DoorOpen, Search, Filter, Plus, RefreshCw, AlertCircle } from 'lucide-react';

export default function ClassroomAvailabilityPage() {
  const { user } = useAuth();
  const role = user?.role;
  const isCoordinator = role === 'coordinator';

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Claim modal state
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Release confirmation state
  const [releaseDialog, setReleaseDialog] = useState({ open: false, claimId: null, roomNumber: '' });

  // Add Classroom modal state (Coordinator only)
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    building: 'A block',
    floor: 1,
    capacity: 60,
    type: 'Lecture Room',
    features: 'Projector, Wi-Fi, Whiteboard'
  });

  const [alert, setAlert] = useState({ text: '', type: 'success' });

  const loadClassrooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/classrooms');
      if (res.data.success) {
        setClassrooms(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching classrooms:', err);
      setAlert({ text: 'Failed to load classroom availability data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClassrooms();
    const interval = setInterval(loadClassrooms, 15000); // 15-second live refresh
    return () => clearInterval(interval);
  }, []);

  const handleClaim = (classroom) => {
    setSelectedRoom(classroom);
    setClaimModalOpen(true);
  };

  const handleClaimSubmit = async ({ classroomId, durationMinutes, purpose }) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/classrooms/${classroomId}/claim`, { durationMinutes, purpose });
      if (res.data.success) {
        setAlert({ text: res.data.message, type: 'success' });
        setClaimModalOpen(false);
        setSelectedRoom(null);
        await loadClassrooms();
      }
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Failed to claim classroom.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = (claimId, roomNumber) => {
    setReleaseDialog({ open: true, claimId, roomNumber });
  };

  const handleReleaseConfirm = async () => {
    if (!releaseDialog.claimId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/classroom-claims/${releaseDialog.claimId}/release`);
      if (res.data.success) {
        setAlert({ text: res.data.message, type: 'success' });
        setReleaseDialog({ open: false, claimId: null, roomNumber: '' });
        await loadClassrooms();
      }
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Failed to release claim.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/classrooms', newRoom);
      if (res.data.success) {
        setAlert({ text: res.data.message, type: 'success' });
        setCreateModalOpen(false);
        setNewRoom({
          roomNumber: '',
          building: 'A block',
          floor: 1,
          capacity: 60,
          type: 'Lecture Room',
          features: 'Projector, Wi-Fi, Whiteboard'
        });
        await loadClassrooms();
      }
    } catch (err) {
      setAlert({ text: err.response?.data?.message || 'Failed to create classroom.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter classrooms in memory
  const filteredClassrooms = classrooms.filter((c) => {
    if (search && !c.roomNumber.toLowerCase().includes(search.toLowerCase()) && !c.building.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (selectedBuilding && c.building !== selectedBuilding) return false;
    if (selectedFloor !== '' && c.floor !== parseInt(selectedFloor, 10)) return false;
    if (selectedType && c.type !== selectedType) return false;
    if (selectedStatus && c.status !== selectedStatus) return false;
    return true;
  });

  const buildings = Array.from(new Set(classrooms.map(c => c.building)));
  const types = ['Lecture Room', 'Laboratory', 'Seminar Room', 'Smart Classroom'];
  const statuses = [
    { value: 'available', label: 'Available' },
    { value: 'temporarily_claimed', label: 'Claimed' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Classroom Availability Live</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status combining timetable classes, active temporary claims, and planned bookings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadClassrooms}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Refresh availability"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isCoordinator && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Classroom
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

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search room number..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
            />
          </div>

          {/* Building */}
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value="">All Buildings</option>
            {buildings.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Floor */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value="">All Floors</option>
            {[1, 2, 3, 4, 5].map(f => (
              <option key={f} value={f}>Floor {f}</option>
            ))}
          </select>

          {/* Room Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value="">All Room Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Availability Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {(search || selectedBuilding || selectedFloor !== '' || selectedType || selectedStatus) && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearch('');
                setSelectedBuilding('');
                setSelectedFloor('');
                setSelectedType('');
                setSelectedStatus('');
              }}
              className="text-xs text-campus-600 hover:text-campus-700 font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Classroom Cards Grid */}
      {loading ? (
        <LoadingSpinner message="Calculating dynamic room availability..." />
      ) : filteredClassrooms.length === 0 ? (
        <EmptyState
          title="No classrooms match your filter"
          description="Try clearing search filters or changing availability criteria to see campus rooms."
          icon={DoorOpen}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassrooms.map((c) => (
            <ClassroomCard
              key={c.id}
              classroom={c}
              onClaim={handleClaim}
              onRelease={handleRelease}
            />
          ))}
        </div>
      )}

      {/* Claim Modal */}
      {selectedRoom && (
        <ClaimModal
          isOpen={claimModalOpen}
          onClose={() => { setClaimModalOpen(false); setSelectedRoom(null); }}
          classroom={selectedRoom}
          onConfirm={handleClaimSubmit}
          loading={actionLoading}
        />
      )}

      {/* Release Confirmation */}
      <ConfirmationDialog
        isOpen={releaseDialog.open}
        onClose={() => setReleaseDialog({ open: false, claimId: null, roomNumber: '' })}
        onConfirm={handleReleaseConfirm}
        title="Release Temporary Claim"
        message={`Are you sure you want to release classroom ${releaseDialog.roomNumber}? It will immediately become available again.`}
        confirmText="Release Room"
        type="warning"
        loading={actionLoading}
      />

      {/* Add Classroom Modal (Coordinator Only) */}
      {isCoordinator && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Add New Classroom"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateRoom} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number / Identifier</label>
              <input
                type="text"
                required
                value={newRoom.roomNumber}
                onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                placeholder="e.g. A-101 or LAB-301"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Building</label>
                <input
                  type="text"
                  required
                  value={newRoom.building}
                  onChange={(e) => setNewRoom({ ...newRoom, building: e.target.value })}
                  placeholder="A block"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="10"
                  value={newRoom.floor}
                  onChange={(e) => setNewRoom({ ...newRoom, floor: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seating Capacity</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="500"
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value, 10) || 60 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Classroom Type</label>
                <select
                  value={newRoom.type}
                  onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  <option value="Lecture Room">Lecture Room</option>
                  <option value="Laboratory">Laboratory</option>
                  <option value="Seminar Room">Seminar Room</option>
                  <option value="Smart Classroom">Smart Classroom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Installed Features & AV</label>
              <input
                type="text"
                value={newRoom.features}
                onChange={(e) => setNewRoom({ ...newRoom, features: e.target.value })}
                placeholder="Projector, Wi-Fi, Audio System, Smart Board"
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
                {actionLoading ? 'Creating...' : 'Create Classroom'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
