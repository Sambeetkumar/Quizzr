import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BookOpen, Layers } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function Dashboard() {
  const { user } = useUser();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching subjects:", error);
      } else {
        setSubjects(data || []);
      }
      setLoading(false);
    }
    
    fetchSubjects();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 w-full">
      <header className="flex justify-between items-center mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1.5 sm:mb-2">Welcome back, <span className="bg-accent-gradient bg-clip-text text-transparent">{user?.firstName}</span>!</h1>
          <p className="text-base sm:text-lg text-textSecondary">What would you like to learn today?</p>
        </div>
      </header>

      <section className="mt-8 sm:mt-12">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <Layers className="text-accentPrimary" size={22} />
          <h2 className="text-xl sm:text-2xl font-bold">Available Subjects</h2>
        </div>

        {loading ? (
          <Spinner message="Loading subjects..." />
        ) : subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {subjects.map(subject => (
              <Link to={`/subject/${subject.id}`} key={subject.id} className="p-5 sm:p-6 md:p-8 flex flex-col gap-3 sm:gap-4 text-white no-underline glass-panel card-hover">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-accentPrimary">
                  <BookOpen />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">{subject.title}</h3>
                <p className="text-sm text-textSecondary line-clamp-2 leading-relaxed">{subject.description}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-16 text-center flex flex-col items-center justify-center gap-4 text-textSecondary glass-panel">
            <BookOpen size={48} className="text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white">No subjects found</h3>
            <p>Check back later for new content or contact the administrator.</p>
          </div>
        )}
      </section>
    </div>
  );
}
