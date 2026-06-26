import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Phone, Calendar, Image as ImageIcon, X, Save, Sparkles, Smile } from 'lucide-react';

interface EditProfileFormProps {
  onCancel: () => void;
}

// Curated beautiful Unsplash presets to offer instant high-quality choices
const PROFILE_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop'
];

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'
];

export default function EditProfileForm({ onCancel }: EditProfileFormProps) {
  const { user, updateProfile, error, loading } = useAuth();

  if (!user) return null;

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto);
  const [coverPhoto, setCoverPhoto] = useState(user.coverPhoto || '');
  const [dateOfBirth, setDateOfBirth] = useState(user.dateOfBirth || '');
  const [gender, setGender] = useState(user.gender || '');
  
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Profile Name cannot be left blank.');
      return;
    }

    const payload = {
      name,
      bio,
      phone: phone.trim() || undefined,
      profilePhoto,
      coverPhoto: coverPhoto || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined
    };

    const success = await updateProfile(payload);
    if (success) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} id="edit-profile-form" className="bg-white rounded-[2rem] border border-pink-100 overflow-hidden shadow-xl shadow-rose-50/50">
      <div className="bg-rose-50/50 border-b border-pink-100 p-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-500" />
            Edit Profile Credentials
          </h3>
          <p className="text-xs text-rose-400 font-medium">Update your digital Jolshaa presence cards.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Error notification */}
        {(formError || error) && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-xs text-red-800 font-medium">
            {formError || error}
          </div>
        )}

        {/* Name and Bio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block" htmlFor="edit-name">
              Full Name *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block" htmlFor="edit-phone">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                <Phone className="h-4 w-4" />
              </span>
              <input
                type="tel"
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Bio Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-600 block" htmlFor="edit-bio">
            Short Biography
          </label>
          <textarea
            id="edit-bio"
            rows={3}
            placeholder="Tell us something interesting about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all resize-none"
          />
        </div>

        {/* Interactive Presets for Profile Photos */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 block">
            Select Profile Photo Preset
          </label>
          <div className="flex flex-wrap gap-3">
            {PROFILE_AVATAR_PRESETS.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setProfilePhoto(preset)}
                className={`relative rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                  profilePhoto === preset ? 'border-rose-500 ring-2 ring-rose-200 scale-105' : 'border-slate-100 hover:scale-105'
                }`}
              >
                <img src={preset} alt={`Preset ${index}`} className="w-12 h-12 object-cover" />
              </button>
            ))}
          </div>
          {/* Custom Avatar URL input */}
          <div className="pt-2 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
              <ImageIcon className="h-4 w-4" />
            </span>
            <input
              type="url"
              placeholder="Or paste a custom Profile Photo URL..."
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Interactive Presets for Cover Banner */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 block">
            Select Cover Banner Preset
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COVER_PRESETS.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCoverPhoto(preset)}
                className={`relative h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  coverPhoto === preset ? 'border-rose-500 scale-105 ring-2 ring-rose-200' : 'border-slate-100 hover:opacity-85'
                }`}
              >
                <img src={preset} alt={`Cover Preset ${index}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          {/* Custom Cover URL input */}
          <div className="pt-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
              <ImageIcon className="h-4 w-4" />
            </span>
            <input
              type="url"
              placeholder="Or paste a custom Cover Image URL..."
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date of Birth */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block" htmlFor="edit-dob">
              Date of Birth
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                id="edit-dob"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-pink-50/30 border border-pink-100 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">
              Gender Identity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Male', 'Female', 'Other'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer ${
                    gender === g
                      ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold ring-1 ring-rose-500'
                      : 'bg-pink-50/30 border-pink-100 text-slate-600 hover:bg-pink-100/50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save action bar */}
      <div className="bg-rose-50/30 border-t border-pink-100 px-6 py-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2 border border-pink-100 rounded-full text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          id="save-profile-btn"
          disabled={loading}
          className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-200 hover:shadow-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
