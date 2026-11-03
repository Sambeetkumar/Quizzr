import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Trophy, PlayCircle } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function CustomQuizLeaderboard() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [entries, setEntries] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      // 1. Fetch Quiz Info
      const { data: quizData } = await supabase
        .from('custom_quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();

      if (quizData) setQuiz(quizData);

      // 2. Fetch Question Count
      const { count } = await supabase
        .from('custom_questions')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', quizId);

      setQuestionCount(count || 0);

      // 3. Fetch all attempts ordered by completed_at ascending
      const { data: scores } = await supabase
        .from('custom_quiz_scores')
        .select('id, user_id, user_name, score, completed_at')
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: true });

      if (scores) {
        // First attempt deduplication per user
        const firstAttemptMap = new Map();
        for (const entry of scores) {
          if (!firstAttemptMap.has(entry.user_id)) {
            firstAttemptMap.set(entry.user_id, entry);
          }
        }

        // Sort descending by score, then earliest on ties
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 w-full min-h-[70vh] flex items-center justify-center">
        <Spinner message="Loading leaderboard..." />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-7xl mx-auto p-8 w-full text-center min-h-[70vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Not Found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-4">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 w-full animate-fadeIn">
      {/* Header */}
      <header className="flex items-start sm:items-center gap-3 sm:gap-6 mb-6 sm:mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-textPrimary cursor-pointer transition-all border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-x-0.5 shrink-0 mt-0.5 sm:mt-0 shadow-xs"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5 sm:gap-3 text-textPrimary truncate">
            <Trophy className="text-amber-500 dark:text-yellow-400 shrink-0" size={26} />
            Leaderboard
          </h1>
          <p className="text-base sm:text-lg text-textSecondary mt-0.5 truncate">{quiz.title}</p>
        </div>

        <button
          onClick={() => navigate(`/custom-quiz/${quiz.id}`)}
          className="btn btn-primary py-2 px-3 sm:px-4 text-xs sm:text-sm shrink-0 hidden sm:flex items-center gap-2"
        >
          <PlayCircle size={16} />
          Take Quiz
        </button>
      </header>

      {/* Leaderboard Table */}
      {entries.length === 0 ? (
        <div className="glass-panel p-8 sm:p-16 text-center flex flex-col items-center gap-4 border border-black/10 dark:border-white/10">
          <Trophy size={48} className="text-black/20 dark:text-white/20" />
          <h3 className="text-xl font-bold text-textPrimary">No attempts yet</h3>
          <p className="text-textSecondary text-sm max-w-sm">
            No candidates have completed this quiz yet. Share your link to start receiving scores!
          </p>
          <button onClick={() => navigate(`/custom-quiz/${quizId}`)} className="btn btn-primary mt-2">
            Attempt this Quiz
          </button>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 p-4 sm:p-5 bg-black/[0.03] dark:bg-white/5 border-b border-black/10 dark:border-white/5 font-semibold text-textSecondary text-xs uppercase tracking-wider">
                <div>Rank</div>
                <div>Candidate</div>
                <div>Score</div>
                <div>Date</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-black/10 dark:divide-white/5">
                {entries.map((entry, index) => {
                  const percentage = questionCount > 0
                    ? Math.round((entry.score / questionCount) * 100)
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
                    rowHighlight = 'bg-amber-500/10 dark:bg-yellow-500/5';
                  } else if (index === 1) {
                    rankDisplay = <span className="text-2xl">🥈</span>;
                    rowHighlight = 'bg-black/[0.02] dark:bg-gray-300/5';
                  } else if (index === 2) {
                    rankDisplay = <span className="text-2xl">🥉</span>;
                    rowHighlight = 'bg-amber-700/10 dark:bg-amber-700/5';
                  } else {
                    rankDisplay = <span className="text-base font-bold text-textSecondary">#{index + 1}</span>;
                  }

                  return (
                    <div
                      key={entry.id}
                      className={`grid grid-cols-4 gap-4 p-4 sm:p-5 items-center transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5 ${rowHighlight}`}
                    >
                      <div>{rankDisplay}</div>
                      <div className="font-semibold text-textPrimary truncate text-sm sm:text-base pr-2">
                        {entry.user_name || 'Anonymous Candidate'}
                      </div>
                      <div className="font-bold text-accentPrimary text-sm sm:text-base">
                        {percentage}%
                        <span className="text-xs text-textSecondary font-normal ml-1 sm:ml-1.5">
                          ({entry.score}/{questionCount})
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

