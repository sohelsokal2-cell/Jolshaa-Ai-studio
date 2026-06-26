import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Album } from '../types.ts';
import { Plus, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileAlbums({ userId }: { userId: string }) {
  const { token, user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAlbums = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/albums/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        setAlbums((await res.json()).albums || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, [userId, token]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !token) return;
    setCreating(true);
    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: newTitle })
      });
      if (res.ok) {
        setShowCreate(false);
        setNewTitle('');
        fetchAlbums();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, albumId: string) => {
    if (!e.target.files || e.target.files.length === 0 || !token) return;
    setUploadingTo(albumId);
    
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('photos', e.target.files[i]);
    }

    try {
      const res = await fetch(`/api/albums/${albumId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        fetchAlbums();
        if (activeAlbum && activeAlbum.id === albumId) {
          setActiveAlbum((await res.json()).album);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingTo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-rose-500" /></div>;

  const isMyProfile = user?.id === userId;

  if (activeAlbum) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setActiveAlbum(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800 mb-2 transition-colors">
              ← Back to Albums
            </button>
            <h2 className="text-xl font-black text-slate-800">{activeAlbum.title}</h2>
            <p className="text-xs text-slate-500">{activeAlbum.photos?.length || 0} Photos</p>
          </div>
          {isMyProfile && (
            <div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingTo === activeAlbum.id}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-2"
              >
                {uploadingTo === activeAlbum.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Add Photos</>}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={(e) => handleFileUpload(e, activeAlbum.id)} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {activeAlbum.photos?.map((url, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden cursor-pointer group relative" onClick={() => setLightboxPhoto(url)}>
              <img src={url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
          {(!activeAlbum.photos || activeAlbum.photos.length === 0) && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm font-bold bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
              No photos in this album yet.
            </div>
          )}
        </div>

        <AnimatePresence>
          {lightboxPhoto && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
              onClick={() => setLightboxPhoto(null)}
            >
              <button onClick={() => setLightboxPhoto(null)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
              <img src={lightboxPhoto} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">Photo Albums</h2>
        {isMyProfile && (
          <button 
            onClick={() => setShowCreate(true)}
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm shadow-rose-200"
          >
            <Plus className="h-4 w-4" /> Create Album
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {albums.map(album => (
          <div key={album.id} onClick={() => setActiveAlbum(album)} className="group cursor-pointer">
            <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden mb-2 relative border border-slate-200 shadow-sm">
              {album.photos && album.photos.length > 0 ? (
                <img src={album.photos[album.photos.length - 1]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
            <h3 className="font-bold text-slate-800 truncate">{album.title}</h3>
            <p className="text-[10px] font-bold text-slate-400">{album.photos?.length || 0} items</p>
          </div>
        ))}
      </div>
      
      {albums.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
          No albums yet.
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-black text-slate-800 mb-4">Create New Album</h3>
            <form onSubmit={handleCreateAlbum}>
              <input 
                type="text" 
                placeholder="Album Title" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-200 mb-6 bg-slate-50"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-full text-slate-600 font-bold hover:bg-slate-100 text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!newTitle.trim() || creating} className="px-5 py-2.5 rounded-full text-white bg-rose-500 hover:bg-rose-600 font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />} Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
