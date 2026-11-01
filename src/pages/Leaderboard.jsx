import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Trophy } from 'lucide-react';
import Spinner from '../components/Spinner';
import { formatQuiz, getDifficultyBadgeStyle } from '../lib/adaptiveQuiz';

export default function Leaderboard() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      // Fetch quiz info with subject and questions count
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*, subjects(id, title), questions(id)')
        .eq('id', quizId)
        .single();

      if (quizData) setQuiz(formatQuiz(quizData));

      // Fetch all attempts for this quiz, ranked by score descending
      // On tie, earlier attempt ranks higher
      const { data: scores } = await supabase
        .from('user_scores')
        .select('id, user_id, user_name, score, completed_at')
        .eq('quiz_id', quizId)
        .order('score', { ascending: false })
        .order('completed_at', { ascending: true });

      if (scores) {
        // Keep only the first attempt per user (earliest completed_at)
        const firstAttemptMap = new Map();
        for (const entry of scores) {
          if (!firstAttemptMap.has(entry.user_id)) {
            firstAttemptMap.set(entry.user_id, entry);
          }
        }
        // Re-sort by score descending, then by completed_at ascending for ties
        const unique = Array.from(firstAttemptMap.values()).sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return new Date(a.completed_at) - new Date(b.completed_at);
        });
        setEntries(unique);
      }
      setLoading(false);
    }

    fetchLeaderboard();
  }, [quizId]);

  if (loading) return <div className="max-w-7xl mx-auto p-8 w-full"><Spinner message="Loading leaderboard..." /></div>;
  if (!quiz) return <div className="max-w-7xl mx-auto p-8 w-full text-center">Quiz not found.</div>;

  const totalQuestions = quiz.questions?.length || 0;
  const subjectInfo = quiz.subjects ? (Array.isArray(quiz.subjects) ? quiz.subjects[0] : quiz.subjects) : null;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 w-full">
      {/* Header */}
      <header className="flex items-start sm:items-center gap-3 sm:gap-6 mb-6 sm:mb-8">
        <button
          onClick={() => navigate(`/subject/${quiz.subject_id}`)}
          className="flex shrink-0 items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white cursor-pointer transition-all border border-white/5 bg-white/5 hover:bg-white/10 hover:-translate-x-0.5 mt-0.5 sm:mt-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5 sm:gap-3">
            <Trophy className="text-yellow-400 shrink-0" size={26} />
            Leaderboard
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-base sm:text-lg text-textSecondary">{quiz.displayTitle || quiz.title}{subjectInfo ? ` — ${subjectInfo.title}` : ''}</p>
            {quiz.difficulty && (
              <span className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getDifficultyBadgeStyle(quiz.difficulty).className}`}>
                {getDifficultyBadgeStyle(quiz.difficulty).label}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Leaderboard Table */}
      {entries.length === 0 ? (
        <div className="glass-panel p-8 sm:p-16 text-center flex flex-col items-center gap-4">
          <Trophy size={48} className="text-white/20" />
          <h3 className="text-xl font-bold text-white">No attempts yet</h3>
          <p className="text-textSecondary text-sm sm:text-base">No one has attempted this quiz yet. Be the first!</p>
          <button onClick={() => navigate(`/quiz/${quizId}`)} className="btn btn-primary mt-4">
            Take this Quiz
          </button>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 p-4 sm:p-6 bg-white/5 border-b border-white/5 font-semibold text-textSecondary text-xs sm:text-sm">
                <div>Rank</div>
                <div>User</div>
                <div>Score</div>
                <div>Date</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-white/5">
                {entries.map((entry, index) => {
                  const percentage = totalQuestions > 0
                    ? Math.round((entry.score / totalQuestions) * 100)
                    : 0;
                  const date = new Date(entry.completed_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  let rankDisplay;
                  let rowHighlight = '';
                  if (index === 0) {
                    rankDisplay = <span className="text-2xl">🥇</span>;
                    rowHighlight = 'bg-yellow-500/5';
                  } else if (index === 1) {
                    rankDisplay = <span className="text-2xl">🥈</span>;
                    rowHighlight = 'bg-gray-300/5';
                  } else if (index === 2) {
                    rankDisplay = <span className="text-2xl">🥉</span>;
                    rowHighlight = 'bg-amber-700/5';
                  } else {
                    rankDisplay = <span className="text-lg font-bold text-textSecondary">#{index + 1}</span>;
                  }

                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-4 gap-4 p-4 sm:p-6 items-center transition-colors hover:bg-white/5 ${rowHighlight}`}
                    >
                      <div>{rankDisplay}</div>
                      <div className="font-medium truncate pr-2">{entry.user_name || 'Anonymous'}</div>
                      <div className="font-bold text-accentPrimary">
                        {percentage}%
                        <span className="text-xs sm:text-sm text-textSecondary font-normal ml-1 sm:ml-2">
                          ({entry.score}/{totalQuestions})
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-textSecondary">{date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

