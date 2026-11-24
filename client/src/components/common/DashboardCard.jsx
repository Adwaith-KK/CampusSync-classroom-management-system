import React from 'react';

export default function DashboardCard({ title, value, icon: Icon, color = 'campus', subtitle, badge }) {
  const colorSchemes = {
    campus: 'bg-campus-50 text-campus-600 border-campus-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const scheme = colorSchemes[color] || colorSchemes.campus;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="mt-1 text-2xl font-bold text-slate-800">{value}</h4>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${scheme}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {(subtitle || badge) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
          <span>{subtitle}</span>
          {badge}
        </div>
      )}
    </div>
  );
}
