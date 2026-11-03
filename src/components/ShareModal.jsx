import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '@clerk/clerk-react';
import { X, Copy, Check, Clock, Trash2, Link as LinkIcon, Sparkles, Calendar, AlertCircle } from 'lucide-react';

// Format Date object to local YYYY-MM-DDTHH:mm string for datetime-local input
function toLocalISOString(date) {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ShareModal({ quiz, onClose }) {
  const { user } = useUser();
  const [duration, setDuration] = useState('24h');
  
  // Default custom date to 48 hours from now rounded to next hour
  const defaultCustomDate = () => {
    const d = new Date(Date.now() + 48 * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    return toLocalISOString(d);
  };

  const [customDateTime, setCustomDateTime] = useState(defaultCustomDate);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingShares, setExistingShares] = useState([]);
  const [fetchingShares, setFetchingShares] = useState(true);

  // Fetch active shares for this quiz
  const fetchShares = async () => {
    setFetchingShares(true);
    const { data } = await supabase
      .from('custom_quiz_shares')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('created_at', { ascending: false });

    if (data) {
      setExistingShares(data);
    }
    setFetchingShares(false);
  };

  useEffect(() => {
    fetchShares();
  }, [quiz.id]);

  const calculateExpiresAt = () => {
    const now = new Date();
    switch (duration) {
      case '1h':
        return new Date(now.getTime() + 1 * 60 * 60 * 1000);
      case '6h':
        return new Date(now.getTime() + 6 * 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '3d':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'custom': {
        const parsed = new Date(customDateTime);
        return !isNaN(parsed.getTime()) ? parsed : new Date(now.getTime() + 24 * 60 * 60 * 1000);
      }
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  };

  const isCustomInvalid = duration === 'custom' && (!customDateTime || new Date(customDateTime) <= new Date());

  const handleGenerateLink = async () => {
    if (!user) return;

    if (duration === 'custom') {
      if (!customDateTime || new Date(customDateTime) <= new Date()) {
        alert('Please select a valid expiration date and time in the future.');
        return;
      }
    }

    setLoading(true);

    const token = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16) 
      : Math.random().toString(36).substring(2, 14) + Date.now().toString(36);

    const expiresAt = calculateExpiresAt();

    const { data, error } = await supabase
      .from('custom_quiz_shares')
      .insert({
        quiz_id: quiz.id,
        share_token: token,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating share link:', error);
      alert('Failed to generate link: ' + error.message);
    } else if (data) {
      const fullUrl = `${window.location.origin}/quiz/shared/${token}`;
      setGeneratedLink(fullUrl);
      fetchShares();
    }
    setLoading(false);
  };

  const handleCopy = (urlToCopy) => {
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = async (shareId) => {
    if (!confirm('Are you sure you want to revoke this link? Candidates will no longer be able to use it.')) return;
    await supabase.from('custom_quiz_shares').delete().eq('id', shareId);
    fetchShares();
  };

  // Preview formatted text for custom expiration
  const customPreviewFormatted = () => {
    if (!customDateTime) return '';
    const d = new Date(customDateTime);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto glass-panel p-5 sm:p-8 border border-black/10 dark:border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-black/10 dark:border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-textPrimary flex items-center gap-2">
              <LinkIcon className="text-accentPrimary" size={20} />
              Share Quiz
            </h2>
            <p className="text-xs sm:text-sm text-textSecondary mt-0.5">{quiz.title}</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Validity Selector */}
        <div className="mb-6 space-y-3">
          <label className="block text-sm font-semibold text-textPrimary">
            Link Validity / Expiration
          </label>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { id: '1h', label: '1 Hour' },
              { id: '6h', label: '6 Hours' },
              { id: '24h', label: '24 Hours' },
              { id: '3d', label: '3 Days' },
              { id: '7d', label: '7 Days' },
              { id: 'custom', label: 'Custom' },
            ].map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setDuration(preset.id);
                  if (preset.id === 'custom' && !customDateTime) {
                    setCustomDateTime(defaultCustomDate());
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
                  duration === preset.id 
                    ? 'border-accentPrimary bg-accentPrimary/15 text-accentPrimary font-bold shadow-xs' 
                    : 'border-black/10 dark:border-white/5 bg-black/5 dark:bg-white/5 text-textSecondary hover:text-textPrimary hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date & Time Picker Container */}
          {duration === 'custom' && (
            <div className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-3 animate-fadeIn mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-textPrimary flex items-center gap-1.5">
                  <Calendar size={14} className="text-accentPrimary" />
                  Select Date & Time (Your Local Time)
                </span>
                <span className="text-[11px] text-textSecondary">
                  Must be in the future
                </span>
              </div>

              <div className="relative">
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  min={toLocalISOString(new Date())}
                  onClick={(e) => {
                    try {
                      if (e.target.showPicker) e.target.showPicker();
                    } catch (_) {}
                  }}
                  className="w-full bg-white dark:bg-black/40 border border-black/15 dark:border-white/15 rounded-xl px-4 py-3 text-sm text-textPrimary font-medium focus:outline-none focus:border-accentPrimary cursor-pointer transition-colors shadow-xs"
                />
              </div>

              {/* Validation / Helper Info */}
              {isCustomInvalid ? (
                <p className="text-xs text-error font-medium flex items-center gap-1.5 pt-0.5">
                  <AlertCircle size={14} />
                  Please select a date and time that is in the future.
                </p>
              ) : customDateTime ? (
                <p className="text-xs text-textSecondary pt-0.5">
                  Link will expire on: <strong className="text-textPrimary">{customPreviewFormatted()}</strong>
                </p>
              ) : null}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerateLink}
          disabled={loading || isCustomInvalid}
          className={`btn btn-primary w-full py-3 mb-6 flex items-center justify-center gap-2 ${
            isCustomInvalid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            'Generating Link...'
          ) : (
            <>
              <Sparkles size={18} />
              Generate Temporary Link
            </>
          )}
        </button>

        {/* Newly Generated Link Output */}
        {generatedLink && (
          <div className="p-4 mb-6 rounded-xl bg-accentPrimary/10 border border-accentPrimary/30 animate-fadeIn">
            <span className="block text-xs font-semibold text-accentPrimary uppercase tracking-wider mb-1.5">
              Link Ready to Share
            </span>
            <div className="flex items-center gap-2 bg-white dark:bg-black/40 p-2 rounded-lg border border-black/10 dark:border-white/10">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 bg-transparent text-sm text-textPrimary focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={() => handleCopy(generatedLink)}
                className="btn btn-primary py-1.5 px-3 text-xs shrink-0"
              >
                {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-textSecondary mt-2">
              Candidates can attempt this quiz after logging in until the link expires.
            </p>
          </div>
        )}

        {/* Active Share Links List */}
        <div>
          <h3 className="text-sm font-semibold text-textPrimary mb-3 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
            Active Share Links ({existingShares.length})
          </h3>

          {fetchingShares ? (
            <p className="text-xs text-textSecondary">Loading links...</p>
          ) : existingShares.length === 0 ? (
            <p className="text-xs text-textSecondary italic">No active links created yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {existingShares.map(share => {
                const isExpired = new Date(share.expires_at) < new Date();
                const shareUrl = `${window.location.origin}/quiz/shared/${share.share_token}`;
                const expiresFormatted = new Date(share.expires_at).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                return (
                  <div 
                    key={share.id}
                    className="p-3 rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/5 flex items-center justify-between gap-3 text-xs shadow-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isExpired 
                            ? 'bg-red-500/15 text-red-700 dark:text-red-400' 
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                        <span className="text-textSecondary truncate">Expires: {expiresFormatted}</span>
                      </div>
                      <p className="text-textSecondary truncate font-mono text-[11px]">{shareUrl}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(shareUrl)}
                        className="p-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-textSecondary hover:text-textPrimary transition-colors"
                        title="Copy link"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(share.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
                        title="Revoke / Delete link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
