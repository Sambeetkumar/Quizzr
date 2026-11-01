import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Spinner from '../components/Spinner';
import QuizCard from '../components/QuizCard';
import { isAdaptiveSubject, sortQuizzesByDifficulty, computeQuizLockStatus, formatQuiz } from '../lib/adaptiveQuiz';

export default function SubjectView() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [subject, setSubject] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    async function fetchData() {
      setLoading(true);
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();
        
      if (subjectData) setSubject(subjectData);

      const { data: quizzesData } = await supabase
        .from('quizzes')
        .select('*, questions(id)')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });
        
      if (quizzesData && subjectData) {
        const formatted = quizzesData.map(q => formatQuiz(q));
        const isAdaptive = isAdaptiveSubject(subjectData.title);

        const ordered = isAdaptive ? sortQuizzesByDifficulty(formatted) : formatted;

        let userScores = [];
        if (user?.id && ordered.length > 0) {
          const quizIds = ordered.map(q => q.id);
          const { data: scores } = await supabase
            .from('user_scores')
            .select('id, quiz_id, score, completed_at')
            .eq('user_id', user.id)
            .in('quiz_id', quizIds);

          if (scores) {
            userScores = scores;
          }
        }

        const enriched = ordered.map(quiz => {
          const lockInfo = computeQuizLockStatus({
            quiz,
            subjectTitle: subjectData.title,
            allSubjectQuizzes: ordered,
            userScores,
          });

          return {
            ...quiz,
            isLocked: lockInfo.isLocked,
            lockReason: lockInfo.lockReason,
            prereqQuiz: lockInfo.prereqQuiz ? formatQuiz(lockInfo.prereqQuiz) : null,
          };
        });

        setQuizzes(enriched);
      } else if (quizzesData) {
        setQuizzes(quizzesData.map(q => formatQuiz(q)));
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [subjectId, user?.id, isLoaded]);

  if (loading) return <div className="max-w-7xl mx-auto p-4 sm:p-8 w-full"><Spinner /></div>;
  if (!subject) return <div className="max-w-7xl mx-auto p-4 sm:p-8 w-full">Subject not found.</div>;

  const isAdaptive = isAdaptiveSubject(subject.title);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 w-full">
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <div className="flex items-start sm:items-center gap-3 sm:gap-6">
          <button onClick={() => navigate('/dashboard')} className="flex shrink-0 items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white cursor-pointer transition-all border border-white/5 bg-white/5 hover:bg-white/10 hover:-translate-x-0.5 mt-0.5 sm:mt-0">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">{subject.title}</h1>
              {isAdaptive && (
                <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 flex items-center gap-1.5 shrink-0">
                  <Sparkles size={12} />
                  Adaptive Learning
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base md:text-lg text-textSecondary">{subject.description}</p>
          </div>
        </div>
      </header>

      <section className="mt-8 sm:mt-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Available Quizzes</h2>
        
        {quizzes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {quizzes.map(quiz => (
              <QuizCard 
                key={quiz.id} 
                quiz={quiz} 
                isLocked={quiz.isLocked}
                lockReason={quiz.lockReason}
                prereqQuiz={quiz.prereqQuiz}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center glass-panel">
            <h3 className="text-xl font-bold text-white mb-2">No quizzes available</h3>
            <p className="text-textSecondary">There are currently no quizzes for this subject.</p>
          </div>
        )}
      </section>
    </div>
  );
}
