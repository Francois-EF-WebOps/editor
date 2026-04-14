import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface HeaderProps {
  uploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Header({ uploading, uploadProgress, uploadError, onUpload }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-theme-line pb-4 bg-white px-4 py-2 border">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-theme-accent"></div>
        <h1 className="text-xl font-black tracking-tighter uppercase">Pipeline.AI</h1>
      </div>
      <div className="flex flex-col items-end gap-1">
        <label htmlFor="video-upload">
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={onUpload}
            disabled={uploading}
          />
          <span
            className={
              buttonVariants({
                variant: 'default',
                className:
                  'bg-theme-accent hover:bg-orange-600 text-white border border-theme-line rounded-none font-bold text-[11px] uppercase h-8 cursor-pointer w-36',
              }) + (uploading ? ' opacity-50 pointer-events-none' : '')
            }
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? `Uploading ${uploadProgress}%` : 'Upload Video'}
          </span>
        </label>
        {uploading && (
          <Progress
            value={uploadProgress}
            className="h-1 w-36 rounded-none border border-theme-line bg-theme-bg [&>div]:bg-theme-accent"
          />
        )}
        {uploadError && (
          <div className="text-[9px] text-red-500 font-bold uppercase mt-1 max-w-xs text-right">
            {uploadError}
          </div>
        )}
      </div>
    </header>
  );
}
