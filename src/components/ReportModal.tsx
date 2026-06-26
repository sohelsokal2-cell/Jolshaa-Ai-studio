import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { X, Send, Loader2, AlertTriangle } from 'lucide-react';

interface ReportModalProps {
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  onClose: () => void;
}

export default function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const { token } = useAuth();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const preselectedReasons = [
    'Spam or misleading',
    'Harassment or hate speech',
    'Inappropriate content / Nudity',
    'Violence or physical threat',
    'Intellectual property violation',
    'Other (provide detail below)'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = reason === 'Other (provide detail below)' ? customReason : reason;
    if (!finalReason.trim()) {
      setError('Please select or specify a reason for this report.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: finalReason.trim()
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Error submitting report.');
      }
    } catch (err) {
      console.error('Report error:', err);
      setError('Server error submitting report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <h3 className="font-sans font-black text-lg text-slate-800 dark:text-slate-100 uppercase tracking-tight">Report Content</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <span className="font-bold text-xl">✓</span>
            </div>
            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Thank You!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Your report was successfully submitted. An administrator will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Help us keep Jolshaa safe and friendly. Please select the primary reason you are reporting this <span className="font-bold text-rose-500 capitalize">{targetType}</span>.
            </p>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-2xl font-semibold border border-red-100/50 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Reasons list */}
            <div className="space-y-2">
              {preselectedReasons.map((r, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-xs cursor-pointer font-medium transition-all ${
                    reason === r
                      ? 'border-rose-500 bg-rose-50/40 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-rose-500 cursor-pointer h-3.5 w-3.5"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            {/* Custom description */}
            {reason === 'Other (provide detail below)' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe the issue in detail..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-700 dark:text-slate-200 font-medium placeholder-slate-400"
                rows={3}
              />
            )}

            {/* Footer buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason}
                className="flex-1 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-xs shadow-md shadow-rose-200 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
