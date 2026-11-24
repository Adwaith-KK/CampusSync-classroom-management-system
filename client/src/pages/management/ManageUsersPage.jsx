import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmationDialog from '../../components/common/ConfirmationDialog';
import { Users, Shield, X, UserCheck, UserX } from 'lucide-react';

const ROLE_BADGES = {
  student:     'bg-sky-100 text-sky-700 border-sky-200',
  faculty:     'bg-indigo-100 text-indigo-700 border-indigo-200',
  hod:         'bg-purple-100 text-purple-700 border-purple-200',
  coordinator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const ROLE_LABELS = {
  student: 'Student', faculty: 'Faculty', hod: 'HOD', coordinator: 'Coordinator'
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [search, setSearch] = useState('');
  const [toggleDialog, setToggleDialog] = useState({ open: false, user: null });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleToggleStatus = async () => {
    if (!toggleDialog.user) return;
    setSubmitting(true);
    const { id, status } = toggleDialog.user;
    const newStatus = status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/users/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setMessage({ text: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`, type: 'success' });
        setToggleDialog({ open: false, user: null });
        await loadUsers();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Status update failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const roles = ['all', 'student', 'faculty', 'hod', 'coordinator'];

  const filtered = users.filter(u => {
    const roleMatch = filterRole === 'all' || u.role === filterRole;
    const searchMatch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return roleMatch && searchMatch;
  });

  if (loading) return <LoadingSpinner message="Loading users..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-campus-600" />
          Manage Users
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">{users.length} registered users</p>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl text-xs border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })}><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500"
        />
        <div className="flex gap-1.5 overflow-x-auto">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize flex-shrink-0 transition-colors ${
                filterRole === r ? 'bg-campus-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-campus-400'
              }`}
            >
              {r === 'all' ? `All (${users.length})` : `${ROLE_LABELS[r]} (${users.filter(u => u.role === r).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No Users Found" description="Try adjusting your search or role filter." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name', 'Email', 'Role', 'Department', 'Phone', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-campus-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-campus-700">{u.name.charAt(0)}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${ROLE_BADGES[u.role]}`}>
                      <Shield className="w-2.5 h-2.5" />
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.department}</td>
                  <td className="px-4 py-3 text-slate-500">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setToggleDialog({ open: true, user: u })}
                      className={`p-1.5 rounded-lg transition-colors ${
                        u.status === 'active'
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={u.status === 'active' ? 'Deactivate user' : 'Activate user'}
                    >
                      {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Toggle Status Dialog */}
      <ConfirmationDialog
        isOpen={toggleDialog.open}
        onClose={() => setToggleDialog({ open: false, user: null })}
        onConfirm={handleToggleStatus}
        title={toggleDialog.user?.status === 'active' ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${toggleDialog.user?.status === 'active' ? 'deactivate' : 'activate'} ${toggleDialog.user?.name}? ${toggleDialog.user?.status === 'active' ? 'They will lose access to CampusSync.' : 'They will regain access.'}`}
        confirmText={toggleDialog.user?.status === 'active' ? 'Deactivate' : 'Activate'}
        type={toggleDialog.user?.status === 'active' ? 'danger' : 'success'}
        loading={submitting}
      />
    </div>
  );
}
