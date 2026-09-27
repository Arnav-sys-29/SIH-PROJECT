import React, { useState } from 'react';
import { Phone, Lock, Sprout, ArrowRight, UserPlus, ShieldCheck, HelpCircle, Globe, Shield } from 'lucide-react';
import { translations } from '../translations';

/**
 * Screen 1: Login / Register Page
 *
 * Fully localized with 100% pure single-language text (no dual-language mixture).
 * Includes top language switcher that reloads the application into the selected language.
 */
export default function Login({ currentLanguage, onLanguageChange, onLoginSuccess, onOpenAdmin }) {
  const t = translations[currentLanguage] || translations.English;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = () => {
    if (!phoneNumber.trim()) {
      setError(t.errPhoneEmpty);
      return false;
    }
    if (phoneNumber.trim().length < 10) {
      setError(t.errPhoneInvalid);
      return false;
    }
    if (!password.trim()) {
      setError(t.errPasswordEmpty);
      return false;
    }
    setError('');
    return true;
  };

  const handleAuth = (actionType) => {
    if (!validateInputs()) return;

    setIsLoading(true);

    setTimeout(() => {
      const mockUser = {
        phone: phoneNumber.trim(),
        name: `Kisan Member (${phoneNumber.slice(-4)})`,
        role: 'Farmer / Cooperative Member',
        token: `mock-token-${Date.now()}`,
        loginType: actionType,
      };

      localStorage.setItem('kisan_auth_token', mockUser.token);
      localStorage.setItem('kisan_user_profile', JSON.stringify(mockUser));

      setIsLoading(false);
      onLoginSuccess(mockUser);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-earth-50 via-earth-50 to-kisan-50 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Language Switcher Bar & Admin Access */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-1">
        <button
          onClick={onOpenAdmin}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-earth-50 active:bg-stone-100 text-stone-900 rounded-sm text-xs font-bold border-2 border-stone-900 shadow-brutal-sm hover:shadow-brutal transition cursor-pointer hover:-translate-y-0.5"
        >
          <Shield className="w-3.5 h-3.5 text-hopeBlue-600" />
          <span>Admin Portal</span>
        </button>

        <div className="flex items-center bg-white shadow-brutal-sm rounded-sm px-3 py-1.5 border-2 border-stone-900 text-xs transition hover:-translate-y-0.5">
          <Globe className="w-4 h-4 text-kisan-700 mr-2" />
          <select
            value={currentLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-transparent text-stone-800 font-semibold outline-none cursor-pointer text-xs"
          >
            <option value="English">English</option>
            <option value="Hindi">हिन्दी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
            <option value="Gujarati">ગુજરાતી (Gujarati)</option>
            <option value="Bengali">বাংলা (Bengali)</option>
            <option value="Telugu">తెలుగు (Telugu)</option>
          </select>
        </div>
      </div>

      {/* Header & Single-Language Branding */}
      <header className="max-w-md w-full mx-auto text-center pt-2 pb-2">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-kisan-600 text-white rounded-sm shadow-brutal border-2 border-kisan-900 mb-4 animate-pop-in">
          <Sprout className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce-subtle" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tighter uppercase">
          {t.appName}
        </h1>
        <p className="text-sm sm:text-base text-stone-700 font-bold mt-1">
          {t.appSubtitle}
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-kisan-100 text-kisan-900 text-xs font-bold rounded-sm border-2 border-kisan-900 shadow-brutal-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-kisan-700" />
          {t.officialBadge}
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="max-w-md w-full mx-auto my-auto bg-white rounded-sm p-6 sm:p-8 shadow-brutal border-2 border-stone-900">
        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-xl font-bold text-stone-900">
            {t.loginWelcome}
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            {t.loginDescription}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border-2 border-red-900 rounded-sm shadow-brutal-sm text-red-900 text-xs sm:text-sm font-bold animate-pop-in">
            {error}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
          {/* Phone Number Field */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-1.5 flex items-center justify-between">
              <span>{t.phoneLabel}</span>
              <span className="text-xs text-kisan-700 font-semibold">{t.phoneSublabel}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Phone className="w-5 h-5 text-kisan-600" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                placeholder={t.phonePlaceholder}
                className="w-full pl-11 pr-4 py-3.5 text-base sm:text-lg bg-white border-2 border-stone-900 rounded-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-kisan-600 focus:shadow-brutal-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-bold text-stone-800 mb-1.5 flex items-center justify-between">
              <span>{t.passwordLabel}</span>
              <span className="text-xs text-stone-500 font-medium">{t.passwordSublabel}</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-5 h-5 text-kisan-600" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full pl-11 pr-4 py-3.5 text-base sm:text-lg bg-white border-2 border-stone-900 rounded-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-kisan-600 focus:shadow-brutal-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Large Action Buttons */}
          <div className="pt-2 space-y-4">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleAuth('login')}
              className="group w-full touch-target py-4 px-6 bg-kisan-600 hover:bg-kisan-700 active:bg-kisan-800 text-white font-extrabold uppercase tracking-wide text-base sm:text-lg rounded-sm shadow-brutal border-2 border-kisan-900 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-brutal-active cursor-pointer disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.loginBtn}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleAuth('register')}
              className="w-full touch-target py-3.5 px-6 bg-earth-100 hover:bg-earth-200 active:bg-earth-300 text-earth-900 font-extrabold uppercase tracking-wide text-base rounded-sm shadow-brutal-sm border-2 border-earth-900 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none cursor-pointer disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-brutal-sm"
            >
              <UserPlus className="w-5 h-5 text-earth-900" />
              <span>{t.registerBtn}</span>
            </button>
          </div>
        </form>

        {/* 5 Guardrail Topics Info */}
        <div className="mt-6 pt-5 border-t border-stone-100">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 text-center">
            {t.advisoryTopicsTitle}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {t.topicsList.map((topic, i) => (
              <span key={i} className="text-[11px] px-2.5 py-1 bg-stone-100 border-2 border-stone-800 shadow-brutal-sm text-stone-900 font-bold">
                {topic}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Emergency Helpline Footer */}
      <footer className="max-w-md w-full mx-auto text-center pt-4 pb-2 text-xs text-stone-600">
        <div className="inline-flex items-center gap-1 text-kisan-800 font-semibold mb-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t.helplineText}</span>
        </div>
      </footer>
    </div>
  );
}
