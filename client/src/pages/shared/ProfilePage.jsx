import React, { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Phone, Building2, Shield, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim() };
      if (form.newPassword && form.currentPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }
      const res = await updateProfile(payload);
      if (res.success) {
        setMessage({ text: 'Profile updated successfully.', type: 'success' });
        setForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      } else {
        setMessage({ text: res.message || 'Update failed.', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const roleLabels = {
    student: 'Student',
    faculty: 'Faculty Member',
    hod: 'Head of Department (HOD)',
    coordinator: 'Program Coordinator',
  };

  const roleBadgeColors = {
    student:     'bg-sky-100 text-sky-700 border-sky-200',
    faculty:     'bg-indigo-100 text-indigo-700 border-indigo-200',
    hod:         'bg-purple-100 text-purple-700 border-purple-200',
    coordinator: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-campus-800 to-campus-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold">{user?.name}</h1>
            <p className="text-campus-100 text-xs mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColors[user?.role]}`}>
                <Shield className="w-3 h-3" />
                {roleLabels[user?.role] || user?.role}
              </span>
              <span className="text-campus-200 text-[10px]">{user?.department}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Read-only Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Mail, label: 'Email Address', value: user?.email },
            { icon: Building2, label: 'Department', value: user?.department },
            { icon: Shield, label: 'Role', value: roleLabels[user?.role] || user?.role },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50">
              <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">{label}</p>
                <p className="text-xs text-slate-800 font-medium mt-0.5">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 pt-1">Email and department can only be changed by an administrator.</p>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Edit Profile</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-600">Change Password <span className="font-normal text-slate-400">(optional)</span></h3>
          {[
            { name: 'currentPassword', label: 'Current Password' },
            { name: 'newPassword', label: 'New Password' },
            { name: 'confirmPassword', label: 'Confirm New Password' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input
                type="password"
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500"
                placeholder="••••••••"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-campus-600 hover:bg-campus-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
