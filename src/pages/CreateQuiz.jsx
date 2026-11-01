import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trash2, Plus, Sparkles, Layers, ListOrdered, Clock, Check } from 'lucide-react';
import Spinner from '../components/Spinner';
import QuizCard from '../components/QuizCard';
import ShareModal from '../components/ShareModal';
import OwnerAttemptsModal from '../components/OwnerAttemptsModal';
import OwnerReportsModal from '../components/OwnerReportsModal';

export default function CreateQuiz() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'my-quizzes'

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUntimed, setIsUntimed] = useState(false);
  const [timeLimit, setTimeLimit] = useState(10);
  const [questions, setQuestions] = useState([
    {
      question_text: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
    }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // My Quizzes State
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [loadingMyQuizzes, setLoadingMyQuizzes] = useState(true);

  // Active Modals
  const [shareTargetQuiz, setShareTargetQuiz] = useState(null);
  const [attemptsTargetQuiz, setAttemptsTargetQuiz] = useState(null);
  const [reportsTargetQuiz, setReportsTargetQuiz] = useState(null);

  // Fetch quizzes created by current user
  const fetchMyQuizzes = async () => {
    if (!user) return;
    setLoadingMyQuizzes(true);

    // 1. Fetch user custom quizzes
    const { data: quizzesData } = await supabase
      .from('custom_quizzes')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    if (quizzesData) {
      // For each quiz, fetch counts for questions, attempts, and reports
      const enriched = await Promise.all(
        quizzesData.map(async (q) => {
          const [qCountRes, sCountRes, rCountRes] = await Promise.all([
            supabase.from('custom_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', q.id),
            supabase.from('custom_quiz_scores').select('id', { count: 'exact', head: true }).eq('quiz_id', q.id),
            supabase.from('custom_question_reports').select('id', { count: 'exact', head: true }).eq('quiz_id', q.id),
          ]);

          return {
            ...q,
            question_count: qCountRes.count || 0,
            attempts_count: sCountRes.count || 0,
            reports_count: rCountRes.count || 0,
          };
        })
      );

      setMyQuizzes(enriched);
    }

    setLoadingMyQuizzes(false);
  };

  useEffect(() => {
    fetchMyQuizzes();
  }, [user]);

  // Question manipulation
  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question_text: '',
        options: ['', '', '', ''],
        correct_option_index: 0,
      }
    ]);
  };

  const handleRemoveQuestion = (qIndex) => {
    if (questions.length <= 1) {
      alert('A quiz must have at least one question.');
      return;
    }
    setQuestions(prev => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleQuestionTextChange = (qIndex, text) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], question_text: text };
      return updated;
    });
  };

  const handleOptionChange = (qIndex, optIndex, text) => {
    setQuestions(prev => {
      const updated = [...prev];
      const newOptions = [...updated[qIndex].options];
      newOptions[optIndex] = text;
      updated[qIndex] = { ...updated[qIndex], options: newOptions };
      return updated;
    });
  };

  const handleAddOption = (qIndex) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = {
        ...updated[qIndex],
        options: [...updated[qIndex].options, '']
      };
      return updated;
    });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    setQuestions(prev => {
      const updated = [...prev];
      const currentOpts = updated[qIndex].options;
      if (currentOpts.length <= 2) {
        alert('Each question must have at least 2 options.');
        return prev;
      }
      const newOptions = currentOpts.filter((_, idx) => idx !== optIndex);
      let newCorrectIndex = updated[qIndex].correct_option_index;
      if (newCorrectIndex === optIndex) {
        newCorrectIndex = 0;
      } else if (newCorrectIndex > optIndex) {
        newCorrectIndex -= 1;
      }
      updated[qIndex] = {
        ...updated[qIndex],
        options: newOptions,
        correct_option_index: newCorrectIndex
      };
      return updated;
    });
  };

  const handleCorrectOptionChange = (qIndex, optIndex) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], correct_option_index: optIndex };
      return updated;
    });
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('You must be logged in to create a quiz.');
      return;
    }

    if (!title.trim()) {
      setFormError('Please provide a title for the quiz.');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setFormError(`Question #${i + 1} is empty. Please enter question text.`);
        return;
      }
      if (q.options.length < 2) {
        setFormError(`Question #${i + 1} must have at least 2 options.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          setFormError(`Option #${j + 1} in Question #${i + 1} is empty.`);
          return;
        }
      }
      if (q.correct_option_index < 0 || q.correct_option_index >= q.options.length) {
        setFormError(`Please select a valid correct answer for Question #${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      // 1. Insert Quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('custom_quizzes')
        .insert({
          created_by: user.id,
          creator_name: user.fullName || user.firstName || 'Creator',
          title: title.trim(),
          description: description.trim() || null,
          time_limit: isUntimed ? null : parseInt(timeLimit, 10),
        })
        .select()
        .single();

      if (quizError || !newQuiz) {
        throw new Error(quizError?.message || 'Failed to create quiz.');
      }

      // 2. Insert Questions
      const questionsToInsert = questions.map(q => ({
        quiz_id: newQuiz.id,
        question_text: q.question_text.trim(),
        options: q.options.map(opt => opt.trim()),
        correct_option_index: q.correct_option_index,
      }));

      const { error: questionsError } = await supabase
        .from('custom_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        throw new Error(questionsError.message || 'Failed to insert questions.');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setIsUntimed(false);
      setTimeLimit(10);
      setQuestions([
        {
          question_text: '',
          options: ['', '', '', ''],
          correct_option_index: 0,
        }
      ]);

      // Refresh list & switch tab
      await fetchMyQuizzes();
      setActiveTab('my-quizzes');

      // Trigger share modal for the newly created quiz
      setShareTargetQuiz(newQuiz);

    } catch (err) {
      console.error('Error creating quiz:', err);
      setFormError(err.message || 'Something went wrong creating the quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 w-full min-h-[85vh]">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2.5 sm:gap-3">
            <Sparkles className="text-accentPrimary shrink-0" size={26} />
            Create & Share Quizzes
          </h1>
          <p className="text-sm sm:text-base text-textSecondary mt-1">
            Build custom quizzes, generate temporary shareable links, and review candidate feedback.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all text-center ${
              activeTab === 'create'
                ? 'bg-accent-gradient text-white shadow-lg'
                : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            Create New Quiz
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-quizzes')}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'my-quizzes'
                ? 'bg-accent-gradient text-white shadow-lg'
                : 'text-textSecondary hover:text-white hover:bg-white/5'
            }`}
          >
            <span>My Quizzes</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20 text-white font-bold">
              {myQuizzes.length}
            </span>
          </button>
        </div>
      </header>

      {/* TAB 1: CREATE QUIZ FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-fadeIn">
          {formError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-error text-error text-sm font-medium">
              {formError}
            </div>
          )}

          {/* Quiz Details Card */}
          <div className="p-4 sm:p-6 md:p-8 glass-panel space-y-5 sm:space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3 sm:pb-4">
              <Layers size={20} className="text-accentPrimary" />
              Quiz Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Quiz Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures Midterm Test"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm sm:text-base text-white placeholder-textSecondary/50 focus:outline-none focus:border-accentPrimary"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-white">
                  Time Limit (Minutes)
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      disabled={isUntimed}
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-accentPrimary ${
                        isUntimed ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-medium text-textSecondary hover:text-white select-none shrink-0 py-1">
                    <input
                      type="checkbox"
                      checked={isUntimed}
                      onChange={(e) => setIsUntimed(e.target.checked)}
                      className="w-4 h-4 rounded text-accentPrimary focus:ring-0 bg-white/5 border-white/20"
                    />
                    <span>Untimed (No limit)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Description (Optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this quiz covers, rules, or instructions..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm sm:text-base text-white placeholder-textSecondary/50 focus:outline-none focus:border-accentPrimary"
              />
            </div>
          </div>

          {/* Question Builder */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <ListOrdered size={20} className="text-accentPrimary" />
                Questions ({questions.length})
              </h2>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="btn btn-outline py-1.5 sm:py-2 px-3 sm:px-4 text-xs sm:text-sm text-accentPrimary hover:text-white"
              >
                <Plus size={15} className="mr-1" />
                Add Question
              </button>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-4 sm:p-6 md:p-8 glass-panel space-y-4 sm:space-y-6 border border-white/10 relative">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
                  <span className="text-sm sm:text-base font-bold text-accentPrimary">
                    Question #{qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 size={13} />
                      Delete Question
                    </button>
                  )}
                </div>

                {/* Question Text */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-white">
                    Question Text
                  </label>
                  <input
                    type="text"
                    required
                    value={q.question_text}
                    onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                    placeholder={`Enter question #${qIndex + 1}...`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-textSecondary/50 focus:outline-none focus:border-accentPrimary"
                  />
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs sm:text-sm font-semibold text-white">
                      Options & Correct Answer
                      <span className="text-xs text-textSecondary font-normal ml-2 hidden sm:inline">
                        (Select the radio button for the correct option)
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      className="text-xs text-indigo-400 hover:text-white flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add Option
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {q.options.map((optionText, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-2 sm:gap-3">
                        <label className="flex items-center cursor-pointer shrink-0" title="Mark as correct answer">
                          <input
                            type="radio"
                            name={`correct_opt_${qIndex}`}
                            checked={q.correct_option_index === optIndex}
                            onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                            className="w-4 h-4 sm:w-5 sm:h-5 text-accentPrimary focus:ring-0 bg-white/5 border-white/20 cursor-pointer"
                          />
                        </label>

                        <div className="flex-1 relative min-w-0">
                          <input
                            type="text"
                            required
                            value={optionText}
                            onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            className={`w-full bg-white/5 border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:outline-none ${
                              q.correct_option_index === optIndex 
                                ? 'border-emerald-500/50 bg-emerald-500/5' 
                                : 'border-white/10 focus:border-accentPrimary'
                            }`}
                          />
                        </div>

                        {q.correct_option_index === optIndex && (
                          <span className="text-xs text-emerald-400 font-bold shrink-0 hidden md:inline">
                            ✓ Correct Key
                          </span>
                        )}

                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(qIndex, optIndex)}
                            className="p-1.5 sm:p-2 text-textSecondary hover:text-red-400 transition-colors shrink-0"
                            title="Remove this option"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-3.5 sm:py-4 rounded-2xl border-2 border-dashed border-white/15 hover:border-accentPrimary/50 bg-white/2 hover:bg-white/5 text-textSecondary hover:text-white transition-all flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm cursor-pointer"
            >
              <PlusCircle size={18} />
              Add Another Question
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {submitting ? (
                'Creating Quiz...'
              ) : (
                <>
                  <Sparkles size={18} />
                  Create Quiz & Generate Share Link
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: MY CREATED QUIZZES */}
      {activeTab === 'my-quizzes' && (
        <div className="space-y-6 animate-fadeIn">
          {loadingMyQuizzes ? (
            <Spinner message="Loading your created quizzes..." />
          ) : myQuizzes.length === 0 ? (
            <div className="p-8 sm:p-16 text-center glass-panel flex flex-col items-center justify-center gap-4">
              <Layers size={48} className="text-white/20 mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold text-white">No Quizzes Created Yet</h3>
              <p className="text-textSecondary text-xs sm:text-sm max-w-md">
                You haven't created any custom quizzes yet. Start designing your first quiz with custom questions and share it with candidates!
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('create')}
                className="btn btn-primary mt-2 sm:mt-4 text-sm"
              >
                <PlusCircle size={18} className="mr-2" />
                Create a Quiz Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {myQuizzes.map(quiz => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  isCustom={true}
                  onShare={(q) => setShareTargetQuiz(q)}
                  onViewAttempts={(q) => setAttemptsTargetQuiz(q)}
                  attemptsCount={quiz.attempts_count}
                  onViewReports={(q) => setReportsTargetQuiz(q)}
                  reportsCount={quiz.reports_count}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {shareTargetQuiz && (
        <ShareModal
          quiz={shareTargetQuiz}
          onClose={() => setShareTargetQuiz(null)}
        />
      )}

      {attemptsTargetQuiz && (
        <OwnerAttemptsModal
          quiz={attemptsTargetQuiz}
          onClose={() => setAttemptsTargetQuiz(null)}
        />
      )}

      {reportsTargetQuiz && (
        <OwnerReportsModal
          quiz={reportsTargetQuiz}
          onClose={() => setReportsTargetQuiz(null)}
        />
      )}
    </div>
  );
}

