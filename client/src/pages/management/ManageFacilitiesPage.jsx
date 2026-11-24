import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { Building2, Plus, Edit2, Trash2, X, Save } from 'lucide-react';

const FACILITY_TYPES = ['Auditorium', 'Basketball Court', 'Football Ground', 'Badminton Court', 'Seminar Hall', 'Conference Room', 'Other'];
const STATUS_OPTIONS = ['available', 'maintenance', 'inactive'];

const defaultForm = {
  name: '', type: 'Auditorium', location: '', capacity: 100,
  status: 'available', description: ''
};

export default function ManageFacilitiesPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState({ open: false, mode: 'add', data: { ...defaultForm } });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadFacilities = async () => {
    try {
      const res = await api.get('/facilities');
      if (res.data.success) setFacilities(res.data.data);
    } catch (err) {
      console.error('Error loading facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFacilities(); }, []);

  const openAdd = () => setFormModal({ open: true, mode: 'add', data: { ...defaultForm } });
  const openEdit = (f) => setFormModal({ open: true, mode: 'edit', data: { ...f } });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormModal(prev => ({
      ...prev,
      data: { ...prev.data, [name]: name === 'capacity' ? parseInt(value, 10) : value }
    }));
  };

  const handleFormSubmit = async () => {
    setSubmitting(true);
    try {
      const { data, mode } = formModal;
      const res = mode === 'add'
        ? await api.post('/facilities', data)
        : await api.put(`/facilities/${data.id}`, data);
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setFormModal({ open: false, mode: 'add', data: { ...defaultForm } });
        await loadFacilities();
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
      const res = await api.delete(`/facilities/${deleteDialog.id}`);
      if (res.data.success) {
        setMessage({ text: 'Facility removed.', type: 'success' });
        setDeleteDialog({ open: false, id: null, name: '' });
        await loadFacilities();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Delete failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading facilities..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-campus-600" />
            Manage Facilities
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{facilities.length} facilities registered</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Facility
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

      {facilities.length === 0 ? (
        <EmptyState icon={Building2} title="No Facilities" description="Add your first campus facility." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facilities.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-campus-700 uppercase tracking-wider bg-campus-50 border border-campus-200 px-2 py-0.5 rounded">
                      {f.type}
                    </span>
                    <StatusBadge status={f.status} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">{f.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">📍 {f.location} • {f.capacity} capacity</p>
                  {f.description && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{f.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => openEdit(f)}
                    className="p-1.5 text-slate-400 hover:text-campus-600 hover:bg-campus-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteDialog({ open: true, id: f.id, name: f.name })}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, mode: 'add', data: { ...defaultForm } })}
        title={formModal.mode === 'add' ? 'Add New Facility' : `Edit ${formModal.data.name}`}
      >
        <div className="space-y-3 p-1">
          {[
            { name: 'name', label: 'Facility Name', placeholder: 'e.g. A1 Auditorium' },
            { name: 'location', label: 'Location', placeholder: 'e.g. Main Administrative Complex' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type="text"
                name={name}
                value={formModal.data[name]}
                onChange={handleFormChange}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Facility Type</label>
              <select
                name="type"
                value={formModal.data.type}
                onChange={handleFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500"
              >
                {FACILITY_TYPES.map(t => <option key={t}>{t}</option>)}
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={formModal.data.capacity}
              onChange={handleFormChange}
              min={1}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              name="description"
              value={formModal.data.description}
              onChange={handleFormChange}
              rows={3}
              placeholder="Brief description of the facility..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500 resize-none"
            />
          </div>

          <button
            onClick={handleFormSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-campus-600 hover:bg-campus-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : formModal.mode === 'add' ? 'Add Facility' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmationDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Remove Facility"
        message={`Are you sure you want to remove "${deleteDialog.name}"? This cannot be undone.`}
        confirmText="Remove"
        type="danger"
        loading={submitting}
      />
    </div>
  );
}
