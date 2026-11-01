import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '@clerk/clerk-react';
import { X, Flag, Send, Check } from 'lucide-react';

export default function QuestionReportModal({ quizId, question, questionIndex, onClose, onReportSuccess }) {
  const { user } = useUser();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    setLoading(true);

    const { error } = await supabase
      .from('custom_question_reports')
      .insert({
        quiz_id: quizId,
        question_id: question.id,
        reporter_user_id: user.id,
        reporter_name: user.fullName || user.firstName || 'Candidate',
        comment: comment.trim(),
      });

    setLoading(false);

    if (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit comment: ' + error.message);
    } else {
      setSubmitted(true);
      if (onReportSuccess) onReportSuccess(question.id);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel p-5 sm:p-8 border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Flag className="text-amber-400" size={18} />
            Report Question #{questionIndex + 1}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-textSecondary hover:text-white shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center animate-fadeIn space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Check size={24} />
            </div>
            <h4 className="text-lg font-bold text-white">Report Submitted</h4>
            <p className="text-sm text-textSecondary">
              Your feedback has been sent to the quiz owner. Thank you!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-sm">
              <span className="text-xs text-textSecondary uppercase tracking-wider block mb-1">Question</span>
              <p className="text-white font-medium">{question.question_text}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-1.5">
                What is the issue or feedback?
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe any ambiguity, incorrect answer key, typo, or feedback for the creator..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-textSecondary/50 focus:outline-none focus:border-accentPrimary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline py-2 px-4 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !comment.trim()}
                className="btn btn-primary py-2 px-5 text-sm flex items-center gap-2"
              >
                {loading ? 'Submitting...' : (
                  <>
                    <Send size={16} />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

