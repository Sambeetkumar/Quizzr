import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, XCircle, Clock, Flag, Trophy, Home, Check, CheckCircle2 } from 'lucide-react';
import Spinner from '../components/Spinner';
import QuestionReportModal from '../components/QuestionReportModal';

export default function CustomQuizRunner() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alreadyAttempted, setAlreadyAttempted] = useState(null);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  // Reporting State
  const [reportingQuestion, setReportingQuestion] = useState(null); // question obj
  const [reportingIndex, setReportingIndex] = useState(null);
  const [reportedQuestionIds, setReportedQuestionIds] = useState(new Set());

  // Finish quiz and save score
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
      // 1. Immediately record in localStorage so instant re-attempt is impossible
      const completedTimestamp = new Date().toISOString();
      try {
        localStorage.setItem(`quizzr_attempt_${quizId}_${user.id}`, JSON.stringify({
          quiz_id: quizId,
          score: finalScore,
          completed_at: completedTimestamp
        }));
      } catch (e) {
        console.warn("Could not save to localStorage", e);
      }

      // 2. Check if a score is already recorded in Supabase
      const { data: existingScores, error: checkExistingErr } = await supabase
        .from('custom_quiz_scores')
        .select('id')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id);

      if (checkExistingErr) {
        console.error("Error checking existing score:", checkExistingErr);
      }

      if (existingScores && existingScores.length > 0) {
        return finalScore;
      }

      // 3. Insert score into Supabase
      const { data: scoreData, error: scoreError } = await supabase
        .from('custom_quiz_scores')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score: finalScore,
          user_name: user.fullName || user.firstName || 'Candidate',
        })
        .select()
        .single();

      if (scoreError) {
        console.error("CRITICAL: Failed to save custom quiz score:", scoreError);
        alert(`Warning: Score could not be saved to Supabase: ${scoreError.message}\nPlease ensure RLS is disabled on the 'custom_quiz_scores' table.`);
      } else if (scoreData) {
        const responsesToInsert = questions.map((q, index) => ({
          score_id: scoreData.id,
          question_id: q.id,
          selected_option_index: currentAnswers[index] !== undefined ? currentAnswers[index] : null,
        }));

        await supabase.from('custom_quiz_responses').insert(responsesToInsert);
      }
    }

    return finalScore;
  };

  useEffect(() => {
    // Wait for Clerk to finish loading user session
    if (!isLoaded) return;

    async function fetchQuizData() {
      setLoading(true);

      // 1. Fetch Quiz Info
      const { data: quizData } = await supabase
        .from('custom_quizzes')
        .select('*')
        .eq('id', quizId)
        .maybeSingle();

      if (quizData) {
        setQuiz(quizData);
        if (quizData.time_limit) {
          setTimeLeft(quizData.time_limit * 60);
        }
      }

      // 2. Fetch Questions
      const { data: questionsData } = await supabase
        .from('custom_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: true });

      if (questionsData) {
        const parsed = questionsData.map(q => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')
        }));
        setQuestions(parsed);
      }

      // 3. Check if user has already attempted this quiz (both local storage & Supabase)
      if (user) {
        try {
          const localStored = localStorage.getItem(`quizzr_attempt_${quizId}_${user.id}`);
          if (localStored) {
            setAlreadyAttempted(JSON.parse(localStored));
          }
        } catch (e) {}

        const { data: existingScores, error: checkScoreErr } = await supabase
          .from('custom_quiz_scores')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (checkScoreErr) {
          console.error("Error checking existing score on load:", checkScoreErr);
        }

        if (existingScores && existingScores.length > 0) {
          setAlreadyAttempted(existingScores[0]);
          try {
            localStorage.setItem(`quizzr_attempt_${quizId}_${user.id}`, JSON.stringify(existingScores[0]));
          } catch (e) {}
        }
      }

      setLoading(false);
    }

    fetchQuizData();
  }, [quizId, user, isLoaded]);

  // Timer loop
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !isQuizComplete && !loading && !alreadyAttempted) {
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
  }, [timeLeft, isQuizComplete, loading, alreadyAttempted, questions, userAnswers]);

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

  if (!isLoaded || loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 w-full min-h-[70vh] flex items-center justify-center">
        <Spinner message="Loading quiz details..." />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 w-full text-center min-h-[70vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Unavailable</h2>
        <p className="text-textSecondary mb-6">This custom quiz does not exist or has no questions.</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Back to Home
        </button>
      </div>
    );
  }

  // ALREADY ATTEMPTED SCREEN
  if (alreadyAttempted) {
    const pct = questions.length > 0 ? Math.round((alreadyAttempted.score / questions.length) * 100) : 0;
    const attemptedDate = new Date(alreadyAttempted.completed_at).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 w-full min-h-[75vh] flex items-center justify-center animate-fadeIn">
        <div className="glass-panel p-6 sm:p-8 md:p-10 w-full space-y-5 sm:space-y-6 border border-white/10 shadow-2xl relative overflow-hidden text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-500/15 text-accentPrimary flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accentPrimary/20 text-accentPrimary border border-accentPrimary/30">
              Single Attempt Policy
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{quiz.title}</h1>
            <p className="text-textSecondary text-xs sm:text-sm max-w-md mx-auto">
              You have already completed your attempt for this quiz on <strong className="text-white">{attemptedDate}</strong>.
              Only one attempt per candidate is allowed.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white/5 border border-white/5 max-w-sm mx-auto">
            <span className="text-xs text-textSecondary uppercase tracking-wider block mb-1">Your Submitted Score</span>
            <span className="text-4xl sm:text-5xl font-extrabold bg-accent-gradient bg-clip-text text-transparent block mb-1">
              {pct}%
            </span>
            <span className="text-xs sm:text-sm text-textSecondary">
              {alreadyAttempted.score} out of {questions.length} questions correct
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              to={`/custom-quiz/${quiz.id}/leaderboard`}
              className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Trophy size={18} />
              View Leaderboard
            </Link>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline w-full sm:w-auto"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // QUIZ COMPLETED VIEW
  if (isQuizComplete) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 w-full flex flex-col items-center min-h-[80vh] animate-fadeIn">
        {/* Score Summary Card */}
        <div className="p-6 sm:p-10 md:p-14 text-center w-full max-w-2xl glass-panel mb-8 sm:mb-10 border border-white/10 shadow-2xl">
          {timeLeft === 0 && (
            <div className="text-error font-bold mb-4 flex items-center justify-center gap-2">
              <Clock size={18} /> Time's Up!
            </div>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Quiz Completed!</h2>
          <div className="mb-4">
            <span className="text-5xl sm:text-7xl font-extrabold bg-accent-gradient bg-clip-text text-transparent">
              {percentage}%
            </span>
          </div>
          <p className="text-base sm:text-lg text-textSecondary">
            You scored <strong className="text-white">{score}</strong> out of <strong className="text-white">{questions.length}</strong>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <Link to={`/custom-quiz/${quiz.id}/leaderboard`} className="btn btn-outline w-full sm:w-auto flex items-center justify-center gap-2">
              <Trophy size={18} />
              View Leaderboard
            </Link>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
              <Home size={18} />
              Go to Home
            </button>
          </div>
        </div>

        {/* Question Review Section with Report Button */}
        <div className="w-full max-w-3xl flex flex-col gap-4 sm:gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">Question Review</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Notice any ambiguity or errors? Use the report button on any question to notify the owner.
              </p>
            </div>
          </div>

          {questions.map((q, qIndex) => {
            const userPick = userAnswers[qIndex];
            const isCorrect = userPick === q.correct_option_index;
            const isReported = reportedQuestionIds.has(q.id);

            return (
              <div key={q.id} className="p-4 sm:p-6 md:p-8 glass-panel border border-white/10 space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-lg font-bold text-white flex-1">
                    {qIndex + 1}. {q.question_text}
                  </h4>

                  {/* Report Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setReportingQuestion(q);
                      setReportingIndex(qIndex);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                      isReported
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 hover:bg-amber-500/15 text-textSecondary hover:text-amber-300 border border-white/5 hover:border-amber-500/30'
                    }`}
                    title="Report an issue or comment on this question"
                  >
                    {isReported ? <Check size={14} /> : <Flag size={14} />}
                    <span>{isReported ? 'Reported' : 'Report Question'}</span>
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {q.options.map((option, optIndex) => {
                    let optionClass = "flex items-center justify-between px-5 py-3.5 text-left rounded-xl border text-base font-medium transition-colors ";

                    const isUserChoice = userPick === optIndex;
                    const isTargetCorrect = q.correct_option_index === optIndex;

                    if (isTargetCorrect) {
                      optionClass += "border-emerald-500/50 bg-emerald-500/10 text-emerald-300";
                    } else if (isUserChoice && !isTargetCorrect) {
                      optionClass += "border-red-500/50 bg-red-500/10 text-red-300";
                    } else {
                      optionClass += "border-white/5 bg-white/5 text-textSecondary";
                    }

                    return (
                      <div key={optIndex} className={optionClass}>
                        <span>{option}</span>
                        {isTargetCorrect && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold shrink-0">
                            <CheckCircle size={16} /> Correct
                          </span>
                        )}
                        {isUserChoice && !isTargetCorrect && (
                          <span className="flex items-center gap-1 text-xs text-red-400 font-bold shrink-0">
                            <XCircle size={16} /> Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Question Report Modal */}
        {reportingQuestion && (
          <QuestionReportModal
            quizId={quiz.id}
            question={reportingQuestion}
            questionIndex={reportingIndex}
            onClose={() => {
              setReportingQuestion(null);
              setReportingIndex(null);
            }}
            onReportSuccess={(qId) => {
              setReportedQuestionIds(prev => new Set(prev).add(qId));
            }}
          />
        )}
      </div>
    );
  }

  // ACTIVE QUIZ RUNNING VIEW
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentSelection = userAnswers[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 w-full animate-fadeIn">
      {/* Top Header / Timer / Progress */}
      <header className="flex items-center gap-3 sm:gap-6 mb-6 sm:mb-8">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
              navigate('/dashboard');
            }
          }}
          className="flex shrink-0 items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white cursor-pointer transition-all border border-white/5 bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-accent-gradient rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-textSecondary font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>

            {timeLeft !== null && (
              <div className={`flex items-center gap-1.5 font-bold ${
                timeLeft < 60 ? 'text-error animate-pulse' : 'text-indigo-400'
              }`}>
                <Clock size={15} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Question Card */}
      <main className="p-5 sm:p-8 md:p-12 glass-panel border border-white/10 shadow-2xl">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-6 sm:mb-8 leading-snug">
          {currentQuestion.question_text}
        </h2>

        {/* Dynamic Options List */}
        <div className="flex flex-col gap-2.5 sm:gap-3.5 mb-6 sm:mb-8">
          {currentQuestion.options.map((option, index) => {
            let optionClass = "flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 text-left rounded-xl cursor-pointer border transition-all text-sm sm:text-base md:text-lg font-medium text-textPrimary ";

            if (currentSelection === index) {
              optionClass += "border-accentPrimary bg-indigo-500/15 shadow-md shadow-indigo-500/10 ";
            } else {
              optionClass += "border-white/5 bg-white/2 hover:-translate-y-0.5 hover:border-white/15 hover:shadow-lg ";
            }

            return (
              <button
                key={index}
                type="button"
                className={optionClass}
                onClick={() => handleOptionSelect(index)}
              >
                <span>{option}</span>
                {currentSelection === index && (
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accentPrimary shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Next / Finish Button */}
        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto min-w-[160px]"
            onClick={handleNextQuestion}
            disabled={currentSelection === undefined || currentSelection === null}
          >
            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        </div>
      </main>
    </div>
  );
}
