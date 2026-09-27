import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Send,
  Sprout,
  LogOut,
  Globe,
  ExternalLink,
  Search,
  Sparkles,
  ShieldCheck,
  User,
  Bot,
  AlertCircle
} from 'lucide-react';
import { translations } from '../translations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Screen 2: Main Chatbot Interface
 *
 * Enforces pure single-language UI and AI output (No mixed languages).
 * Changing language triggers clean persistence and page refresh.
 */
export default function Chat({ user, currentLanguage, onLanguageChange, onLogout, onOpenAdmin }) {
  const t = translations[currentLanguage] || translations.English;

  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: t.welcomeMessage,
      toolActivity: null,
      sources: [],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [speechError, setSpeechError] = useState('');

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthRef = useRef(window.speechSynthesis || null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      if (speechSynthRef.current) speechSynthRef.current.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  // =========================================================================
  // 🎙️ 1. WEB SPEECH API: SPEECH-TO-TEXT (STT)
  // =========================================================================
  const toggleListening = () => {
    setSpeechError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(t.speechErrorNotSupported);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;

      // Pure language speech recognition
      recognition.lang = t.speechLang;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputQuery(transcript);
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setSpeechError(t.speechErrorDenied);
        } else if (event.error !== 'no-speech') {
          setSpeechError(event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  // Clean markdown & pseudo-XML before synthesizing speech or rendering
  const cleanMessageContent = (textContent) => {
    if (!textContent) return '';
    return textContent
      .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
      .replace(/<\/?[a-z_]+(?:=[^>]*)?>/gi, '')
      .trim();
  };

  // =========================================================================
  // 🔊 2. WEB SPEECH API: TEXT-TO-SPEECH (TTS)
  // =========================================================================
  const toggleTextToSpeech = (msgId, textContent) => {
    if (!speechSynthRef.current) return;

    if (speakingMsgId === msgId) {
      speechSynthRef.current.cancel();
      setSpeakingMsgId(null);
      return;
    }

    speechSynthRef.current.cancel();

    // Clean markdown and XML tags before synthesizing speech
    const plainText = cleanMessageContent(textContent)
      .replace(/[*_#`~]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = t.speechLang;
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    speechSynthRef.current.speak(utterance);
  };

  // =========================================================================
  // ⚡ 3. BACKEND SSE STREAMING VIA FETCH
  // =========================================================================
  const handleSendMessage = async (textToSend) => {
    const userMessage = (textToSend || inputQuery).trim();
    if (!userMessage || isStreaming) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const newUserMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const newAssistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      toolActivity: null,
      sources: [],
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages([...updatedHistory, newAssistantMsg]);
    setInputQuery('');
    setIsStreaming(true);

    try {
      const historyPayload = updatedHistory
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: historyPayload,
          language: currentLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop();

        for (const block of blocks) {
          const trimmed = block.trim();
          if (!trimmed.startsWith('data:')) continue;

          const dataString = trimmed.replace(/^data:\s*/, '');
          if (dataString === '[DONE]') break;

          try {
            const event = JSON.parse(dataString);

            if (event.type === 'tool_call_start') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        toolActivity: {
                          status: 'searching',
                          message: t.searchingGov,
                        },
                      }
                    : msg
                )
              );
            } else if (event.type === 'tool_call_result') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        toolActivity: null,
                        sources: event.metadata?.results || [],
                      }
                    : msg
                )
              );
            } else if (event.type === 'token' && event.content) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + event.content }
                    : msg
                )
              );
            } else if (event.type === 'error') {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? {
                        ...msg,
                        content: msg.content + `\n\n${event.content}`,
                      }
                    : msg
                )
              );
            }
          } catch (jsonErr) {
            // Ignore partial lines
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: t.serverErrorMsg,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white sm:shadow-brutal sm:border-x-2 sm:border-stone-900">
      {/* Top App Header with Single-Language Branding */}
      <header className="bg-kisan-600 text-earth-50 px-4 py-3 sm:px-6 shadow-brutal-sm border-b-2 border-stone-900 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-earth-50/10 rounded-sm flex items-center justify-center border-2 border-earth-50 animate-pop-in">
            <Sprout className="w-6 h-6 text-earth-100 animate-bounce-subtle" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg leading-tight tracking-tight">
              {t.appName}
            </h1>
            <p className="text-xs text-kisan-200 font-medium">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Dashboard Portal */}
          <button
            onClick={onOpenAdmin}
            title="Nodal Officer / Admin Dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-earth-50 active:bg-stone-100 text-stone-900 rounded-sm text-xs font-bold border-2 border-stone-900 shadow-brutal-sm hover:shadow-brutal transition cursor-pointer hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-4 h-4 text-hopeBlue-600" />
            <span className="hidden sm:inline">Admin Portal</span>
          </button>

          {/* Language Selector (Triggers Full Page Refresh) */}
          <div className="flex items-center bg-kisan-800 rounded-sm px-2.5 py-1.5 border-2 border-kisan-400 text-xs shadow-brutal-sm transition hover:-translate-y-0.5">
            <Globe className="w-3.5 h-3.5 text-kisan-300 mr-1.5" />
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs uppercase"
            >
              <option value="English" className="text-stone-900 font-bold">English</option>
              <option value="Hindi" className="text-stone-900 font-bold">हिन्दी (Hindi)</option>
              <option value="Marathi" className="text-stone-900 font-bold">मराठी (Marathi)</option>
              <option value="Gujarati" className="text-stone-900 font-bold">ગુજરાતી (Gujarati)</option>
              <option value="Bengali" className="text-stone-900 font-bold">বাংলা (Bengali)</option>
              <option value="Telugu" className="text-stone-900 font-bold">తెలుగు (Telugu)</option>
            </select>
          </div>

          {/* User Logout */}
          <button
            onClick={onLogout}
            title={t.logoutTooltip}
            className="p-2 hover:bg-white/10 active:bg-white/20 rounded-sm border-2 border-transparent hover:border-white/50 text-kisan-100 transition-all cursor-pointer hover:shadow-brutal-sm hover:-translate-y-0.5"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Scrollable Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-earth-50 via-earth-50/50 to-white">
        {/* Quick Topic Chips */}
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-kisan-600" />
              {t.quickQuestionsTitle}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {t.samplePrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.text)}
                  className="text-left p-3.5 bg-white hover:bg-kisan-50 active:bg-kisan-100 rounded-sm border-2 border-stone-900 shadow-brutal-sm hover:shadow-brutal transition-all text-xs sm:text-sm text-stone-800 flex flex-col gap-1 cursor-pointer hover:-translate-y-0.5"
                >
                  <span className="font-extrabold text-stone-900 text-[11px] uppercase tracking-wide">
                    {item.topic}
                  </span>
                  <span className="text-stone-600 line-clamp-2">
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSpeaking = speakingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm border-2 border-stone-900 bg-kisan-600 text-white flex items-center justify-center flex-shrink-0 shadow-brutal-sm mt-1 animate-pop-in">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-sm p-4 shadow-brutal-sm border-2 border-stone-900 text-sm sm:text-base leading-relaxed ${
                  isUser
                    ? 'bg-kisan-600 text-white'
                    : 'bg-white text-stone-900'
                }`}
              >
                {/* Active Government Search Status */}
                {!isUser && msg.toolActivity && (
                  <div className="mb-3 p-2.5 bg-amber-50 border-2 border-amber-900 shadow-brutal-sm rounded-sm flex items-center gap-2 text-xs text-amber-900 font-bold animate-pulse">
                    <Search className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span className="font-medium">{msg.toolActivity.message}</span>
                  </div>
                )}

                {/* Message Body */}
                <div className="break-words max-w-full">
                  {!msg.content && isStreaming && !isUser ? (
                    <span className="inline-flex items-center gap-1.5 text-stone-500 italic text-xs">
                      <span className="w-2 h-2 bg-kisan-600 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-kisan-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      {t.formulatingResponse}
                    </span>
                  ) : (
                    <div className={`prose prose-sm sm:prose-base max-w-none prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-headings:font-bold ${isUser ? 'prose-invert text-white prose-p:text-white prose-headings:text-white' : 'prose-stone prose-pre:bg-stone-800 prose-pre:text-stone-100 prose-a:text-kisan-600 prose-headings:text-stone-800'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {cleanMessageContent(msg.content)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Verified Government Sources */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100">
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-kisan-700" />
                      {t.verifiedSources}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-kisan-100 text-stone-700 hover:text-kisan-800 text-xs rounded-lg font-medium border border-stone-200 transition-colors"
                        >
                          <span className="truncate max-w-[190px]">{src.title}</span>
                          <ExternalLink className="w-3 h-3 text-kisan-600" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text-to-Speech Button */}
                {!isUser && msg.content && (
                  <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                    <button
                      onClick={() => toggleTextToSpeech(msg.id, msg.content)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                        isSpeaking ? 'bg-kisan-600 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                      title={isSpeaking ? t.stopBtn : t.listenBtn}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                          <span>{t.stopBtn}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-kisan-700" />
                          <span>{t.listenBtn}</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-stone-400">{t.appName}</span>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm border-2 border-stone-900 bg-hopeBlue-500 text-white flex items-center justify-center flex-shrink-0 shadow-brutal-sm mt-1 animate-pop-in">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </main>

      {/* Speech Error Banner */}
      {speechError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{speechError}</span>
          </div>
          <button onClick={() => setSpeechError('')} className="text-red-500 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Fixed Bottom Input Area */}
      <footer className="p-3 sm:p-4 bg-white border-t-2 border-stone-900 sticky bottom-0 z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 sm:gap-3"
        >
          {/* Speech-to-Text Button */}
          <button
            type="button"
            onClick={toggleListening}
            title={isListening ? t.listeningPlaceholder : t.audioGuide}
            className={`touch-target p-3.5 rounded-sm border-2 border-stone-900 flex items-center justify-center transition-all cursor-pointer ${
              isListening
                ? 'bg-red-600 text-white shadow-brutal'
                : 'bg-kisan-100 hover:bg-kisan-200 text-stone-900 shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5'
            }`}
          >
            <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse' : 'text-kisan-700'}`} />
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={isListening ? t.listeningPlaceholder : t.inputPlaceholder}
              disabled={isStreaming}
              className="w-full py-3.5 pl-4 pr-10 text-sm sm:text-base bg-white border-2 border-stone-900 rounded-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:shadow-brutal-sm transition-all outline-none"
            />
            {inputQuery && !isStreaming && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isStreaming}
            className="group touch-target p-3.5 bg-kisan-600 hover:bg-kisan-700 active:bg-kisan-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-sm border-2 border-stone-900 shadow-brutal-sm hover:shadow-brutal hover:-translate-y-0.5 active:translate-y-0 active:shadow-none flex items-center justify-center transition-all cursor-pointer"
          >
            <Send className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-2 text-center text-[11px] text-stone-400">
          {t.audioGuide}
        </div>
      </footer>
    </div>
  );
}
