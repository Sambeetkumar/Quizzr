import { Link } from 'react-router-dom';
import { Clock, HelpCircle, PlayCircle, Trophy, Share2, Users, Flag, Infinity, Lock } from 'lucide-react';
import { getQuizDifficulty, getDifficultyBadgeStyle } from '../lib/adaptiveQuiz';

export default function QuizCard({ 
  quiz, 
  isCustom = false, 
  isLocked = false,
  lockReason = '',
  prereqQuiz = null,
  onShare, 
  onViewAttempts, 
  attemptsCount = 0, 
  onViewReports, 
  reportsCount = 0 
}) {
  const quizUrl = isCustom ? `/custom-quiz/${quiz.id}` : `/quiz/${quiz.id}`;
  const leaderboardUrl = isCustom ? `/custom-quiz/${quiz.id}/leaderboard` : `/quiz/${quiz.id}/leaderboard`;
  const questionsCount = quiz.questions?.length ?? quiz.question_count ?? 0;

  const displayTitle = quiz.displayTitle || quiz.title;
  const difficulty = quiz.difficulty || (!isCustom ? getQuizDifficulty(quiz) : 'easy');
  const badgeStyle = !isCustom ? getDifficultyBadgeStyle(difficulty) : null;

  return (
    <div className={`flex flex-col justify-between glass-panel card-hover ${
      isCustom ? 'p-5 sm:p-7 md:p-8 min-h-[220px]' : 'p-5 sm:p-6 min-h-[180px]'
    }`}>
      <div className="mb-5 sm:mb-6">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-2.5">
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">{displayTitle}</h3>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
            {isCustom ? (
              <span className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-accentPrimary/20 text-accentPrimary font-semibold shrink-0 border border-accentPrimary/30">
                Custom
              </span>
            ) : (
              <>
                {badgeStyle && (
                  <span className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold shrink-0 border ${badgeStyle.className}`}>
                    {badgeStyle.label}
                  </span>
                )}
                {isLocked && (
                  <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold shrink-0 border border-amber-500/30 flex items-center gap-1">
                    <Lock size={11} />
                    Locked
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-textSecondary line-clamp-2 mb-3.5 sm:mb-4 leading-relaxed">
          {quiz.description || 'No description provided.'}
        </p>
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap pt-1">
          {quiz.time_limit ? (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-indigo-400 font-medium">
              <Clock size={15} />
              <span>{quiz.time_limit} Minutes</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-indigo-300 font-medium">
              <Infinity size={15} />
              <span>Untimed</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-400 font-medium">
            <HelpCircle size={15} />
            <span>{questionsCount} Questions</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {isLocked ? (
            <button 
              type="button"
              disabled 
              className="btn bg-white/10 text-textSecondary/60 cursor-not-allowed py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border border-white/5 opacity-70"
              title={lockReason}
            >
              <Lock size={15} />
              Locked
            </button>
          ) : (
            <Link to={quizUrl} className="btn btn-primary py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm font-semibold">
              <PlayCircle size={15} className="mr-1 sm:mr-1.5" />
              Start Quiz
            </Link>
          )}
          <Link to={leaderboardUrl} className="btn btn-outline py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm font-semibold">
            <Trophy size={15} className="mr-1 sm:mr-1.5" />
            Leaderboard
          </Link>

          {onShare && (
            <button 
              type="button"
              onClick={() => onShare(quiz)} 
              className="btn btn-outline py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm text-indigo-400 hover:text-white font-semibold"
              title="Generate temporary shareable link"
            >
              <Share2 size={15} className="mr-1 sm:mr-1.5" />
              Share
            </button>
          )}
        </div>

        {isLocked && lockReason && (
          <p className="text-xs text-amber-300/90 flex items-center gap-1.5 font-medium">
            <Lock size={13} className="shrink-0 text-amber-400" />
            <span>{lockReason}</span>
          </p>
        )}

        {isCustom && (onViewAttempts || onViewReports) && (
          <div className="flex items-center gap-3 pt-3.5 mt-1 border-t border-white/10 flex-wrap">
            {onViewAttempts && (
              <button
                type="button"
                onClick={() => onViewAttempts(quiz)}
                className="inline-flex items-center gap-2 text-xs text-textSecondary hover:text-white px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer font-medium"
              >
                <Users size={14} className="text-accentPrimary" />
                <span>Attempts: <strong className="text-white ml-0.5">{attemptsCount}</strong></span>
              </button>
            )}

            {onViewReports && (
              <button
                type="button"
                onClick={() => onViewReports(quiz)}
                className={`inline-flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer font-medium ${
                  reportsCount > 0 
                    ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 shadow-sm shadow-amber-500/10' 
                    : 'bg-white/5 text-textSecondary hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <Flag size={14} className={reportsCount > 0 ? 'text-amber-400' : 'text-textSecondary'} />
                <span>Reports: <strong className={reportsCount > 0 ? 'text-amber-300 ml-0.5' : 'text-white ml-0.5'}>{reportsCount}</strong></span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
