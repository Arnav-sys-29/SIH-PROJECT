import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Search,
  Globe,
  Database,
  Users,
  Clock,
  ArrowLeft,
  RefreshCw,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileText,
  Download,
  Languages,
  Layers,
  Sparkles,
  Eye,
  X
} from 'lucide-react';

export default function AdminDashboard({ onBackToChat }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'portals' | 'logs'
  const [overview, setOverview] = useState(null);
  const [portals, setPortals] = useState([]);
  const [logsData, setLogsData] = useState({ total: 0, logs: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters for Audit Logs
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inspector Modal state
  const [inspectedLog, setInspectedLog] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [overviewRes, portalsRes, logsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/admin/analytics/overview`),
        fetch(`${BACKEND_URL}/admin/analytics/portals`),
        fetch(
          `${BACKEND_URL}/admin/analytics/logs?category=${encodeURIComponent(
            selectedCategory
          )}&language=${encodeURIComponent(selectedLanguage)}&search=${encodeURIComponent(
            searchQuery
          )}`
        ),
      ]);

      if (overviewRes.ok) {
        setOverview(await overviewRes.json());
      }
      if (portalsRes.ok) {
        const pData = await portalsRes.json();
        setPortals(pData.portals || []);
      }
      if (logsRes.ok) {
        setLogsData(await logsRes.json());
      }
    } catch (err) {
      console.error('Error fetching admin telemetry data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedLanguage, searchQuery]);

  const handleExportCSV = () => {
    if (!logsData.logs || logsData.logs.length === 0) return;
    const headers = ['ID,Timestamp,User Phone,Category,Language,Status,Latency (ms),Query,Portals Visited'];
    const rows = logsData.logs.map((log) => {
      const portals = (log.portals_visited || []).map((p) => p.domain).join('; ');
      return `"${log.id}","${log.timestamp}","${log.user_phone}","${log.category}","${log.language}","${log.status}","${log.response_latency_ms}","${(log.query || '').replace(/"/g, '""')}","${portals}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `seva_ai_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'PMFBY Crop Insurance':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Ministry of Cooperation Schemes':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Financial Literacy & KCC':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Cooperative Grievance Redressal':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Cooperative Laws & By-laws':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Out of Scope (Guardrail Blocked)':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') { // Simple valid password
      setIsAuthenticated(true);
    } else {
      setPasswordError('Invalid credentials. Please try again.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-earth-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white border-2 border-stone-900 shadow-brutal p-6 sm:p-8 rounded-sm animate-pop-in space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-hopeBlue-600 rounded-sm flex items-center justify-center border-2 border-stone-900 shadow-brutal-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 leading-tight">Admin Authentication</h2>
              <p className="text-xs text-stone-500 mt-1">Please enter your credentials to access the Nodal Command Center.</p>
            </div>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                placeholder="Enter password (admin123)"
                className="w-full px-4 py-2 bg-stone-50 border-2 border-stone-900 rounded-sm text-sm text-stone-900 focus:outline-none focus:shadow-brutal-sm transition"
              />
              {passwordError && <p className="text-xs text-red-500 font-semibold">{passwordError}</p>}
            </div>
            <button
              type="submit"
              className="w-full bg-hopeBlue-600 hover:bg-hopeBlue-500 text-white font-bold py-2 px-4 rounded-sm border-2 border-stone-900 shadow-brutal hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
            >
              Secure Login
            </button>
          </form>
          
          <button
            onClick={onBackToChat}
            className="w-full flex justify-center items-center gap-2 text-xs font-bold text-stone-500 hover:text-stone-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Farmer Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50 text-stone-800 font-sans flex flex-col">
      {/* Top Command Navigation */}
      <header className="bg-white border-b-2 border-stone-900 sticky top-0 z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 transition text-xs font-bold border-2 border-stone-900 shadow-brutal-sm hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Farmer Chat
          </button>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-hopeBlue-600 flex items-center justify-center border-2 border-hopeBlue-900 shadow-brutal-sm animate-pop-in">
              <Shield className="w-4 h-4 text-white animate-bounce-subtle" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-stone-900 tracking-wide">S.E.V.A AI Nodal Command Center</h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Telemetry
                </span>
              </div>
              <p className="text-[11px] text-stone-500">Specialized Personnel & Nodal Officer Audit Platform</p>
            </div>
          </div>
        </div>

        {/* Action Controls & Tab Switching */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex bg-white p-1 rounded-sm border-2 border-stone-900 shadow-brutal-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition hover:-translate-y-0.5 ${
                activeTab === 'overview'
                  ? 'bg-hopeBlue-600 text-white shadow-brutal-sm border-2 border-stone-900'
                  : 'text-stone-500 hover:text-stone-900 border-2 border-transparent'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('portals')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition hover:-translate-y-0.5 ${
                activeTab === 'portals'
                  ? 'bg-hopeBlue-600 text-white shadow-brutal-sm border-2 border-stone-900'
                  : 'text-stone-500 hover:text-stone-900 border-2 border-transparent'
              }`}
            >
              Gov Portals Visited
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition hover:-translate-y-0.5 ${
                activeTab === 'logs'
                  ? 'bg-hopeBlue-600 text-white shadow-brutal-sm border-2 border-stone-900'
                  : 'text-stone-500 hover:text-stone-900 border-2 border-transparent'
              }`}
            >
              Audit Logs ({logsData.total || 0})
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 rounded-sm bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 transition border-2 border-stone-900 shadow-brutal-sm hover:-translate-y-0.5"
            title="Refresh Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-hopeBlue-600 hover:bg-hopeBlue-500 text-white transition text-xs font-bold border-2 border-hopeBlue-900 shadow-brutal-sm hover:-translate-y-0.5"
          >
            <Download className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
            Export CSV
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-stone-500">Loading live telemetry and portal metrics...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards Ribbon (Always Visible) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-2 border-stone-900 rounded-sm p-5 shadow-brutal relative overflow-hidden group hover:-translate-y-1 transition">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-emerald-400">
                  <Activity className="w-16 h-16" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Total Queries Handled</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-stone-900">{overview?.total_queries || 0}</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +100% Verified
                  </span>
                </div>
                <p className="text-[11px] font-medium text-stone-500 mt-2">Active farmer interactions processed</p>
              </div>

              <div className="bg-white border-2 border-stone-900 rounded-sm p-5 shadow-brutal relative overflow-hidden group hover:-translate-y-1 transition">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-blue-400">
                  <Globe className="w-16 h-16" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Official Gov Citations</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-stone-900">{overview?.verified_gov_searches || 0}</span>
                  <span className="text-xs font-bold text-blue-400">.gov.in / .nic.in</span>
                </div>
                <p className="text-[11px] font-medium text-stone-500 mt-2">Authenticated portal references</p>
              </div>

              <div className="bg-white border-2 border-stone-900 rounded-sm p-5 shadow-brutal relative overflow-hidden group hover:-translate-y-1 transition">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-amber-400">
                  <Clock className="w-16 h-16" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Avg Response Latency</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-stone-900">{overview?.avg_latency_ms || 1150} ms</span>
                  <span className="text-xs font-bold text-emerald-400">Low-Latency SSE</span>
                </div>
                <p className="text-[11px] font-medium text-stone-500 mt-2">Fast streaming token delivery</p>
              </div>

              <div className="bg-white border-2 border-stone-900 rounded-sm p-5 shadow-brutal relative overflow-hidden group hover:-translate-y-1 transition">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition text-purple-400">
                  <Shield className="w-16 h-16" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Guardrail Compliance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-stone-900">{overview?.guardrail_compliance_rate || '99.4%'}</span>
                  <span className="text-xs font-bold text-purple-400">5 Strict Domains</span>
                </div>
                <p className="text-[11px] font-medium text-stone-500 mt-2">Zero hallucinations & out-of-scope filter</p>
              </div>
            </div>

            {/* TAB 1: OVERVIEW & ANALYTICS */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Domain Categories Distribution */}
                <div className="lg:col-span-2 bg-white border-2 border-stone-900 rounded-sm p-6 shadow-brutal space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-base font-bold text-stone-900">Query Domain Breakdown</h2>
                    </div>
                    <span className="text-xs text-stone-500">5 Core Governance Domains</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {overview?.category_distribution &&
                      Object.entries(overview.category_distribution).map(([cat, count]) => {
                        const pct = Math.round((count / (overview.total_queries || 1)) * 100);
                        return (
                          <div key={cat} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-stone-800">{cat}</span>
                              <span className="text-stone-500 font-mono">
                                {count} queries ({pct}%)
                              </span>
                            </div>
                            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  cat.includes('PMFBY')
                                    ? 'bg-emerald-500'
                                    : cat.includes('Ministry')
                                    ? 'bg-blue-500'
                                    : cat.includes('Financial')
                                    ? 'bg-amber-500'
                                    : cat.includes('Grievance')
                                    ? 'bg-purple-500'
                                    : cat.includes('Laws')
                                    ? 'bg-teal-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.max(pct, 8)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Regional Languages Breakdown & Top Gov Portals */}
                <div className="space-y-6">
                  {/* Languages Card */}
                  <div className="bg-white border-2 border-stone-900 rounded-sm p-5 shadow-brutal space-y-3">
                    <div className="flex items-center gap-2">
                      <Languages className="w-5 h-5 text-amber-400" />
                      <h2 className="text-sm font-bold text-stone-900">Multilingual Ingestion</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {overview?.language_distribution &&
                        Object.entries(overview.language_distribution).map(([lang, count]) => (
                          <div
                            key={lang}
                            className="bg-stone-50 border-2 border-stone-200 rounded-sm p-2.5 flex items-center justify-between hover:-translate-y-0.5 transition hover:shadow-brutal-sm"
                          >
                            <span className="text-xs font-bold text-stone-700">{lang}</span>
                            <span className="text-xs font-extrabold text-emerald-400 px-2 py-0.5 rounded-sm bg-emerald-500/10 border-2 border-emerald-500/20 font-mono">
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Top Cited Official Portals */}
                  <div className="bg-white border-2 border-stone-900 rounded-sm p-5 shadow-brutal space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      <h2 className="text-sm font-bold text-stone-900">Top Visited Portals</h2>
                    </div>
                    <div className="space-y-2 pt-1">
                      {overview?.top_visited_domains?.map((d) => (
                        <div
                          key={d.domain}
                          className="flex items-center justify-between p-2 rounded-sm bg-stone-50 border-2 border-stone-200 text-xs hover:-translate-y-0.5 transition hover:shadow-brutal-sm"
                        >
                          <span className="font-mono text-emerald-300 font-bold">{d.domain}</span>
                          <span className="text-stone-500 font-mono font-bold">{d.count} hits</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: GOVERNMENT PORTALS DETAILED INTELLIGENCE */}
            {activeTab === 'portals' && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-stone-900 rounded-sm p-4 flex items-center justify-between shadow-brutal-sm">
                  <div>
                    <h2 className="text-base font-bold text-stone-900">Official Government Portals Verification Matrix</h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      All live searches performed by S.E.V.A AI are hardcoded with domain restrictions (`site:gov.in OR site:nic.in`).
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                    100% Authentic Government Endpoints
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portals.map((portal) => (
                    <div
                      key={portal.domain}
                      className="bg-white border-2 border-stone-900 rounded-sm p-5 shadow-brutal flex flex-col justify-between space-y-4 hover:-translate-y-1 transition hover:border-emerald-500/50"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">
                              {portal.authority}
                            </span>
                            <h3 className="text-sm font-bold text-stone-900 pt-1">{portal.name}</h3>
                          </div>
                          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                            {portal.query_citations_count} Citations
                          </span>
                        </div>

                        <p className="text-xs text-stone-700 leading-relaxed font-mono text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
                          {portal.domain}
                        </p>

                        <p className="text-xs text-stone-500 leading-relaxed">
                          <strong className="text-stone-700">Covers:</strong> {portal.focus}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {portal.avg_response_time}
                        </span>
                        <a
                          href={`https://${portal.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition"
                        >
                          Visit Portal <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: LIVE QUERY AUDIT LOGS & INSPECTOR */}
            {activeTab === 'logs' && (
              <div className="bg-white border-2 border-stone-900 rounded-sm shadow-brutal overflow-hidden space-y-4 p-5">
                {/* Search & Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-slate-900">
                  <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <div className="relative w-full max-w-md">
                      <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search queries, domains, or answers..."
                        className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-stone-200 rounded-sm text-xs text-stone-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:shadow-brutal-sm transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Filter */}
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-stone-500" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-white border-2 border-stone-200 rounded-sm px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-emerald-500 focus:shadow-brutal-sm transition"
                      >
                        <option value="All">All Domains</option>
                        <option value="PMFBY Crop Insurance">PMFBY Crop Insurance</option>
                        <option value="Ministry of Cooperation Schemes">Ministry of Cooperation</option>
                        <option value="Financial Literacy & KCC">Financial Literacy & KCC</option>
                        <option value="Cooperative Grievance Redressal">Grievance Redressal</option>
                        <option value="Cooperative Laws & By-laws">Cooperative Laws</option>
                        <option value="Out of Scope (Guardrail Blocked)">Out of Scope</option>
                      </select>
                    </div>

                    {/* Language Filter */}
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="bg-white border-2 border-stone-200 rounded-sm px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-emerald-500 focus:shadow-brutal-sm transition"
                    >
                      <option value="All">All Languages</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Bengali">Bengali</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                  </div>
                </div>

                {/* Logs Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 text-stone-500 border-b border-slate-700 font-semibold">
                        <th className="py-3 px-3">Timestamp</th>
                        <th className="py-3 px-3">Farmer / Session</th>
                        <th className="py-3 px-3">Query Question</th>
                        <th className="py-3 px-3">Domain Category</th>
                        <th className="py-3 px-3">Language</th>
                        <th className="py-3 px-3">Portals Visited</th>
                        <th className="py-3 px-3">Latency</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {logsData.logs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-stone-500">
                            No queries match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        logsData.logs.map((log) => (
                          <tr
                            key={log.id}
                            className="hover:bg-earth-100/50 transition cursor-pointer group"
                            onClick={() => setInspectedLog(log)}
                          >
                            <td className="py-3 px-3 font-mono text-stone-500 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-3 font-medium text-stone-700 whitespace-nowrap">
                              {log.user_phone}
                            </td>
                            <td className="py-3 px-3 text-stone-900 max-w-xs truncate font-medium">
                              {log.query}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryColor(
                                  log.category
                                )}`}
                              >
                                {log.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-stone-700">
                              {log.language}
                            </td>
                            <td className="py-3 px-3">
                              {log.portals_visited && log.portals_visited.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {log.portals_visited.map((p, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono text-[10px]"
                                    >
                                      {p.domain}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">None</span>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-stone-500">
                              {log.response_latency_ms}ms
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInspectedLog(log);
                                }}
                                className="px-2.5 py-1 rounded-sm border-2 border-slate-700 bg-slate-800 hover:bg-emerald-600 text-stone-800 hover:text-stone-900 transition text-[11px] font-bold inline-flex items-center gap-1 hover:shadow-brutal-sm hover:-translate-y-0.5"
                              >
                                <Eye className="w-3 h-3" /> Inspect
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Query Detail Inspector Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-slate-900 rounded-sm max-w-2xl w-full p-6 space-y-5 shadow-brutal relative animate-pop-in">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getCategoryColor(
                    inspectedLog.category
                  )}`}
                >
                  {inspectedLog.category}
                </span>
                <h3 className="text-base font-bold text-stone-900 pt-1">Query Audit Inspection</h3>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="p-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-stone-500 hover:text-stone-900 transition border-2 border-slate-700 hover:shadow-brutal-sm hover:-translate-y-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Question */}
              <div className="bg-stone-50 p-3.5 rounded-sm border-2 border-stone-200 space-y-1">
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Farmer Query</p>
                <p className="text-sm font-medium text-stone-900">{inspectedLog.query}</p>
                <div className="flex gap-4 pt-2 text-[11px] text-stone-500 font-mono">
                  <span>Language: {inspectedLog.language}</span>
                  <span>Session: {inspectedLog.user_phone}</span>
                  <span>Latency: {inspectedLog.response_latency_ms}ms</span>
                </div>
              </div>

              {/* Verified Sources Retrieved */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  Verified Government Portals Accessed ({inspectedLog.portals_visited?.length || 0})
                </p>
                {inspectedLog.portals_visited && inspectedLog.portals_visited.length > 0 ? (
                  <div className="space-y-1.5">
                    {inspectedLog.portals_visited.map((p, idx) => (
                      <div
                        key={idx}
                        className="bg-stone-50 p-2.5 rounded-sm border-2 border-stone-200 flex items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5 truncate">
                          <p className="font-semibold text-emerald-300 truncate">{p.title || p.domain}</p>
                          <p className="text-[11px] text-stone-500 font-mono truncate">{p.url || p.domain}</p>
                        </div>
                        {p.url && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-stone-500 hover:text-emerald-400 transition shrink-0 p-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic p-2 bg-slate-950/40 rounded">
                    No external portal search required for this query.
                  </p>
                )}
              </div>

              {/* AI Response Output */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">AI Synthesized Response</p>
                <div className="bg-stone-50 p-3.5 rounded-sm border-2 border-stone-200 text-stone-800 leading-relaxed max-h-48 overflow-y-auto">
                  {inspectedLog.answer_snippet || 'No answer recorded.'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-1.5 rounded-sm bg-slate-800 hover:bg-slate-700 text-stone-800 font-bold border-2 border-slate-700 shadow-brutal-sm hover:-translate-y-0.5 text-xs transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
