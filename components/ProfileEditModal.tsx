import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X } from 'lucide-react';

interface UserProfile {
  displayName: string;
  username: string;
  avatar: string | null; // Base64 string
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  currentProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  currentProfile,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(currentProfile.displayName);
  const [username, setUsername] = useState(currentProfile.username);
  const [avatar, setAvatar] = useState<string | null>(currentProfile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDisplayName(currentProfile.displayName);
      setUsername(currentProfile.username);
      setAvatar(currentProfile.avatar);
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      displayName,
      username,
      avatar,
    });
    onClose();
  };

  // Default Initials if no display name
  const initials = (displayName || userEmail || 'U').substring(0, 2).toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18181b] w-full max-w-[400px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-white/10 relative flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Chỉnh sửa hồ sơ</h2>
             {/* Note: The design usually doesn't have a close X top right, but handles via Cancel button. keeping clean. */}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-6">
            
            {/* Avatar Section */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border-4 border-white dark:border-[#18181b] shadow-lg bg-[#b49256] text-white text-3xl font-medium select-none">
                    {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <span>{initials}</span>
                    )}
                </div>
                
                {/* Camera Icon Button */}
                <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:text-blue-600 transition-colors">
                    <Camera size={16} />
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            {/* Inputs */}
            <div className="w-full space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Tên hiển thị</label>
                    <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Nhập tên hiển thị"
                    />
                </div>

                <div className="space-y-1.5">
                     <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">Tên người dùng</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        placeholder="Nhập tên người dùng"
                    />
                </div>
            </div>

            {/* Footer Text */}
            <p className="text-xs text-center text-slate-400 dark:text-slate-500 leading-relaxed px-2">
                Hồ sơ của bạn giúp người khác nhận ra bạn. Tên và tên người dùng của bạn cũng được sử dụng trong ứng dụng k-ite.
            </p>
        </div>

        {/* Actions Footer */}
        <div className="p-6 pt-2 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
            >
                Hủy
            </button>
            <button 
                onClick={handleSave}
                className="px-5 py-2.5 rounded-full text-sm font-medium text-white bg-black dark:bg-white dark:text-black hover:opacity-80 transition-opacity shadow-sm"
            >
                Lưu
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
