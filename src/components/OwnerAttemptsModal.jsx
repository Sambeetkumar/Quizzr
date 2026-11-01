import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Users, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import Spinner from './Spinner';

export default function OwnerAttemptsModal({ quiz, onClose }) {
  const [attempts, setAttempts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedScoreId, setExpandedScoreId] = useState(null);
  const [responsesMap, setResponsesMap] = useState({});

  useEffect(() => {
    async function loadData() {
      // 1. Fetch questions for this quiz
      const { data: qData } = await supabase
        .from('custom_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('created_at', { ascending: true });

      if (qData) setQuestions(qData);

      // 2. Fetch all scores
      const { data: sData } = await supabase
        .from('custom_quiz_scores')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('completed_at', { ascending: false });

      if (sData) setAttempts(sData);

      setLoading(false);
    }

    loadData();
  }, [quiz.id]);

  const toggleExpand = async (scoreId) => {
    if (expandedScoreId === scoreId) {
      setExpandedScoreId(null);
      return;
    }

    setExpandedScoreId(scoreId);

    // If we haven't loaded responses for this score, fetch them
    if (!responsesMap[scoreId]) {
      const { data: rData } = await supabase
        .from('custom_quiz_responses')
        .select('*')
        .eq('score_id', scoreId);

      const mapping = {};
      if (rData) {
        rData.forEach(r => {
          mapping[r.question_id] = r.selected_option_index;
        });
      }

      setResponsesMap(prev => ({
        ...prev,
        [scoreId]: mapping
      }));
    }
  };

  const totalQuestions = questions.length;
  const avgScore = attempts.length > 0 && totalQuestions > 0
    ? Math.round((attempts.reduce((sum, a) => sum + a.score, 0) / (attempts.length * totalQuestions)) * 100)
    : 0;
  const topScore = attempts.length > 0 && totalQuestions > 0
    ? Math.round((Math.max(...attempts.map(a => a.score)) / totalQuestions) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-panel p-5 sm:p-8 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="text-accentPrimary" size={22} />
              Candidate Attempts
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
          <Spinner message="Loading attempts data..." />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
              <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <span className="block text-xl sm:text-2xl font-bold text-white">{attempts.length}</span>
                <span className="text-[10px] sm:text-xs text-textSecondary uppercase tracking-wider">Attempts</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <span className="block text-xl sm:text-2xl font-bold text-indigo-400">{avgScore}%</span>
                <span className="text-[10px] sm:text-xs text-textSecondary uppercase tracking-wider">Average</span>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                <span className="block text-xl sm:text-2xl font-bold text-emerald-400">{topScore}%</span>
                <span className="text-[10px] sm:text-xs text-textSecondary uppercase tracking-wider">Highest</span>
              </div>
            </div>

            {/* Attempts Table */}
            {attempts.length === 0 ? (
              <div className="p-12 text-center text-textSecondary">
                No candidates have attempted this quiz yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                {attempts.map(attempt => {
                  const pct = totalQuestions > 0 ? Math.round((attempt.score / totalQuestions) * 100) : 0;
                  const date = new Date(attempt.completed_at).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  });
                  const isExpanded = expandedScoreId === attempt.id;
                  const userAnswers = responsesMap[attempt.id] || {};

                  return (
                    <div key={attempt.id} className="transition-colors hover:bg-white/2">
                      <div 
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer"
                        onClick={() => toggleExpand(attempt.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-base truncate">
                            {attempt.user_name || 'Anonymous Candidate'}
                          </h4>
                          <span className="text-xs text-textSecondary">{date}</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-lg font-bold text-accentPrimary">{pct}%</span>
                          <span className="text-xs text-textSecondary ml-2">({attempt.score}/{totalQuestions})</span>
                        </div>

                        <button 
                          type="button"
                          className="p-1 rounded-lg hover:bg-white/10 text-textSecondary hover:text-white"
                          title="View Answers Breakdown"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>

                      {/* Expanded Question by Question Breakdown */}
                      {isExpanded && (
                        <div className="p-4 bg-black/40 border-t border-white/5 space-y-4 animate-fadeIn">
                          <h5 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                            Candidate Responses Breakdown
                          </h5>
                          {questions.map((q, idx) => {
                            const selectedIdx = userAnswers[q.id];
                            const isCorrect = selectedIdx === q.correct_option_index;
                            const optionsList = Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]');

                            return (
                              <div key={q.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs">
                                <div className="flex items-start justify-between gap-2 mb-2 font-medium text-white">
                                  <span>{idx + 1}. {q.question_text}</span>
                                  {isCorrect ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400 shrink-0 font-semibold">
                                      <CheckCircle size={14} /> Correct
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-red-400 shrink-0 font-semibold">
                                      <XCircle size={14} /> Incorrect
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                  {optionsList.map((opt, optIdx) => {
                                    const wasSelected = selectedIdx === optIdx;
                                    const isTargetCorrect = q.correct_option_index === optIdx;

                                    let badgeClass = 'p-2 rounded-lg border text-left ';
                                    if (isTargetCorrect) {
                                      badgeClass += 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium';
                                    } else if (wasSelected && !isTargetCorrect) {
                                      badgeClass += 'border-red-500/40 bg-red-500/10 text-red-300';
                                    } else {
                                      badgeClass += 'border-white/5 bg-white/5 text-textSecondary';
                                    }

                                    return (
                                      <div key={optIdx} className={badgeClass}>
                                        <div className="flex items-center justify-between">
                                          <span>{opt}</span>
                                          {isTargetCorrect && <span className="text-[10px] text-emerald-400 font-bold ml-1">✓ Correct</span>}
                                          {wasSelected && !isTargetCorrect && <span className="text-[10px] text-red-400 font-bold ml-1">Candidate Pick</span>}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

