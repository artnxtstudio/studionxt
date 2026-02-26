
import React, { useState, useEffect, useRef } from 'react';
import { Lock, FileText, ArrowRight, Save, Database, Trash2, CheckCircle, Clipboard, Bot, Terminal, Play, Pause, Calendar, RefreshCw, Globe, PenTool, Hash, AlertTriangle, Mail, Phone, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { aiAgentService } from '../services/AiAgentService';
import { webScraperService } from '../services/WebScraperService';
import { opportunityService } from '../services/OpportunityService';
import { Opportunity } from '../types';
import Button from '../components/Button';
import InstagramCardGenerator from '../components/InstagramCardGenerator';

const AgentScanner: React.FC = () => {
  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState('');

  // Tool State
  const [rawText, setRawText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [data, setData] = useState<Partial<Opportunity> | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showInstaGen, setShowInstaGen] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setIsAuthenticated(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPass,
    });
    if (error) {
        setAuthError(error.message);
    } else {
        setIsAuthenticated(true);
    }
  };

  // --- HANDLERS ---

  const handleManualProcess = async () => {
      if (!rawText.trim()) return;
      setIsProcessing(true);
      setSaveStatus('idle');
      
      try {
          const result = await aiAgentService.parseOpportunityText(rawText);
          setData(result);
      } catch (e: any) {
          alert("Error: " + e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleUrlProcess = async () => {
      if (!urlInput.trim()) return;
      setIsProcessing(true);
      setSaveStatus('idle');
      
      try {
          const content = await webScraperService.fetchWithJina(urlInput);
          const result = await aiAgentService.parseOpportunityText(content, urlInput);
          setData(result);
      } catch (e: any) {
          alert("Error: " + e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleManualSave = async () => {
      if (!data) return;
      setSaveStatus('saving');
      
      const payload = {
          ...data,
          lastEditedBy: 'admin' as const
      };

      const res = await opportunityService.createOpportunity(payload);
      if (res.success) {
          setSaveStatus('success');
          setTimeout(() => {
              setSaveStatus('idle');
              setData(null);
              setRawText('');
              setUrlInput('');
          }, 2000);
      } else {
          setSaveStatus('error');
          alert("Database Error: " + res.error);
      }
  };

  const handleFieldChange = (field: keyof Opportunity, value: any) => {
      if (!data) return;
      setData({ ...data, [field]: value });
  };
  
  const handleArrayChange = (field: 'eligibility' | 'requirements', value: string) => {
      if (!data) return;
      const array = value.split('\n').filter(s => s.trim() !== '');
      setData({ ...data, [field]: array });
  };
  
  const handleContactChange = (field: 'email' | 'website' | 'phone', value: string) => {
      if (!data) return;
      setData({ 
          ...data, 
          contact: { 
              ...(data.contact || { email: '', website: '', phone: '' }), 
              [field]: value 
          } 
      });
  };

  // --- LOCK SCREEN ---
  if (!isAuthenticated) {
     return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl p-8 border border-gray-700">
                <div className="text-center mb-6">
                    <Lock className="text-primary mx-auto mb-4" size={32} />
                    <h1 className="text-xl font-bold text-white">Atomik Access</h1>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                    {authError && <div className="text-red-400 text-sm bg-red-900/30 p-2 rounded">{authError}</div>}
                    <input type="email" placeholder="Email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white rounded p-3" />
                    <input type="password" placeholder="Password" value={authPass} onChange={e=>setAuthPass(e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white rounded p-3" />
                    <Button type="submit" fullWidth>Login</Button>
                </form>
                <Link to="/" className="block text-center text-gray-500 mt-4 text-sm">Return Home</Link>
            </div>
        </div>
     );
  }

  // --- MAIN UI ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
         <div className="flex items-center gap-3">
             <Bot className="text-primary" size={24} />
             <h1 className="text-xl font-bold text-gray-900">Atomik Tool</h1>
         </div>
         <div className="flex items-center gap-4">
            <button 
                onClick={async () => { 
                    await supabase.auth.signOut(); 
                    setIsAuthenticated(false); 
                }} 
                className="text-sm text-red-500 font-medium"
            >
                Logout
            </button>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN: INPUTS */}
          <div className="flex flex-col gap-6 h-[calc(100vh-150px)] overflow-y-auto pr-2">
              
              {/* URL INPUT */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
                      <Globe size={18} className="text-gray-500 mr-2" />
                      <h2 className="font-bold text-gray-700">Option A: Paste URL</h2>
                  </div>
                  <div className="p-4 space-y-4">
                      <input 
                          type="text" 
                          className="input" 
                          placeholder="https://example.com/grant-details" 
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                      />
                      <Button 
                          onClick={handleUrlProcess} 
                          fullWidth 
                          disabled={isProcessing || !urlInput}
                          className="py-2"
                      >
                          {isProcessing ? 'Scraping...' : 'Extract from URL'} <ArrowRight size={18} className="ml-2 inline" />
                      </Button>
                  </div>
              </div>

              {/* TEXT INPUT */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-grow flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
                      <Clipboard size={18} className="text-gray-500 mr-2" />
                      <h2 className="font-bold text-gray-700">Option B: Paste Raw Text</h2>
                  </div>
                  
                  <div className="flex-grow p-4 flex flex-col">
                      <textarea 
                          className="flex-grow w-full p-4 border border-gray-200 rounded resize-none focus:outline-none focus:border-primary font-mono text-sm bg-gray-50 min-h-[200px]" 
                          placeholder="Paste website content, email text, or PDF summary here..." 
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                      />
                      <div className="mt-4">
                          <Button 
                              onClick={handleManualProcess} 
                              fullWidth 
                              disabled={isProcessing || !rawText}
                              className="py-2"
                          >
                              {isProcessing ? 'Organizing...' : 'Organize Data'} <ArrowRight size={18} className="ml-2 inline" />
                          </Button>
                      </div>
                  </div>
              </div>
          </div>

          {/* RIGHT COLUMN: STRUCTURED FORM */}
          <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-150px)]">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                      <FileText size={18} className="text-gray-500 mr-2" />
                      <h2 className="font-bold text-gray-700">Review & Publish</h2>
                  </div>
                  <div className="flex items-center gap-2">
                      {data && (
                          <button 
                            onClick={() => setShowInstaGen(true)}
                            className="text-primary hover:text-accent-hover p-1"
                            title="Generate Instagram Card"
                          >
                              <Instagram size={20} />
                          </button>
                      )}
                      {saveStatus === 'success' && <span className="text-green-600 font-bold flex items-center"><CheckCircle size={16} className="mr-1"/> Saved!</span>}
                  </div>
              </div>

              <div className="flex-grow p-6 overflow-y-auto">
                  {!data ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                          <FileText size={64} className="mb-4" />
                          <p>Paste a URL or text to begin.</p>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                              <div>
                                  <label className="label">Title</label>
                                  <input type="text" className="input" value={data.title} onChange={e => handleFieldChange('title', e.target.value)} />
                              </div>
                              <div>
                                  <label className="label">Organizer</label>
                                  <input type="text" className="input" value={data.organizer} onChange={e => handleFieldChange('organizer', e.target.value)} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="label">Deadline (Text)</label>
                                      <input type="text" className="input" value={data.deadline} onChange={e => handleFieldChange('deadline', e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="label">Date (YYYY-MM-DD)</label>
                                      <input type="date" className="input" value={data.deadlineDate} onChange={e => handleFieldChange('deadlineDate', e.target.value)} />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="label">Grant / Prize</label>
                                      <input type="text" className="input" value={data.grantOrPrize} onChange={e => handleFieldChange('grantOrPrize', e.target.value)} />
                                  </div>
                                  <div>
                                      <label className="label">Type</label>
                                      <select className="input" value={data.type} onChange={e => handleFieldChange('type', e.target.value)}>
                                          <option value="Grant">Grant</option>
                                          <option value="Residency">Residency</option>
                                          <option value="Festival">Festival</option>
                                          <option value="Lab">Lab</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <label className="label">Scope</label>
                                      <select className="input" value={data.scope || 'National'} onChange={e => handleFieldChange('scope', e.target.value)}>
                                          <option value="National">National</option>
                                          <option value="International">International</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="label">Category</label>
                                      <input type="text" className="input" value={data.category || ''} onChange={e => handleFieldChange('category', e.target.value)} placeholder="e.g. Documentary Film" />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="label">Application Fee</label>
                                      <input type="text" className="input" value={data.applicationFee || ''} onChange={e => handleFieldChange('applicationFee', e.target.value)} placeholder="e.g. $25 or Free" />
                                  </div>
                                   <div>
                                      <label className="label">Event Dates</label>
                                      <input type="text" className="input" value={data.eventDates || ''} onChange={e => handleFieldChange('eventDates', e.target.value)} placeholder="e.g. Aug 2025" />
                                  </div>
                              </div>
                              <div>
                                  <label className="label">Submission Platform</label>
                                  <input type="text" className="input" value={data.submissionPlatform || ''} onChange={e => handleFieldChange('submissionPlatform', e.target.value)} placeholder="e.g. FilmFreeway, Direct" />
                              </div>
                              
                              {/* CONTACT SECTION */}
                              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                                  <label className="label mb-2">Contact Info</label>
                                  <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                          <Globe size={16} className="text-gray-400" />
                                          <input type="text" className="input" value={data.contact?.website || ''} onChange={e => handleContactChange('website', e.target.value)} placeholder="Website URL" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <Mail size={16} className="text-gray-400" />
                                          <input type="text" className="input" value={data.contact?.email || ''} onChange={e => handleContactChange('email', e.target.value)} placeholder="Email Address" />
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <Phone size={16} className="text-gray-400" />
                                          <input type="text" className="input" value={data.contact?.phone || ''} onChange={e => handleContactChange('phone', e.target.value)} placeholder="Phone Number" />
                                      </div>
                                  </div>
                              </div>

                              <div>
                                  <label className="label">Description</label>
                                  <textarea className="input" rows={4} value={data.description} onChange={e => handleFieldChange('description', e.target.value)} />
                              </div>

                              <div>
                                  <label className="label">Eligibility (One per line)</label>
                                  <textarea 
                                      className="input" 
                                      rows={4} 
                                      value={data.eligibility?.join('\n') || ''} 
                                      onChange={e => handleArrayChange('eligibility', e.target.value)} 
                                      placeholder="e.g. Indian Citizens Only&#10;Short Films&#10;Under 30 mins"
                                  />
                              </div>

                              <div>
                                  <label className="label">Requirements (One per line)</label>
                                  <textarea 
                                      className="input" 
                                      rows={4} 
                                      value={data.requirements?.join('\n') || ''} 
                                      onChange={e => handleArrayChange('requirements', e.target.value)} 
                                      placeholder="e.g. Synopsis&#10;Director Bio&#10;Preview Link"
                                  />
                              </div>

                              <div className="p-3 bg-purple-50 rounded border border-purple-100">
                                  <div className="flex items-center text-purple-700 mb-2">
                                      <Hash size={14} className="mr-1" />
                                      <label className="text-xs font-bold uppercase">AI Instagram Caption</label>
                                  </div>
                                  <textarea 
                                      className="input bg-white text-sm" 
                                      rows={3} 
                                      value={data.instagramCaption} 
                                      onChange={e => handleFieldChange('instagramCaption', e.target.value)} 
                                      placeholder="#Opportunity #ArtGrant"
                                  />
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {data && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                      <Button 
                          onClick={() => setData(null)} 
                          variant="secondary" 
                          className="flex-1 bg-red-100 text-red-600 hover:bg-red-200"
                      >
                          <Trash2 size={18} className="mr-2 inline" /> Discard
                      </Button>
                      <Button 
                          onClick={handleManualSave} 
                          disabled={saveStatus === 'saving'}
                          className={`flex-[2] ${saveStatus === 'error' ? 'bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                          {saveStatus === 'saving' ? 'Saving...' : 'Publish to Database'}
                          <Save size={18} className="ml-2 inline" />
                      </Button>
                  </div>
              )}
          </div>
      </div>
      
      {showInstaGen && data && (
        <InstagramCardGenerator 
          opportunity={data as Opportunity} 
          onClose={() => setShowInstaGen(false)} 
        />
      )}

      <style>{`
        .label { display: block; font-size: 0.75rem; font-weight: 700; color: #6B7280; text-transform: uppercase; margin-bottom: 0.25rem; }
        .input { width: 100%; padding: 0.5rem; border: 1px solid #D1D5DB; border-radius: 0.375rem; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .input:focus { border-color: #F59E0B; ring: 1px solid #F59E0B; }
      `}</style>
    </div>
  );
};

export default AgentScanner;
