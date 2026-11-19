import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  accentHex?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

function getInitials(name: string): string {
  const parts = name
    .replace(/^Prof\.ª?\s+/i, '')
    .trim()
    .split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  accentHex = '#2563EB',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none`}
        style={{ backgroundColor: accentHex }}
        aria-label={name}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Foto de ${name}`}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${SIZE_CLASSES[size]} rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100`}
    />
  );
};
