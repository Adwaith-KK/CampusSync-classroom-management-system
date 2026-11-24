import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ScrollText, User, Calendar } from 'lucide-react';

const ACTION_COLORS = {
  CLASSROOM_CLAIMED:     'bg-amber-100 text-amber-700 border-amber-200',
  CLASSROOM_RELEASED:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  BOOKING_REQUESTED:     'bg-indigo-100 text-indigo-700 border-indigo-200',
  BOOKING_APPROVED:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  BOOKING_REJECTED:      'bg-rose-100 text-rose-700 border-rose-200',
  BOOKING_CANCELLED:     'bg-slate-100 text-slate-600 border-slate-200',
  TIMETABLE_ENTRY_CREATED: 'bg-campus-100 text-campus-700 border-campus-200',
  TIMETABLE_ENTRY_DELETED: 'bg-rose-100 text-rose-700 border-rose-200',
  USER_LOGIN:            'bg-sky-100 text-sky-700 border-sky-200',
  SYSTEM_INIT:           'bg-slate-100 text-slate-600 border-slate-200',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  const loadLogs = async (pageNum = 1, append = false) => {
    try {
      const res = await api.get(`/audit-logs?page=${pageNum}&limit=${pageSize}`);
      if (res.data.success) {
        const newLogs = res.data.data;
        setLogs(prev => append ? [...prev, ...newLogs] : newLogs);
        setHasMore(newLogs.length === pageSize);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLogs(1, false); }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadLogs(nextPage, true);
  };

  if (loading) return <LoadingSpinner message="Loading audit logs..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-campus-600" />
          Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          System activity trail — {logs.length} records shown (read-only)
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No Audit Records"
          description="System activity will be logged here automatically."
        />
      ) : (
        <>
          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
                <div className="flex items-start gap-3">
                  {/* Action badge */}
                  <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border mt-0.5 ${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed">{log.description}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                      {log.user_name && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <User className="w-2.5 h-2.5" />
                          {log.user_name} ({log.user_role})
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </span>
                      {log.entity_type && (
                        <span className="text-[10px] text-slate-300">
                          {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                className="px-6 py-2 text-xs font-semibold text-campus-600 border border-campus-300 rounded-xl hover:bg-campus-50 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
