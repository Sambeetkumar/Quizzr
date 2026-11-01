import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function AttemptResult() {
  const { scoreId } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAttemptData() {
      // 1. Fetch user score details
      const { data: scoreData, error: scoreError } = await supabase
        .from('user_scores')
        .select(`
          *,
          quizzes (
            id,
            title,
            subject_id
          )
        `)
        .eq('id', scoreId)
        .single();
        
      if (!scoreData || scoreError) {
        console.error("Error fetching score:", scoreError);
        setLoading(false);
        return;
      }

      const quizInfo = Array.isArray(scoreData.quizzes) ? scoreData.quizzes[0] : scoreData.quizzes;

      // 2. Fetch all questions for this quiz
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', scoreData.quiz_id)
        .order('id', { ascending: true }); 
        
      // 3. Fetch user responses
      const { data: responsesData } = await supabase
        .from('user_responses')
        .select('*')
        .eq('score_id', scoreId);

      // Build a map of question_id -> selected_option_index
      const responsesMap = {};
      if (responsesData) {
        responsesData.forEach(r => {
          responsesMap[r.question_id] = r.selected_option_index;
        });
      }

      setData({
        score: scoreData,
        quiz: quizInfo,
        questions: questionsData || [],
        responsesMap
      });
      
      setLoading(false);
    }
    
    fetchAttemptData();
  }, [scoreId]);

  if (loading) return <div className="max-w-4xl mx-auto p-8 w-full"><Spinner message="Loading attempt details..." /></div>;
  if (!data) return <div className="max-w-4xl mx-auto p-8 w-full text-center">Attempt not found.</div>;

  const { score, quiz, questions, responsesMap } = data;
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score.score / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 w-full flex flex-col items-center min-h-[80vh]">
      <div className="w-full mb-6 sm:mb-8">
        <button onClick={() => navigate('/history')} className="flex shrink-0 items-center gap-2 text-textSecondary hover:text-white transition-colors cursor-pointer bg-white/5 border border-white/5 px-3.5 py-2 rounded-lg hover:bg-white/10 w-fit text-sm">
          <ArrowLeft size={16} /> Back to History
        </button>
      </div>

      <div className="p-6 sm:p-10 md:p-16 text-center w-full max-w-2xl glass-panel mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Quiz Completed!</h2>
        <div className="mb-4">
          <span className="text-5xl sm:text-7xl font-extrabold bg-accent-gradient bg-clip-text text-transparent">{percentage}%</span>
        </div>
        <p className="text-base sm:text-lg text-textSecondary">You scored {score.score} out of {totalQuestions}</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-8 sm:mt-12">
          <button onClick={() => navigate(`/subject/${quiz?.subject_id}`)} className="btn btn-outline py-2.5 sm:py-3 px-6">
            Back to Subject
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary py-2.5 sm:py-3 px-6">
            Go to Dashboard
          </button>
        </div>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-6 sm:gap-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-1">Quiz Review</h3>
        {questions.map((q, qIndex) => {
          const userSelectedOption = responsesMap[q.id];
          
          return (
            <div key={q.id} className="p-5 sm:p-8 glass-panel">
              <h4 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">{qIndex + 1}. {q.question_text}</h4>
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {q.options.map((option, optIndex) => {
                  let optionClass = "flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 text-left rounded-xl border text-base sm:text-lg font-medium ";
                  
                  const isUserChoice = userSelectedOption === optIndex;
                  const isCorrectChoice = q.correct_option_index === optIndex;

                  if (isCorrectChoice) {
                     optionClass += "border-success bg-emerald-500/10 text-success";
                  } else if (isUserChoice && !isCorrectChoice) {
                     optionClass += "border-error bg-red-500/10 text-error";
                  } else {
                     optionClass += "border-white/5 bg-white/5 text-textPrimary";
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
          );
        })}
      </div>
    </div>
  );
}
