import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Flag, MessageSquare } from 'lucide-react';
import Spinner from './Spinner';

export default function OwnerReportsModal({ quiz, onClose }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      const { data } = await supabase
        .from('custom_question_reports')
        .select(`
          id,
          reporter_name,
          comment,
          created_at,
          question_id,
          custom_questions (
            id,
            question_text,
            options,
            correct_option_index
          )
        `)
        .eq('quiz_id', quiz.id)
        .order('created_at', { ascending: false });

      if (data) setReports(data);
      setLoading(false);
    }

    loadReports();
  }, [quiz.id]);

  // Group reports by question_id
  const groupedReports = {};
  reports.forEach(r => {
    const qId = r.question_id;
    if (!groupedReports[qId]) {
      const q = r.custom_questions ? (Array.isArray(r.custom_questions) ? r.custom_questions[0] : r.custom_questions) : null;
      groupedReports[qId] = {
        questionText: q?.question_text || 'Question removed or unavailable',
        items: []
      };
    }
    groupedReports[qId].items.push(r);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-panel p-5 sm:p-8 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Flag className="text-amber-400" size={22} />
              Candidate Reports & Feedback
            </h2>
            <p className="text-xs sm:text-sm text-textSecondary mt-0.5">{quiz.title}</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-textSecondary hover:text-white transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <Spinner message="Loading candidate feedback..." />
        ) : reports.length === 0 ? (
          <div className="p-16 text-center text-textSecondary flex flex-col items-center gap-3">
            <MessageSquare size={40} className="text-white/20" />
            <h4 className="text-lg font-bold text-white">No Reports Yet</h4>
            <p className="text-sm">Candidates haven't reported any issues or left comments for this quiz.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              Total <strong>{reports.length}</strong> comments across <strong>{Object.keys(groupedReports).length}</strong> question(s).
            </div>

            {Object.entries(groupedReports).map(([qId, group], groupIdx) => (
              <div key={qId} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accentPrimary block mb-1">
                    Question #{groupIdx + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{group.questionText}</h4>
                </div>

                <div className="space-y-3">
                  {group.items.map(item => {
                    const date = new Date(item.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });

                    return (
                      <div key={item.id} className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs">
                        <div className="flex items-center justify-between text-textSecondary mb-1.5">
                          <span className="font-semibold text-white">{item.reporter_name || 'Anonymous Candidate'}</span>
                          <span>{date}</span>
                        </div>
                        <p className="text-textPrimary bg-white/5 p-2.5 rounded-lg border border-white/5 text-sm leading-relaxed">
                          "{item.comment}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

