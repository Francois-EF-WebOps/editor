import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface StatusBannerProps {
  loading?: boolean;
  error?: string | null;
  message?: string;
}

export default function StatusBanner({ loading, error, message }: StatusBannerProps) {
  if (!loading && !error && !message) return null;

  return (
    <div
      className={`p-3 border flex items-center gap-2 text-[11px] font-bold uppercase ${
        error
          ? 'bg-red-50 border-red-300 text-red-700'
          : loading
            ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
            : 'bg-green-50 border-green-300 text-green-700'
      }`}
    >
      {error ? (
        <>
          <AlertCircle className="w-4 h-4" />
          {error}
        </>
      ) : loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {message || 'Loading...'}
        </>
      ) : (
        message
      )}
    </div>
  );
}
