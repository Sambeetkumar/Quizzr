import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { History as HistoryIcon, Clock, ChevronRight } from 'lucide-react';
import Spinner from '../components/Spinner';
import { formatQuiz, getDifficultyBadgeStyle } from '../lib/adaptiveQuiz';

export default function History() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_scores')
        .select(`
          id,
          score,
          completed_at,
          quizzes (
            id,
            title,
            subjects (
              id,
              title
            ),
            questions (id)
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (data) {
        setAttempts(data);
      } else {
        console.error("Error fetching history:", error);
      }
      setLoading(false);
    }
    
    fetchHistory();
  }, [user]);

  if (loading) return <div className="max-w-7xl mx-auto p-8"><Spinner message="Loading history..." /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 w-full">
      <header className="flex items-center gap-3 mb-6 sm:mb-8">
        <HistoryIcon className="text-accentPrimary w-7 h-7 sm:w-8 sm:h-8" />
        <h1 className="text-2xl sm:text-3xl font-bold">Quiz History</h1>
      </header>

      {attempts.length === 0 ? (
        <div className="glass-panel p-8 sm:p-12 text-center text-textSecondary text-base sm:text-lg">
          You haven't attempted any quizzes yet.
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[550px]">
              <div className="grid grid-cols-4 gap-4 p-4 sm:p-6 bg-black/[0.03] dark:bg-white/5 border-b border-black/10 dark:border-white/5 font-semibold text-textSecondary text-xs sm:text-sm">
                <div>Subject</div>
                <div>Quiz</div>
                <div>Score</div>
                <div>Attempted On</div>
              </div>
              <div className="divide-y divide-black/10 dark:divide-white/5">
                {attempts.map((attempt) => {
                  // Supabase relations can be returned as objects or arrays. For one-to-many from the many side, they are usually objects.
                  // Handle potential array mapping gracefully just in case.
                  const quizInfo = Array.isArray(attempt.quizzes) ? attempt.quizzes[0] : attempt.quizzes;
                  const subjectInfo = quizInfo?.subjects ? (Array.isArray(quizInfo.subjects) ? quizInfo.subjects[0] : quizInfo.subjects) : null;
                  
                  const subjectTitle = subjectInfo?.title || "Unknown Subject";
                  const formattedQuiz = quizInfo ? formatQuiz(quizInfo) : null;
                  const quizTitle = formattedQuiz?.displayTitle || quizInfo?.title || "Unknown Quiz";
                  const difficulty = formattedQuiz?.difficulty;
                  const badgeStyle = difficulty ? getDifficultyBadgeStyle(difficulty) : null;
                  const date = new Date(attempt.completed_at).toLocaleDateString(undefined, { 
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  });

                  const totalQuestions = quizInfo?.questions?.length || 0;
                  const percentage = totalQuestions > 0 ? Math.round((attempt.score / totalQuestions) * 100) : 0;

                  return (
                    <div 
                      key={attempt.id} 
                      className="grid grid-cols-4 gap-4 p-4 sm:p-6 items-center hover:bg-black/[0.03] dark:hover:bg-white/5 cursor-pointer transition-colors group relative text-sm sm:text-base"
                      onClick={() => navigate(`/history/attempt/${attempt.id}`)}
                    >
                      <div className="font-medium flex items-center gap-2 text-textPrimary">{subjectTitle}</div>
                      <div className="flex items-center gap-2">
                        <span className="truncate pr-1 text-textPrimary font-medium">{quizTitle}</span>
                        {badgeStyle && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${badgeStyle.className}`}>
                            {badgeStyle.label}
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-accentPrimary">
                        {percentage}% <span className="text-xs sm:text-sm text-textSecondary font-normal ml-1 sm:ml-2">({attempt.score}/{totalQuestions})</span>
                      </div>
                      <div className="text-xs sm:text-sm text-textSecondary flex justify-between items-center pr-4">
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {date}</span>
                        <ChevronRight size={18} className="text-black/20 dark:text-white/20 group-hover:text-textPrimary transition-colors shrink-0 ml-2" />
                      </div>
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
