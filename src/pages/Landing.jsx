import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { BrainCircuit, Sparkles, Trophy, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
  const { isSignedIn } = useUser();
  const { theme, toggleTheme } = useTheme();

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute -top-24 -left-24 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 opacity-20 dark:opacity-50 bg-[radial-gradient(circle,rgba(99,102,241,0.4)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>
      <div className="absolute -bottom-48 -right-24 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 opacity-20 dark:opacity-50 bg-[radial-gradient(circle,rgba(139,92,246,0.3)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>

      <nav className="glass-panel flex justify-between items-center py-3 sm:py-4 px-4 sm:px-8 m-3 sm:m-6 mx-3 sm:mx-8 rounded-full shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold text-textPrimary">
          <BrainCircuit className="text-accentPrimary shrink-0" size={22} />
          <span>Quizzer</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-textSecondary hover:text-textPrimary transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} className="text-indigo-600" />
            )}
          </button>
          <SignInButton mode="modal">
            <button className="btn btn-outline py-2 px-3 sm:px-4 text-xs sm:text-sm">Log in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn btn-primary py-2 px-3 sm:px-4 text-xs sm:text-sm">Sign up</button>
          </SignUpButton>
        </div>
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center text-center py-10 sm:py-16 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="max-w-3xl flex flex-col items-center gap-5 sm:gap-6 mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 py-1.5 sm:py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold text-accentPrimary border border-accentPrimary/20 glass-panel">
            <Sparkles size={16} />
            <span>The next generation of learning</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent leading-tight">
            Master Any Subject with Interactive Quizzes
          </h1>
          <p className="text-base sm:text-xl text-textSecondary max-w-2xl font-normal">
            Challenge yourself with our curated quizzes across multiple disciplines. 
            Track your progress, earn achievements, and learn faster.
          </p>
          <div className="mt-2 sm:mt-4 w-full sm:w-auto">
            <SignUpButton mode="modal">
              <button className="btn btn-primary text-base sm:text-lg px-8 sm:px-10 py-3.5 sm:py-4 w-full sm:w-auto">Start Learning Now</button>
            </SignUpButton>
          </div>
        </div>
        
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 text-left flex flex-col gap-4 glass-panel card-hover">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/10">
              <BrainCircuit className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-textPrimary">Diverse Subjects</h3>
            <p className="text-textSecondary">From science to history, we cover a wide array of topics.</p>
          </div>
          <div className="p-8 text-left flex flex-col gap-4 glass-panel card-hover">
             <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10">
              <Trophy className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-textPrimary">Track Progress</h3>
            <p className="text-textSecondary">See your scores improve over time with detailed analytics.</p>
          </div>
          <div className="p-8 text-left flex flex-col gap-4 glass-panel card-hover">
             <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-rose-500/10">
              <Sparkles className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-textPrimary">Modern Experience</h3>
            <p className="text-textSecondary">Enjoy learning in a distraction-free, beautiful environment.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
