import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Chat from './components/Chat';
import AdminDashboard from './components/AdminDashboard';

/**
 * Main Application Component (SPA Session, Admin Portal & Language Manager)
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('kisan_language') || 'English';
  });

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('kisan_auth_token');
      const storedProfile = localStorage.getItem('kisan_user_profile');

      if (storedToken && storedProfile) {
        setUser(JSON.parse(storedProfile));
      }
    } catch (e) {
      console.error('Session parse error', e);
      localStorage.removeItem('kisan_auth_token');
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // When language changes: save to localStorage and refresh page as requested
  const handleLanguageChange = (newLanguage) => {
    localStorage.setItem('kisan_language', newLanguage);
    setCurrentLanguage(newLanguage);
    window.location.reload();
  };

  const handleLoginSuccess = (userProfile) => setUser(userProfile);

  const handleLogout = () => {
    localStorage.removeItem('kisan_auth_token');
    localStorage.removeItem('kisan_user_profile');
    setUser(null);
    setIsAdminView(false);
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-earth-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-stone-900 border-t-kisan-600 rounded-sm animate-spin shadow-brutal-sm" />
        </div>
      </div>
    );
  }

  if (isAdminView) {
    return <AdminDashboard onBackToChat={() => setIsAdminView(false)} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 antialiased font-sans">
      {user ? (
        <Chat
          user={user}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onLogout={handleLogout}
          onOpenAdmin={() => setIsAdminView(true)}
        />
      ) : (
        <Login
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onLoginSuccess={handleLoginSuccess}
          onOpenAdmin={() => setIsAdminView(true)}
        />
      )}
    </div>
  );
}
