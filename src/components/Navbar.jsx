import { useState, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Menu, X, Home, PlusCircle, History } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu whenever location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/create', label: 'Create', icon: PlusCircle },
    { to: '/history', label: 'History', icon: History },
  ];

  return (
    <nav className="w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-7xl mx-auto mt-3 sm:mt-4 py-3 px-4 sm:px-6 md:px-8 glass-panel sticky top-3 sm:top-4 z-50 mb-4 shadow-2xl transition-all">
      <div className="flex items-center justify-between">
        {/* Logo & Desktop Nav */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link to="/dashboard" className="text-xl sm:text-2xl font-bold bg-accent-gradient bg-clip-text text-transparent shrink-0">
            Quizzr
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink 
                key={to}
                to={to} 
                className={({ isActive }) => 
                  `px-3.5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive 
                      ? 'bg-white/10 text-white shadow-sm' 
                      : 'text-textSecondary hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right side: User Profile & Mobile Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center shrink-0">
            <UserButton afterSignOutUrl="/" />
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/5 text-textSecondary hover:text-white transition-colors cursor-pointer"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Dropdown */}
      {isOpen && (
        <div className="md:hidden pt-3 mt-3 border-t border-white/10 flex flex-col gap-1.5 animate-fadeIn">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink 
              key={to}
              to={to} 
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                  isActive 
                    ? 'bg-accent-gradient text-white shadow-md' 
                    : 'text-textSecondary hover:text-white hover:bg-white/5 bg-white/2'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
