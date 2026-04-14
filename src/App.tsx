import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/src/components/Header';
import SearchPanel from '@/src/components/SearchPanel';
import VideoLibrary from '@/src/components/VideoLibrary';
import VideoPlayer from '@/src/components/VideoPlayer';
import TranscriptViewer from '@/src/components/TranscriptViewer';
import StatusBanner from '@/src/components/StatusBanner';
import type { VideoRecord, SearchResult } from '@/src/types';

export default function App() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeVideoFilename, setActiveVideoFilename] = useState<string | null>(null);
  const [clipStart, setClipStart] = useState(0);
  const [clipEnd, setClipEnd] = useState(0);
  const [clipping, setClipping] = useState(false);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [clipJobId, setClipJobId] = useState<string | null>(null);
  const [clipJobStatus, setClipJobStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'uploaded' | 'indexing' | 'indexed'>(
    'all',
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch videos on mount + poll for indexing status
  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll clip job status
  useEffect(() => {
    if (!clipJobId || clipJobStatus === 'completed' || clipJobStatus === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/clip/${clipJobId}`);
        const data = await res.json();
        setClipJobStatus(data.status);
        if (data.status === 'completed') {
          setClipUrl(data.clipUrl);
          setClipping(false);
        } else if (data.status === 'failed') {
          setClipping(false);
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [clipJobId, clipJobStatus]);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/videos');
      if (!res.ok) {
        setApiError(`Failed to fetch videos: ${res.status}`);
        return;
      }
      setApiError(null);
      const data = await res.json();
      setVideos(data.videos);
    } catch {
      setApiError('Network error while fetching videos');
    }
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('video', file);

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded * 100) / event.total));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`Server error ${xhr.status}: ${xhr.responseText}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      // Trigger indexing
      const indexRes = await fetch(`/api/videos/${data.video.id}/index`, { method: 'POST' });
      if (!indexRes.ok) {
        const text = await indexRes.text();
        throw new Error(`Indexing failed: ${indexRes.status} ${text}`);
      }
      await fetchVideos();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }
      const data = await res.json();
      setSearchResults(data.results);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setSearchError(message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResultClick = useCallback((result: SearchResult) => {
    setActiveVideo(result.videoId);
    setActiveVideoFilename(result.videoFilename);
    setClipStart(result.start);
    setClipEnd(result.end);

    if (videoRef.current) {
      videoRef.current.src = `/uploads/${result.videoFilename}`;
      videoRef.current.currentTime = result.start;
      videoRef.current.play();
    }
  }, []);

  const handleVideoSelect = useCallback((video: VideoRecord) => {
    setActiveVideo(video.id);
    setActiveVideoFilename(video.filename);
    setClipStart(0);
    setClipEnd(0);
    setClipUrl(null);
    setClipJobId(null);
    setClipJobStatus(null);
  }, []);

  const handleTimestampClick = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  }, []);

  const handleGenerateClip = async () => {
    if (!activeVideo) return;

    setClipping(true);
    setClipUrl(null);
    setClipJobId(null);
    setClipJobStatus(null);

    try {
      const res = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: activeVideo,
          start: clipStart,
          end: clipEnd,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setClipJobId(data.jobId);
        setClipJobStatus(data.status);
      } else {
        throw new Error(data.error || 'Clip generation failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Clipping failed';
      setClipping(false);
      setClipJobStatus('failed');
    }
  };

  const handleVideoReady = useCallback((el: HTMLVideoElement) => {
    videoRef.current = el;
  }, []);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-ink p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <Header
          uploading={uploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          onUpload={handleUpload}
        />

        {apiError && <StatusBanner error={apiError} />}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column: Library & Search */}
          <div className="space-y-4 lg:col-span-1">
            <SearchPanel
              searchQuery={searchQuery}
              searchResults={searchResults}
              onQueryChange={setSearchQuery}
              onSearch={handleSearch}
              onResultClick={handleResultClick}
            />
            <StatusBanner loading={searchLoading} error={searchError} />
            <VideoLibrary
              videos={videos}
              statusFilter={statusFilter}
              activeVideo={activeVideo}
              onFilterChange={setStatusFilter}
              onVideoSelect={handleVideoSelect}
            />
          </div>

          {/* Middle Column: Player & Clipping */}
          <div className="lg:col-span-2 space-y-4">
            <VideoPlayer
              activeVideo={activeVideo}
              activeVideoFilename={activeVideoFilename}
              videos={videos}
              clipStart={clipStart}
              clipEnd={clipEnd}
              clipping={clipping}
              clipJobId={clipJobId}
              clipJobStatus={clipJobStatus}
              clipUrl={clipUrl}
              onClipStartChange={setClipStart}
              onClipEndChange={setClipEnd}
              onGenerateClip={handleGenerateClip}
              onVideoReady={handleVideoReady}
            />
          </div>

          {/* Right Column: Index Data */}
          <div className="space-y-4 lg:col-span-1">
            <TranscriptViewer
              activeVideo={activeVideo}
              videos={videos}
              onTimestampClick={handleTimestampClick}
            />
          </div>
        </div>

        <footer className="border-t border-theme-line py-2 flex items-center justify-between text-[9px] font-mono uppercase">
          <div>
            <span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full inline-block mr-1"></span>
            SYSTEM READY
          </div>
          <div>STORAGE: LOCAL / UPLOADS</div>
          <div>API: v3.0.0</div>
        </footer>
      </div>
    </div>
  );
}
