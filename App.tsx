import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useChat } from './hooks/useChat';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { LoginScreen } from './components/LoginScreen';
import { ChevronDown, Zap, Sparkles, Check, LogOut, MessageSquare, Trash2, X, SquarePen, Search, ArrowLeft, Menu, Settings, UserPen, Loader2 } from 'lucide-react';
import { ModelId } from './types';

type Theme = 'system' | 'light' | 'dark';

interface UserProfile {
  displayName: string;
  username: string;
  avatar: string | null;
}

// Mock User Interface (Since we removed Firebase)
interface MockUser {
  email: string;
  displayName: string;
  photoURL: string | null;
}

const App: React.FC = () => {
  // Auth State (Local Storage)
  const [user, setUser] = useState<MockUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    displayName: '',
    username: '',
    avatar: null
  });
  
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('kite_theme_pref');
        if (saved === 'light' || saved === 'dark' || saved === 'system') return saved as Theme;
    }
    return 'system';
  });

  const { 
    messages, 
    isLoading, 
    sendMessage, 
    stopGeneration,
    regenerateResponse, 
    editMessage,
    currentModel, 
    setCurrentModel,
    sessions,
    currentSessionId,
    startNewChat,
    loadSession,
    deleteSession,
    clearAllSessions
  } = useChat(user?.email || null);

  // UI States
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const historySidebarRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // --- MOCK AUTH LISTENER ---
  useEffect(() => {
    const checkLogin = () => {
        const storedUser = localStorage.getItem('kite_mock_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Auth parse error", e);
                localStorage.removeItem('kite_mock_user');
            }
        }
        setIsAuthLoading(false);
    };
    
    // Simulate a brief check
    setTimeout(checkLogin, 500);
  }, []);

  const handleLogin = (newUser: MockUser) => {
      localStorage.setItem('kite_mock_user', JSON.stringify(newUser));
      setUser(newUser);
  };

  const handleLogout = () => {
      localStorage.removeItem('kite_mock_user');
      // Do not use window.location.reload() as it causes 404/network errors in some environments
      setUser(null); 
  };

  // --- PROFILE LOGIC ---
  useEffect(() => {
    if (user && user.email) {
        // Load profile from local storage
        const savedProfile = localStorage.getItem(`kite_profile_${user.email}`);
        if (savedProfile) {
            try {
                setUserProfile(JSON.parse(savedProfile));
            } catch (e) {
                console.error("Failed to parse profile", e);
            }
        } else {
             // Default if no profile saved yet
             setUserProfile({
                 displayName: user.displayName || 'User',
                 username: user.email?.split('@')[0] || 'user',
                 avatar: user.photoURL || null
             });
        }
    }
  }, [user]);

  const handleSaveProfile = (newProfile: UserProfile) => {
      setUserProfile(newProfile);
      if (user && user.email) {
          localStorage.setItem(`kite_profile_${user.email}`, JSON.stringify(newProfile));
      }
  };

  // --- THEME LOGIC ---

  // 1. Load User Preference on Login
  useEffect(() => {
    if (user && user.email) {
        const savedTheme = localStorage.getItem(`kite_theme_${user.email}`);
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
            setTheme(savedTheme as Theme);
        } else {
            setTheme('system'); 
        }
    }
  }, [user]);

  // 2. Apply Theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Explicitly add/remove class
    if (isDark) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }

    // Save preference
    if (user && user.email) {
        localStorage.setItem(`kite_theme_${user.email}`, theme);
    }
    localStorage.setItem('kite_theme_pref', theme);
  }, [theme, user]);

  // 3. Listen for System Changes (Only if system mode)
  useEffect(() => {
    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
             if (mediaQuery.matches) {
                 document.documentElement.classList.add('dark');
             } else {
                 document.documentElement.classList.remove('dark');
             }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);


  // Filter sessions based on search query
  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDate.getTime() === today.getTime()) return 'Hôm nay';
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ 
            top: mainScrollRef.current.scrollHeight, 
            behavior: 'smooth' 
        });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (isHistoryOpen && historySidebarRef.current && !historySidebarRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (!target.closest('#history-toggle-btn')) {
            setIsHistoryOpen(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHistoryOpen]);

  const handleImageClick = (url: string) => {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
    setViewingImage(url);
  };

  const exitSearchMode = () => {
      setIsSearching(false);
      setSearchQuery('');
  };

  // --- RENDER ---

  if (isAuthLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
        </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    // Explicitly using bg-white for light mode
    <div className="flex h-screen bg-white dark:bg-black relative overflow-hidden font-sans text-black dark:text-white transition-colors duration-200">
      
      {/* Settings Modal - Pass theme props */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onClearHistory={clearAllSessions}
        userEmail={user.email}
        onLogout={handleLogout}
        sessions={sessions}
        currentTheme={theme}
        onSetTheme={setTheme}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileEditOpen}
        onClose={() => setIsProfileEditOpen(false)}
        userEmail={user.email}
        currentProfile={userProfile}
        onSave={handleSaveProfile}
      />

      {/* Lightbox */}
      {viewingImage && createPortal(
        <div 
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm"
            onClick={() => setViewingImage(null)}
        >
            <button 
                onClick={() => setViewingImage(null)}
                className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all"
            >
                <X size={24} />
            </button>
            <img 
                src={viewingImage} 
                alt="Full view" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()} 
            />
        </div>,
        document.body
      )}

      {/* Sidebar Overlay - Updated to Pure Black in Dark / Pure White in Light */}
      <div 
        ref={historySidebarRef}
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-black shadow-2xl transform transition-transform duration-300 ease-in-out border-r border-slate-100 dark:border-white/10 ${
          isHistoryOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
            {/* Search Bar Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-black z-10">
                <div className="relative flex items-center gap-2">
                    {isSearching ? (
                        <button 
                            onClick={exitSearchMode}
                            className="p-1 -ml-1 text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    ) : (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-slate-400" />
                        </div>
                    )}
                    
                    <input
                        ref={searchInputRef}
                        type="text"
                        className={`block w-full py-2.5 border-none rounded-xl bg-slate-100 dark:bg-slate-900/50 text-sm font-medium text-black dark:text-white placeholder:text-slate-400 focus:ring-0 transition-all outline-none ${isSearching ? 'pl-3' : 'pl-9 pr-3'}`}
                        placeholder="Tìm kiếm cuộc trò chuyện"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearching(true)}
                    />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {!isSearching && (
                    <button 
                        onClick={() => {
                            startNewChat();
                            setIsHistoryOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium transition-colors mb-4 group"
                    >
                        <SquarePen size={18} className="text-slate-500 group-hover:text-black dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                        Cuộc trò chuyện mới
                    </button>
                )}

                {isSearching && (
                    <div className="px-2 py-2 text-sm font-semibold text-black dark:text-white mb-1">
                        {searchQuery ? 'Kết quả' : 'Gần đây'}
                    </div>
                )}

                {sessions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        Chưa có cuộc trò chuyện nào
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        Không tìm thấy kết quả
                    </div>
                ) : (
                    filteredSessions.map(session => (
                        <div 
                            key={session.id}
                            className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                                currentSessionId === session.id && !isSearching
                                ? 'bg-slate-100 dark:bg-slate-900 text-black dark:text-white font-medium' 
                                : 'text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                            }`}
                            onClick={() => {
                                loadSession(session.id);
                                setIsHistoryOpen(false);
                            }}
                        >
                            <span className="truncate flex-1 text-sm pr-2">{session.title}</span>
                            
                            {isSearching ? (
                                <span className="text-xs text-slate-500 flex-shrink-0">
                                    {formatDate(session.updatedAt)}
                                </span>
                            ) : (
                                <>
                                    {currentSessionId !== session.id && (
                                        <MessageSquare size={16} className="text-slate-400 opacity-0 group-hover:opacity-0 hidden" />
                                    )}
                                    <button 
                                        onClick={(e) => deleteSession(session.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded-lg transition-all absolute right-2 bg-white/80 dark:bg-black/80 backdrop-blur-sm"
                                        title="Xóa"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {!isSearching && (
                <div className="p-4 border-t border-slate-100 dark:border-white/10">
                    <button 
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setIsHistoryOpen(false);
                        }}
                        className="w-full flex items-center justify-start gap-3 p-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-colors"
                    >
                        <Settings size={18} />
                        Cài đặt và điều khoản
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full w-full relative">
        
        {/* Header - Transparent/Blurry Pure Black */}
        <header className="flex-none h-16 px-4 md:px-6 flex items-center justify-between bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200/50 dark:border-white/10 z-20 sticky top-0 transition-colors">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
                id="history-toggle-btn"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-black dark:hover:text-white transition-colors"
            >
                <Menu size={24} />
            </button>
            <span className="font-extrabold text-2xl tracking-tighter text-black dark:text-white">k-ite</span>
          </div>

          <div className="flex items-center gap-3">
             {/* Model Selector - Updated Dropdown BG */}
            <div className="relative" ref={modelDropdownRef}>
              <button 
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-base font-bold transition-colors text-black dark:text-white"
              >
                <span className="hidden md:inline">{currentModel === 'gemini-3-flash-preview' ? 'k-ite 1' : 'k-ite 1.5'}</span>
                <span className="md:hidden">{currentModel === 'gemini-3-flash-preview' ? '1.0' : '1.5'}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-black rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setCurrentModel('gemini-3-flash-preview');
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                        currentModel === 'gemini-3-flash-preview' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${currentModel === 'gemini-3-flash-preview' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Zap size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">k-ite 1</div>
                        <div className="text-xs opacity-70">Nhanh & Hiệu quả</div>
                      </div>
                      {currentModel === 'gemini-3-flash-preview' && <Check size={16} className="ml-auto text-amber-600 dark:text-amber-400" />}
                    </button>

                    <button
                      onClick={() => {
                        setCurrentModel('gemini-3-pro-preview');
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                        currentModel === 'gemini-3-pro-preview' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                       <div className={`p-2 rounded-lg ${currentModel === 'gemini-3-pro-preview' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">k-ite 1.5</div>
                        <div className="text-xs opacity-70">Thông minh & Sáng tạo</div>
                      </div>
                      {currentModel === 'gemini-3-pro-preview' && <Check size={16} className="ml-auto text-purple-600 dark:text-purple-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileDropdownRef}>
                <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white text-black dark:text-black flex items-center justify-center text-sm font-medium hover:ring-4 ring-slate-100 dark:ring-slate-800 transition-all overflow-hidden border border-slate-200 dark:border-transparent"
                >
                    {userProfile.avatar ? (
                        <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</span>
                    )}
                </button>

                {isProfileDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-black rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                         <div className="px-3 py-3 border-b border-slate-50 dark:border-slate-800 mb-1 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-black dark:text-white flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {userProfile.avatar ? (
                                    <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span>{userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-black dark:text-white truncate">
                                    {userProfile.displayName || 'Guest'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user.email}
                                </p>
                            </div>
                         </div>
                         
                         <div className="space-y-1 mt-1">
                            <button 
                                onClick={() => {
                                    setIsProfileDropdownOpen(false);
                                    setIsProfileEditOpen(true);
                                }}
                                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-medium transition-colors"
                            >
                                <UserPen size={16} />
                                Chỉnh sửa hồ sơ
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2"></div>
                            <button 
                                onClick={() => {
                                    setIsProfileDropdownOpen(false);
                                    handleLogout();
                                }}
                                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
                            >
                                <LogOut size={16} />
                                Đăng xuất
                            </button>
                         </div>
                    </div>
                )}
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <main 
            ref={mainScrollRef}
            className="flex-1 overflow-y-auto w-full px-2 md:px-0 pt-4 pb-2 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto w-full">
            {messages.length === 0 ? (
                // Welcome Screen
               <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 animate-in fade-in zoom-in duration-500">
                    <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Xin chào, {userProfile.displayName || 'bạn'} có thể giúp gì?</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md">
                        k-ite là trợ lý AI thông minh được thiết kế để hỗ trợ bạn trong công việc, học tập và sáng tạo.
                    </p>
               </div>
            ) : (
                // Messages List
                <div className="flex flex-col gap-2 pb-4">
                     {messages.map((message) => (
                        <ChatBubble 
                            key={message.id} 
                            message={message} 
                            onImageClick={handleImageClick}
                            currentModel={currentModel}
                            onRegenerate={regenerateResponse}
                            onEdit={editMessage}
                        />
                    ))}
                </div>
            )}
            
          </div>
        </main>

        {/* Input Area - UPDATED to from-white */}
        <div className="flex-none w-full bg-gradient-to-t from-white via-white/80 to-transparent dark:from-black dark:via-black/80 pt-4 pb-2 md:pb-8 z-30 pointer-events-none">
             <div className="pointer-events-auto">
                <ChatInput onSend={sendMessage} onStop={stopGeneration} isLoading={isLoading} />
             </div>
        </div>

      </div>
    </div>
  );
};

export default App;