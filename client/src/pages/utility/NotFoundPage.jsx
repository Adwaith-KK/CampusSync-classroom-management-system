import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoHome = () => {
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
        <div className="w-20 h-20 rounded-full bg-campus-100 flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-10 h-10 text-campus-500" />
        </div>
        <h1 className="text-5xl font-bold text-slate-800 mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-700">Page Not Found</h2>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={handleGoHome}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold text-sm rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
