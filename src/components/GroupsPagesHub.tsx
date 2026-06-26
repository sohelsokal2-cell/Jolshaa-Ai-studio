import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Users, FileText, Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import { Group, Page } from '../types.ts';
import GroupView from './GroupView.tsx';
import PageView from './PageView.tsx';

export default function GroupsPagesHub() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'groups' | 'pages'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingGroup, setViewingGroup] = useState<string | null>(null);
  const [viewingPage, setViewingPage] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [privacy, setPrivacy] = useState<'public'|'private'>('public');

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [gRes, pRes] = await Promise.all([
        fetch('/api/groups', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/pages', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (gRes.ok) setGroups((await gRes.json()).groups || []);
      if (pRes.ok) setPages((await pRes.json()).pages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, activeTab]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, description: desc, privacy })
      });
      if (res.ok) {
        setShowCreateGroup(false);
        setName(''); setDesc(''); setPrivacy('public');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, description: desc })
      });
      if (res.ok) {
        setShowCreatePage(false);
        setName(''); setDesc('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (viewingGroup) return <GroupView groupId={viewingGroup} onBack={() => setViewingGroup(null)} />;
  if (viewingPage) return <PageView pageId={viewingPage} onBack={() => setViewingPage(null)} />;

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="bg-white rounded-[2rem] border border-pink-50 shadow-sm p-4 flex gap-4">
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'groups' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users className="h-5 w-5" /> Groups
        </button>
        <button
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pages' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <FileText className="h-5 w-5" /> Pages
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-rose-500" /></div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-black text-slate-800">
              {activeTab === 'groups' ? 'Discover Groups' : 'Discover Pages'}
            </h2>
            <button
              onClick={() => activeTab === 'groups' ? setShowCreateGroup(true) : setShowCreatePage(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTab === 'groups' && groups.map(g => (
              <div key={g.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-8 w-8 text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{g.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{g.description || 'No description'}</p>
                  <p className="text-[10px] text-slate-400 mt-1 capitalize">{g.privacy} • {g.members?.length || 0} Members</p>
                </div>
                <button
                  onClick={() => setViewingGroup(g.id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-bold transition-colors"
                >
                  View
                </button>
              </div>
            ))}
            
            {activeTab === 'pages' && pages.map(p => (
              <div key={p.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{p.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{p.description || 'No description'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{p.followers?.length || 0} Followers</p>
                </div>
                <button
                  onClick={() => setViewingPage(p.id)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-bold transition-colors"
                >
                  View
                </button>
              </div>
            ))}
          </div>

          {(activeTab === 'groups' && groups.length === 0) || (activeTab === 'pages' && pages.length === 0) ? (
             <div className="text-center py-10 text-slate-500 text-sm">No {activeTab} found. Create one!</div>
          ) : null}
        </div>
      )}

      {/* CREATE MODALS */}
      {(showCreateGroup || showCreatePage) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-black text-slate-800 mb-6">
              Create {showCreateGroup ? 'Group' : 'Page'}
            </h2>
            <form onSubmit={showCreateGroup ? handleCreateGroup : handleCreatePage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Name</label>
                <input 
                  type="text" 
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Description</label>
                <textarea 
                  value={desc} onChange={e => setDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>
              {showCreateGroup && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Privacy</label>
                  <select 
                    value={privacy} onChange={e => setPrivacy(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    <option value="public">Public - Anyone can join</option>
                    <option value="private">Private - Needs approval</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowCreateGroup(false); setShowCreatePage(false); }}
                  className="px-5 py-2.5 rounded-full text-slate-600 font-bold text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
