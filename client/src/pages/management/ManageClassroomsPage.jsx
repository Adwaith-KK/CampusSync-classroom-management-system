import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { DoorOpen, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const TYPES = ['Lecture Room', 'Laboratory', 'Seminar Room', 'Smart Classroom'];
const STATUS_OPTIONS = ['available', 'maintenance'];

const defaultForm = {
  room_number: '', building: '', floor: 1, capacity: 60,
  type: 'Lecture Room', status: 'available', features: 'Projector, Whiteboard, Wi-Fi'
};

export default function ManageClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', data: defaultForm });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadClassrooms = async () => {
    try {
      const res = await api.get('/classrooms');
      if (res.data.success) setClassrooms(res.data.data);
    } catch (err) {
      console.error('Error loading classrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClassrooms(); }, []);

  const openAdd = () => setFormModal({ open: true, mode: 'add', data: { ...defaultForm } });
  const openEdit = (room) => setFormModal({ open: true, mode: 'edit', data: { ...room } });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormModal(prev => ({ ...prev, data: { ...prev.data, [name]: name === 'floor' || name === 'capacity' ? parseInt(value, 10) : value } }));
  };

  const handleFormSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, mode } = formModal;
      let res;
      if (mode === 'add') {
        res = await api.post('/classrooms', data);
      } else {
        res = await api.put(`/classrooms/${data.id}`, data);
      }
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setFormModal({ open: false, mode: 'add', data: defaultForm });
        await loadClassrooms();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Operation failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setSubmitting(true);
    try {
      const res = await api.delete(`/classrooms/${deleteDialog.id}`);
      if (res.data.success) {
        setMessage({ text: 'Classroom removed successfully.', type: 'success' });
        setDeleteDialog({ open: false, id: null, name: '' });
        await loadClassrooms();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Delete failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading classrooms..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-campus-600" />
            Manage Classrooms
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{classrooms.length} classrooms total</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Classroom
        </button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })}><X className="w-3 h-3" /></button>
        </div>
      )}

      {classrooms.length === 0 ? (
        <EmptyState icon={DoorOpen} title="No Classrooms" description="Add your first classroom to get started." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Room', 'Building', 'Floor', 'Capacity', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classrooms.map(room => (
                <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-800">{room.room_number}</td>
                  <td className="px-4 py-3 text-slate-600">{room.building}</td>
                  <td className="px-4 py-3 text-slate-600">F{room.floor}</td>
                  <td className="px-4 py-3 text-slate-600">{room.capacity}</td>
                  <td className="px-4 py-3 text-slate-600">{room.type}</td>
                  <td className="px-4 py-3"><StatusBadge status={room.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(room)}
                        className="p-1.5 text-slate-400 hover:text-campus-600 hover:bg-campus-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, id: room.id, name: room.room_number })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, mode: 'add', data: defaultForm })}
        title={formModal.mode === 'add' ? 'Add New Classroom' : `Edit ${formModal.data.room_number}`}
      >
        <div className="space-y-3 p-1">
          {[
            { name: 'room_number', label: 'Room Number / Name', type: 'text', placeholder: 'e.g. A-101' },
            { name: 'building', label: 'Building', type: 'text', placeholder: 'e.g. A block' },
            { name: 'floor', label: 'Floor', type: 'number', placeholder: '1' },
            { name: 'capacity', label: 'Seating Capacity', type: 'number', placeholder: '60' },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type={type}
                name={name}
                value={formModal.data[name]}
                onChange={handleFormChange}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Room Type</label>
            <select
              name="type"
              value={formModal.data.type}
              onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500"
            >
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              name="status"
              value={formModal.data.status}
              onChange={handleFormChange}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Features / Amenities</label>
            <input
              type="text"
              name="features"
              value={formModal.data.features}
              onChange={handleFormChange}
              placeholder="e.g. Projector, AC, Wi-Fi"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500"
            />
          </div>

          <button
            onClick={handleFormSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-campus-600 hover:bg-campus-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 mt-2"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : formModal.mode === 'add' ? 'Add Classroom' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Remove Classroom"
        message={`Are you sure you want to remove classroom ${deleteDialog.name}? This cannot be undone.`}
        confirmText="Remove"
        type="danger"
        loading={submitting}
      />
    </div>
  );
}
