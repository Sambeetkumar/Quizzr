import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SubjectView from './pages/SubjectView';
import QuizRunner from './pages/QuizRunner';
import History from './pages/History';
import AttemptResult from './pages/AttemptResult';
import Leaderboard from './pages/Leaderboard';
import CreateQuiz from './pages/CreateQuiz';
import SharedQuiz from './pages/SharedQuiz';
import CustomQuizRunner from './pages/CustomQuizRunner';
import CustomQuizLeaderboard from './pages/CustomQuizLeaderboard';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <SignedIn>
        <Navbar />
      </SignedIn>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <>
            <SignedIn><Dashboard /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        
        <Route path="/subject/:subjectId" element={
          <>
            <SignedIn><SubjectView /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        
        <Route path="/quiz/:quizId" element={
          <>
            <SignedIn><QuizRunner /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />

        <Route path="/quiz/:quizId/leaderboard" element={
          <>
            <SignedIn><Leaderboard /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />

        {/* Custom Quizzes & Sharing Routes */}
        <Route path="/create" element={
          <>
            <SignedIn><CreateQuiz /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />

        <Route path="/quiz/shared/:shareToken" element={<SharedQuiz />} />

        <Route path="/custom-quiz/:quizId" element={
          <>
            <SignedIn><CustomQuizRunner /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />

        <Route path="/custom-quiz/:quizId/leaderboard" element={
          <>
            <SignedIn><CustomQuizLeaderboard /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
        
        <Route path="/history" element={
          <>
            <SignedIn><History /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />

        <Route path="/history/attempt/:scoreId" element={
          <>
            <SignedIn><AttemptResult /></SignedIn>
            <SignedOut><RedirectToSignIn /></SignedOut>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
