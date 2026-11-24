import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const dashboardMap = {
      student: '/student/dashboard',
      faculty: '/faculty/dashboard',
      hod: '/hod/dashboard',
      coordinator: '/coordinator/dashboard',
    };
    navigate(dashboardMap[user.role] || '/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed">
          You do not have permission to view this page.
          {user && (
            <> Your current role is <span className="font-semibold text-slate-700 capitalize">{user.role}</span>.</>
          )}
        </p>
        <button
          onClick={handleGoBack}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold text-sm rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go to My Dashboard
        </button>
      </div>
    </div>
  );
}
