import React from 'react';
import { CanonicalLogo } from './CanonicalLogo';
import { Search, Bookmark, LogIn, LogOut, User as UserIcon, Bot } from 'lucide-react';
import { User, loginWithGoogle, loginAsDemoUser, logoutUser } from '../config/firebase';

interface HeaderProps {
  currentTab: 'search' | 'bench';
  onSelectTab: (tab: 'search' | 'bench') => void;
  currentUser: User | null;
  savedBenchCount: number;
  onOpenChat: () => void;
  hasActiveHardwareContext?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  savedBenchCount,
  onOpenChat,
  hasActiveHardwareContext,
}) => {
  const [authLoading, setAuthLoading] = React.useState(false);

  const handleSignIn = async () => {
    setAuthLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      try {
        await loginAsDemoUser();
      } catch (e) {
        console.warn('Sign-in fallback error:', e);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
  };

  return (
    <header className="mm-gradient-primary text-white border-b-4 border-[#ecf0f1] shadow-sm sticky top-0 z-30">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Clean Title */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => onSelectTab('search')}
          >
            <CanonicalLogo variant="white" width={42} height={28} />
            <div className="flex flex-col">
              <span
                className="font-bold text-base sm:text-lg tracking-[0.5px] text-white leading-tight"
                style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
              >
                Matt Millar Hardware Specs & Pinouts
              </span>
              <span className="text-[11px] text-[#ecf0f1]/80 font-normal">
                Instant internet search for pinouts, electrical ratings & datasheets
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition cursor-pointer ${
                currentTab === 'search'
                  ? 'bg-white text-[#2c3e50] shadow-xs'
                  : 'bg-[#34495e] text-white hover:bg-[#2c3e50]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Search & Camera</span>
            </button>

            <button
              onClick={() => onSelectTab('bench')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] transition cursor-pointer ${
                currentTab === 'bench'
                  ? 'bg-white text-[#2c3e50] shadow-xs'
                  : 'bg-[#34495e] text-white hover:bg-[#2c3e50]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-[#3498db]" />
              <span>My Bench</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#3498db] text-white">
                {savedBenchCount}
              </span>
            </button>

            <button
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[6px] bg-[#34495e] text-white hover:bg-[#2c3e50] transition cursor-pointer shadow-xs"
              title="Open Gemini Hardware Engineering Assistant"
            >
              <Bot className="w-3.5 h-3.5 text-[#3498db]" />
              <span>Ask Gemini</span>
              {hasActiveHardwareContext && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Hardware context loaded" />
              )}
            </button>

            {/* Auth block */}
            <div className="pl-1 border-l border-white/20">
              {currentUser ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[#3498db] flex items-center justify-center text-white text-[10px] font-bold">
                    {currentUser.displayName ? currentUser.displayName.slice(0, 1) : 'M'}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1 text-[#ecf0f1] hover:text-white rounded"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#ecf0f1] hover:text-white cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#3498db]" />
                  <span className="hidden sm:inline">{authLoading ? '...' : 'Sign In'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
