import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ProfileAvatarUploadProps {
  imgClassName?: string;
  containerClassName?: string;
  badgeClassName?: string;
  fallbackUrl?: string;
}

export const ProfileAvatarUpload: React.FC<ProfileAvatarUploadProps> = ({
  imgClassName = 'w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-400',
  containerClassName = 'relative group cursor-pointer shrink-0',
  badgeClassName = 'absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white border border-white flex items-center justify-center shadow-xs group-hover:bg-emerald-500 transition-colors',
  fallbackUrl = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80'
}) => {
  const { currentPersona, updateCurrentUserAvatar } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleTriggerClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await updateCurrentUserAvatar(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      onClick={handleTriggerClick}
      className={containerClassName}
      title="Click to upload profile photo"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <img
        src={currentPersona.avatar || fallbackUrl}
        alt={currentPersona.name}
        className={imgClassName}
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 rounded-xl bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        {!isUploading && <Camera className="w-4 h-4 text-white" />}
      </div>

      {/* Uploading Spinner State */}
      {isUploading && (
        <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" />
        </div>
      )}

      {/* Persistent Camera Icon Badge */}
      <span className={badgeClassName}>
        {isUploading ? (
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
        ) : (
          <Camera className="w-2.5 h-2.5" />
        )}
      </span>
    </div>
  );
};
