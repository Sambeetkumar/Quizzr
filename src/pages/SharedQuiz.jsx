import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { Clock, HelpCircle, AlertTriangle, PlayCircle, ShieldCheck, ArrowRight, Infinity, CheckCircle2, Trophy } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function SharedQuiz() {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null); // 'not_found' | 'expired'
  const [shareData, setShareData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [previousAttempt, setPreviousAttempt] = useState(null);

  useEffect(() => {
    // Wait for Clerk user session to be fully loaded
    if (!isLoaded) return;

    async function resolveShare() {
      setLoading(true);

      if (!shareToken) {
        setErrorStatus('not_found');
        setLoading(false);
        return;
      }

      // 1. Fetch share token record
      const { data: share, error: shareError } = await supabase
        .from('custom_quiz_shares')
        .select('*')
        .eq('share_token', shareToken)
        .maybeSingle();

      if (shareError) {
        console.error("Error fetching share record in SharedQuiz:", shareError);
      }

      if (!share) {
        setErrorStatus('not_found');
        setLoading(false);
        return;
      }

      setShareData(share);

      // 2. Check Expiration
      const isExpired = new Date(share.expires_at) < new Date();
      if (isExpired) {
        setErrorStatus('expired');
        setLoading(false);
        return;
      }

      // 3. Fetch Quiz Details
      const { data: quiz, error: quizError } = await supabase
        .from('custom_quizzes')
        .select('*')
        .eq('id', share.quiz_id)
        .maybeSingle();

      if (quizError) {
        console.error("Error fetching quiz in SharedQuiz:", quizError);
      }

      if (!quiz) {
        setErrorStatus('not_found');
        setLoading(false);
        return;
      }

      setQuizData(quiz);

      // 4. Fetch Question Count
      const { count } = await supabase
        .from('custom_questions')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', quiz.id);

      // 5. Check if user has already attempted this quiz (both local storage & Supabase)
      if (user) {
        try {
          const localStored = localStorage.getItem(`quizzr_attempt_${quiz.id}_${user.id}`);
          if (localStored) {
            setPreviousAttempt(JSON.parse(localStored));
          }
        } catch (e) {}

        const { data: existingAttempts, error: checkError } = await supabase
          .from('custom_quiz_scores')
          .select('*')
          .eq('quiz_id', quiz.id)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (checkError) {
          console.error("Error checking previous attempt in SharedQuiz:", checkError);
        }

        if (existingAttempts && existingAttempts.length > 0) {
          setPreviousAttempt(existingAttempts[0]);
          try {
            localStorage.setItem(`quizzr_attempt_${quiz.id}_${user.id}`, JSON.stringify(existingAttempts[0]));
          } catch (e) {}
        }
      }

      setShareData(share);
      setQuizData(quiz);
      setQuestionCount(count || 0);
      setLoading(false);
    }

    resolveShare();
  }, [shareToken, user, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="max-w-xl mx-auto p-8 w-full min-h-[70vh] flex items-center justify-center">
        <Spinner message="Validating quiz access..." />
      </div>
    );
  }

  // Error: Not Found
  if (errorStatus === 'not_found') {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-8 w-full min-h-[70vh] flex items-center justify-center">
        <div className="glass-panel p-6 sm:p-10 text-center w-full space-y-4 border border-white/10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-2">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Invalid Quiz Link</h2>
          <p className="text-textSecondary text-xs sm:text-sm max-w-sm mx-auto">
            This quiz link is invalid or may have been deleted by the owner. Please verify the URL or ask the creator for a new link.
          </p>
          <div className="pt-2 sm:pt-4">
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary w-full sm:w-auto">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error: Expired
  if (errorStatus === 'expired') {
    const expiredDate = shareData?.expires_at ? new Date(shareData.expires_at).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'recently';

    return (
      <div className="max-w-xl mx-auto p-4 sm:p-8 w-full min-h-[70vh] flex items-center justify-center">
        <div className="glass-panel p-6 sm:p-10 text-center w-full space-y-4 border border-black/10 dark:border-white/10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Clock size={28} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-textPrimary">Quiz Link Expired</h2>
          <p className="text-textSecondary text-xs sm:text-sm max-w-sm mx-auto">
            This temporary link expired on <strong className="text-textPrimary">{expiredDate}</strong>.
            The owner sets a time limit on this link. Please reach out to the quiz owner to request a fresh invitation link.
          </p>
          <div className="pt-2 sm:pt-4">
            <button onClick={() => navigate('/dashboard')} className="btn btn-outline w-full sm:w-auto">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const expiresDate = new Date(shareData.expires_at).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // User has already attempted this shared quiz
  if (previousAttempt) {
    const attemptedDate = new Date(previousAttempt.completed_at).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const percentage = questionCount > 0 ? Math.round((previousAttempt.score / questionCount) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-8 w-full min-h-[75vh] flex items-center justify-center animate-fadeIn">
        <div className="glass-panel p-6 sm:p-10 w-full space-y-5 sm:space-y-6 border border-black/10 dark:border-white/10 shadow-2xl relative overflow-hidden text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-500/15 text-accentPrimary flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accentPrimary/15 text-accentPrimary border border-accentPrimary/25">
              Single Attempt Policy
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">{quizData.title}</h1>
            <p className="text-textSecondary text-xs sm:text-sm max-w-md mx-auto">
              You have already submitted your attempt for this quiz on <strong className="text-textPrimary">{attemptedDate}</strong>.
              Multiple attempts are not allowed.
            </p>
          </div>

          {/* Previous Score Display */}
          <div className="p-5 sm:p-6 rounded-2xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/5 max-w-sm mx-auto">
            <span className="text-xs text-textSecondary uppercase tracking-wider block mb-1">Your Score</span>
            <span className="text-4xl sm:text-5xl font-extrabold bg-accent-gradient bg-clip-text text-transparent block mb-1">
              {percentage}%
            </span>
            <span className="text-xs sm:text-sm text-textSecondary">
              {previousAttempt.score} out of {questionCount} questions correct
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              to={`/custom-quiz/${quizData.id}/leaderboard`}
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

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 w-full min-h-[75vh] flex items-center justify-center animate-fadeIn">
      <div className="glass-panel p-6 sm:p-10 w-full space-y-5 sm:space-y-6 border border-black/10 dark:border-white/10 shadow-2xl relative overflow-hidden">
        {/* Top Glow & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 w-fit">
            <ShieldCheck size={14} /> Link Valid
          </span>
          <span className="text-xs text-textSecondary flex items-center gap-1">
            <Clock size={13} /> Expires: <span className="text-textPrimary font-medium">{expiresDate}</span>
          </span>
        </div>

        {/* Quiz Info */}
        <div className="space-y-2 sm:space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-accentPrimary block">
            Quiz Invitation
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">{quizData.title}</h1>
          <p className="text-textSecondary text-sm sm:text-base leading-relaxed">
            {quizData.description || 'You have been invited to attempt this custom quiz. Good luck!'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 py-2 sm:py-3">
          <div className="p-3 sm:p-4 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accentPrimary/15 text-accentPrimary flex items-center justify-center shrink-0">
              <HelpCircle size={18} />
            </div>
            <div>
              <span className="block text-base sm:text-lg font-bold text-textPrimary">{questionCount}</span>
              <span className="text-[11px] sm:text-xs text-textSecondary uppercase">Questions</span>
            </div>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/5 flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              {quizData.time_limit ? <Clock size={18} /> : <Infinity size={18} />}
            </div>
            <div>
              <span className="block text-base sm:text-lg font-bold text-textPrimary">
                {quizData.time_limit ? `${quizData.time_limit} Mins` : 'Untimed'}
              </span>
              <span className="text-[11px] sm:text-xs text-textSecondary uppercase">Time Limit</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {user ? (
            <button
              onClick={() => navigate(`/custom-quiz/${quizData.id}`)}
              className="btn btn-primary w-full py-3.5 sm:py-4 text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <PlayCircle size={18} />
              Start Quiz Now
              <ArrowRight size={18} className="ml-1" />
            </button>
          ) : (
            <SignInButton mode="modal">
              <button
                className="btn btn-primary w-full py-3.5 sm:py-4 text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                <PlayCircle size={18} />
                Sign in to Start Quiz
                <ArrowRight size={18} className="ml-1" />
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </div>
  );
}
