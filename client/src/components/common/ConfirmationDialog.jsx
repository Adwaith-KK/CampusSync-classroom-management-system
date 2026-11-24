import React from 'react';
import Modal from './Modal';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning', // 'warning' | 'danger' | 'info' | 'success'
  loading = false
}) {
  const typeIcons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    danger: <AlertTriangle className="w-6 h-6 text-rose-500" />,
    info: <Info className="w-6 h-6 text-campus-500" />,
    success: <CheckCircle className="w-6 h-6 text-emerald-500" />
  };

  const confirmBtnStyles = {
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    info: 'bg-campus-600 hover:bg-campus-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-full bg-slate-100">
          {typeIcons[type] || typeIcons.warning}
        </div>
        <div className="flex-1">
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmBtnStyles[type] || confirmBtnStyles.warning}`}
        >
          {loading && <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
