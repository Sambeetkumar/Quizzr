import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Clock, Lock, Sparkles, ArrowRight } from 'lucide-react';
import Spinner from '../components/Spinner';
import { isAdaptiveSubject, computeQuizLockStatus, formatQuiz, getDifficultyBadgeStyle } from '../lib/adaptiveQuiz';

export default function QuizRunner() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  
  const [quiz, setQuiz] = useState(null);
  const [quizLockInfo, setQuizLockInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const finishQuiz = async (isTimeUp = false, currentAnswers = userAnswers) => {
    setIsQuizComplete(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    let finalScore = 0;
    questions.forEach((q, index) => {
      if (currentAnswers[index] === q.correct_option_index) {
        finalScore += 1;
      }
    });

    setScore(finalScore);

    if (user) {
      const { data: scoreData, error: scoreError } = await supabase
        .from('user_scores')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score: finalScore,
          user_name: user.fullName || user.firstName || 'Anonymous'
        })
        .select()
        .single();

      if (scoreData && !scoreError) {
        const responsesToInsert = questions.map((q, index) => ({
          score_id: scoreData.id,
          question_id: q.id,
          selected_option_index: currentAnswers[index] !== undefined ? currentAnswers[index] : null
        }));
        
        await supabase.from('user_responses').insert(responsesToInsert);
      }
    }
    
    return finalScore;
  };

  useEffect(() => {
    if (!isLoaded) return;

    async function fetchQuizData() {
      setLoading(true);
      setQuizLockInfo(null);

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();
        
      if (quizError || !quizData) {
        setLoading(false);
        return;
      }

      const formattedQuiz = formatQuiz(quizData);
      setQuiz(formattedQuiz);

      // Check adaptive lock status
      if (quizData.subject_id) {
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('*')
          .eq('id', quizData.subject_id)
          .single();

        if (subjectData && isAdaptiveSubject(subjectData.title)) {
          const { data: siblingQuizzes } = await supabase
            .from('quizzes')
            .select('*, questions(id)')
            .eq('subject_id', quizData.subject_id);

          const formattedSiblings = (siblingQuizzes || []).map(q => formatQuiz(q));

          let userScores = [];
          if (user?.id && formattedSiblings.length) {
            const { data: scores } = await supabase
              .from('user_scores')
              .select('id, quiz_id, score, completed_at')
              .eq('user_id', user.id)
              .in('quiz_id', formattedSiblings.map(q => q.id));

            if (scores) userScores = scores;
          }

          const lockInfo = computeQuizLockStatus({
            quiz: formattedQuiz,
            subjectTitle: subjectData.title,
            allSubjectQuizzes: formattedSiblings,
            userScores,
          });

          if (lockInfo.isLocked) {
            setQuizLockInfo({
              ...lockInfo,
              prereqQuiz: lockInfo.prereqQuiz ? formatQuiz(lockInfo.prereqQuiz) : null,
              subject: subjectData,
            });
            setLoading(false);
            return;
          }
        }
      }

      if (quizData.time_limit) {
        setTimeLeft(quizData.time_limit * 60);
      }

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId);
        
      if (questionsData) {
        setQuestions(questionsData);
      }
      
      setLoading(false);
    }
    
    fetchQuizData();
  }, [quizId, user?.id, isLoaded]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !isQuizComplete && !loading && !quizLockInfo?.isLocked) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishQuiz(true, userAnswers);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isQuizComplete, loading, quizLockInfo?.isLocked, questions, userAnswers]);

  const handleOptionSelect = (index) => {
    if (!isQuizComplete) {
      const newAnswers = [...userAnswers];
      newAnswers[currentQuestionIndex] = index;
      setUserAnswers(newAnswers);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz(false, userAnswers);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading || !isLoaded) return <div className="max-w-4xl mx-auto p-4 sm:p-8 w-full"><Spinner message="Loading quiz..." /></div>;

  if (quizLockInfo?.isLocked) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 w-full flex flex-col items-center justify-center min-h-[75vh]">
        <div className="w-full glass-panel p-6 sm:p-10 md:p-12 text-center border border-amber-500/20 shadow-xl shadow-amber-500/5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 sm:mb-6 text-amber-500 dark:text-amber-400">
            <Lock size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-500/25 mb-4">
            <Sparkles size={13} />
            Adaptive Learning Progression
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">{quiz?.displayTitle || quiz?.title}</h2>
          <p className="text-textSecondary text-xs sm:text-sm mb-5 sm:mb-6">
            {quizLockInfo.subject?.title}
          </p>

          <div className="bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 text-left space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0 mt-1.5" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-textPrimary">Unlock Requirement</p>
                <p className="text-xs text-textSecondary mt-0.5">{quizLockInfo.lockReason}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-black/10 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="text-textSecondary">Your Highest Score in Prerequisite:</span>
              <span className="font-bold text-amber-800 dark:text-amber-300">
                {quizLockInfo.bestScorePercentage}% <span className="text-textSecondary font-normal">/ {quizLockInfo.requiredPercentage}% needed</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {quizLockInfo.prereqQuiz && (
              <button
                onClick={() => navigate(`/quiz/${quizLockInfo.prereqQuiz.id}`)}
                className="btn btn-primary flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <span className="truncate">
                  Take {quizLockInfo.prereqQuiz?.displayTitle ? `"${quizLockInfo.prereqQuiz.displayTitle}"` : `${quizLockInfo.prereqDifficulty || 'Prerequisite'} Quiz`}
                </span>
                <ArrowRight size={16} />
              </button>
            )}
            <button
              onClick={() => navigate(quiz?.subject_id ? `/subject/${quiz.subject_id}` : '/dashboard')}
              className="btn btn-outline flex-1 py-3 text-sm font-semibold"
            >
              Back to Subject
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) return <div className="max-w-4xl mx-auto p-4 sm:p-8 w-full">Quiz unavailable.</div>;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  if (isQuizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 w-full flex flex-col items-center min-h-[80vh]">
        <div className="p-6 sm:p-10 md:p-16 text-center w-full max-w-2xl glass-panel mb-8 sm:mb-12">
          {timeLeft === 0 && <div className="text-error font-bold mb-4 flex items-center justify-center gap-2"><Clock /> Time's Up!</div>}
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Quiz Completed!</h2>
          <div className="mb-4">
            <span className="text-5xl sm:text-7xl font-extrabold bg-accent-gradient bg-clip-text text-transparent">{percentage}%</span>
          </div>
          <p className="text-base sm:text-lg text-textSecondary">You scored {score} out of {questions.length}</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8 sm:mt-12">
            <button onClick={() => navigate(`/subject/${quiz.subject_id}`)} className="btn btn-outline py-2.5 sm:py-3 px-6">
              Back to Subject
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary py-2.5 sm:py-3 px-6">
              Go to Dashboard
            </button>
          </div>
        </div>

        <div className="w-full max-w-3xl flex flex-col gap-6 sm:gap-8">
          <h3 className="text-xl sm:text-2xl font-bold mb-1">Quiz Review</h3>
          {questions.map((q, qIndex) => (
            <div key={q.id} className="p-5 sm:p-8 glass-panel">
              <h4 className="text-lg sm:text-xl font-bold text-textPrimary mb-4 sm:mb-6">{qIndex + 1}. {q.question_text}</h4>
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {q.options.map((option, optIndex) => {
                  let optionClass = "flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 text-left rounded-xl border text-base sm:text-lg font-medium ";
                  
                  const isUserChoice = userAnswers[qIndex] === optIndex;
                  const isCorrectChoice = q.correct_option_index === optIndex;

                  if (isCorrectChoice) {
                     optionClass += "border-success bg-emerald-500/10 text-success";
                  } else if (isUserChoice && !isCorrectChoice) {
                     optionClass += "border-error bg-red-500/10 text-error";
                  } else {
                     optionClass += "border-black/10 dark:border-white/5 bg-black/[0.02] dark:bg-white/5 text-textPrimary";
                  }

                  return (
                    <div key={optIndex} className={optionClass}>
                      <span>{option}</span>
                      {isCorrectChoice && <CheckCircle className="text-success shrink-0 ml-2" size={18} />}
                      {isUserChoice && !isCorrectChoice && <XCircle className="text-error shrink-0 ml-2" size={18} />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentSelection = userAnswers[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 w-full">
      <header className="flex items-center gap-3 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
        <button onClick={() => navigate(`/subject/${quiz.subject_id}`)} className="flex shrink-0 items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-textPrimary cursor-pointer transition-all border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 shadow-xs">
          <ArrowLeft size={18} />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-accent-gradient rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-textSecondary">Question {currentQuestionIndex + 1} of {questions.length}</span>
            
            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 font-bold ${timeLeft < 60 ? 'text-error animate-pulse' : 'text-indigo-600 dark:text-indigo-400'}`}>
                <Clock size={15} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-5 sm:p-8 md:p-12 glass-panel">
        <h2 className="text-xl sm:text-2xl font-bold text-textPrimary mb-6 sm:mb-8">{currentQuestion.question_text}</h2>
        
        <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
          {currentQuestion.options.map((option, index) => {
            let optionClass = "flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 text-left rounded-xl cursor-pointer border transition-all text-base sm:text-lg font-medium text-textPrimary ";
            
            if (currentSelection === index) {
              optionClass += "border-accentPrimary bg-indigo-500/10 ";
            } else {
              optionClass += "border-black/10 dark:border-white/5 bg-black/[0.02] dark:bg-white/2 hover:-translate-y-0.5 hover:border-black/20 dark:hover:border-white/15 hover:shadow-md ";
            }

            return (
              <button 
                key={index}
                className={optionClass}
                onClick={() => handleOptionSelect(index)}
              >
                <span>{option}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          <button 
            className="btn btn-primary w-full sm:w-auto min-w-[150px]" 
            onClick={handleNextQuestion}
            disabled={currentSelection === undefined || currentSelection === null}
          >
            {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
          </button>
        </div>
      </main>
    </div>
  );
}
