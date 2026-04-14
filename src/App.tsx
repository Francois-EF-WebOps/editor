import React, { useState, useEffect, useRef } from 'react';
import { Upload, Search, Play, Scissors, Loader2, CheckCircle2, Download } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VideoRecord {
  id: string;
  filename: string;
  originalName: string;
  status: 'uploaded' | 'indexing' | 'indexed';
  indexingProgress?: {
    step: string;
    percent: number;
  };
  indexData?: {
    transcripts: { text: string; start: number; end: number }[];
    objects: { label: string; start: number; end: number }[];
    scenes: { description: string; start: number; end: number }[];
  };
}

interface SearchResult {
  videoId: string;
  videoFilename: string;
  type: 'transcript' | 'object' | 'scene';
  match: string;
  start: number;
  end: number;
}

export default function App() {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeVideoFilename, setActiveVideoFilename] = useState<string | null>(null);
  const [clipStart, setClipStart] = useState<number>(0);
  const [clipEnd, setClipEnd] = useState<number>(0);
  const [clipping, setClipping] = useState(false);
  const [clipUrl, setClipUrl] = useState<string | null>(null);

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'uploaded' | 'indexing' | 'indexed'>('all');

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchVideos();
    const interval = setInterval(fetchVideos, 1000); // Poll for indexing status (faster for progress bar)
    return () => clearInterval(interval);
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      setVideos(data.videos);
    } catch (err) {
      console.error('Failed to fetch videos', err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const chunkSize = 1024 * 1024; // 1MB chunks to bypass Nginx 413 limits
      const totalChunks = Math.ceil(file.size / chunkSize);
      const uploadId = crypto.randomUUID();
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('originalName', file.name);

        const res = await fetch('/api/upload-chunk', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Chunk upload failed: ${res.status} ${text}`);
        }

        setUploadProgress(Math.round(((i + 1) * 100) / totalChunks));
      }

      // Complete upload
      const completeRes = await fetch('/api/upload-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          originalName: file.name,
          totalChunks
        })
      });

      if (!completeRes.ok) {
        const text = await completeRes.text();
        throw new Error(`Upload completion failed: ${completeRes.status} ${text}`);
      }

      const data = await completeRes.json();
      
      // Trigger indexing
      const indexRes = await fetch(`/api/videos/${data.video.id}/index`, { method: 'POST' });
      if (!indexRes.ok) {
        const text = await indexRes.text();
        throw new Error(`Indexing failed: ${indexRes.status} ${text}`);
      }
      fetchVideos();
    } catch (err: any) {
      console.error('Upload failed', err);
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setActiveVideo(result.videoId);
    setActiveVideoFilename(result.videoFilename);
    setClipStart(result.start);
    setClipEnd(result.end);
    
    if (videoRef.current) {
      videoRef.current.src = `/uploads/${result.videoFilename}`;
      videoRef.current.currentTime = result.start;
      videoRef.current.play();
    }
  };

  const handleGenerateClip = async () => {
    if (!activeVideo) return;

    setClipping(true);
    setClipUrl(null);
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
        setClipUrl(data.clipUrl);
      }
    } catch (err) {
      console.error('Clipping failed', err);
    } finally {
      setClipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-ink p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
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
                onChange={handleUpload}
                disabled={uploading}
              />
              <span className={buttonVariants({ variant: "default", className: "bg-theme-accent hover:bg-orange-600 text-white border border-theme-line rounded-none font-bold text-[11px] uppercase h-8 cursor-pointer w-36" }) + (uploading ? " opacity-50 pointer-events-none" : "")}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {uploading ? `Uploading ${uploadProgress}%` : 'Upload Video'}
              </span>
            </label>
            {uploading && (
              <Progress value={uploadProgress} className="h-1 w-36 rounded-none border border-theme-line bg-theme-bg [&>div]:bg-theme-accent" />
            )}
            {uploadError && (
              <div className="text-[9px] text-red-500 font-bold uppercase mt-1 max-w-xs text-right">
                {uploadError}
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Left Column: Library & Search */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-white border border-theme-line">
              <div className="font-serif italic text-[11px] px-2 py-1 border-b border-theme-line bg-[#f0f0f0] uppercase opacity-50">Search Index</div>
              <div className="p-2">
                <div className="flex space-x-2">
                  <Input 
                    placeholder="e.g. 'basketball'" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-theme-bg border-theme-line text-theme-ink font-mono text-xs rounded-none h-8"
                  />
                  <Button onClick={handleSearch} variant="secondary" className="bg-theme-ink hover:bg-black text-white rounded-none h-8 px-3">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <ScrollArea className="h-[300px] mt-2">
                    <div className="space-y-2">
                      {searchResults.map((result, idx) => (
                        <div 
                          key={idx} 
                          className="p-2 bg-white border-l-2 border-transparent hover:border-theme-accent hover:bg-[#fffcf0] cursor-pointer transition-colors"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-[9px] text-theme-ink border-theme-line font-mono rounded-none px-1 py-0 uppercase">
                              {result.type}
                            </Badge>
                            <span className="text-[9px] font-mono opacity-40">
                              [{result.start}s - {result.end}s]
                            </span>
                          </div>
                          <p className="text-[11px] text-theme-ink leading-tight">"{result.match}"</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>

            <div className="bg-white border border-theme-line">
              <div className="flex items-center justify-between px-2 py-1 border-b border-theme-line bg-[#f0f0f0]">
                <div className="font-serif italic text-[11px] uppercase opacity-50">Library</div>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-[9px] font-mono bg-transparent border-none outline-none uppercase cursor-pointer text-theme-ink"
                >
                  <option value="all">All</option>
                  <option value="uploaded">Uploaded</option>
                  <option value="indexing">Indexing</option>
                  <option value="indexed">Indexed</option>
                </select>
              </div>
              <div className="p-2">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-1">
                    {videos.filter(v => statusFilter === 'all' || v.status === statusFilter).map(video => (
                      <div key={video.id} className="flex items-center justify-between p-1.5 hover:bg-theme-ink hover:text-white cursor-pointer text-[13px] font-medium transition-colors">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="truncate max-w-[120px]" title={video.originalName}>
                            {video.originalName}
                          </span>
                          <a 
                            href={`/uploads/${video.filename}`} 
                            download={video.originalName}
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-50 hover:opacity-100 hover:text-theme-accent transition-all"
                            title="Download original video"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                        {video.status === 'uploaded' && <span className="text-[9px] font-mono uppercase opacity-50">Uploaded</span>}
                        {video.status === 'indexing' && (
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] font-mono uppercase text-theme-accent">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> {video.indexingProgress?.step.replace('_', ' ') || 'Indexing'} {video.indexingProgress?.percent || 0}%
                            </span>
                            <Progress value={video.indexingProgress?.percent || 0} className="h-1 w-16 mt-1 rounded-none border border-theme-line bg-theme-bg [&>div]:bg-theme-accent" />
                          </div>
                        )}
                        {video.status === 'indexed' && (
                          <span className="text-[9px] font-mono uppercase text-green-600">
                            Indexed
                          </span>
                        )}
                      </div>
                    ))}
                    {videos.filter(v => statusFilter === 'all' || v.status === statusFilter).length === 0 && (
                      <p className="text-[11px] opacity-50 text-center py-4">
                        {videos.length === 0 ? "No videos uploaded yet." : "No videos match the selected filter."}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Middle Column: Player & Clipping */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-theme-line flex flex-col">
              <div className="relative bg-black flex items-center justify-center overflow-hidden" style={{ minHeight: '400px' }}>
                {activeVideoFilename ? (
                  <video 
                    ref={videoRef}
                    src={`/uploads/${activeVideoFilename}`} 
                    controls 
                    className="w-full h-full object-contain opacity-90"
                  />
                ) : (
                  <div className="text-white/50 flex flex-col items-center font-mono text-[10px] tracking-widest uppercase">
                    <Play className="w-8 h-8 mb-2 opacity-50" />
                    <p>Select a search result to preview</p>
                  </div>
                )}
                
                {/* Player controls overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-black/80 flex items-center px-4 gap-4 text-white font-mono text-[10px]">
                   <span>▶ {activeVideoFilename || 'NO_VIDEO_SELECTED'}</span>
                   <span className="opacity-50">|</span>
                   <span>[HD]</span>
                   <span className="opacity-50">|</span>
                   <span>OBJ_DET: ON</span>
                </div>
              </div>
              
              <div className="p-4 bg-theme-bg border-t border-theme-line">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-serif italic text-[11px] uppercase opacity-50">Clip Editor</div>
                  <Button 
                    onClick={handleGenerateClip} 
                    disabled={!activeVideo || clipping}
                    className="bg-theme-accent hover:bg-orange-600 text-white border border-theme-line rounded-none font-bold text-[11px] uppercase h-8"
                  >
                    {clipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Scissors className="mr-2 h-4 w-4" />}
                    Export Clip
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[9px] uppercase font-bold border-r border-theme-line pr-2 mr-2">Start Time (s)</label>
                    <Input 
                      type="number" 
                      value={clipStart} 
                      onChange={(e) => setClipStart(Number(e.target.value))}
                      className="bg-white border-theme-line text-theme-ink font-mono text-xs rounded-none h-8 inline-block w-24"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold border-r border-theme-line pr-2 mr-2">End Time (s)</label>
                    <Input 
                      type="number" 
                      value={clipEnd} 
                      onChange={(e) => setClipEnd(Number(e.target.value))}
                      className="bg-white border-theme-line text-theme-ink font-mono text-xs rounded-none h-8 inline-block w-24"
                    />
                  </div>
                </div>

                {clipUrl && (
                  <div className="p-2 bg-white border border-theme-line flex items-center justify-between">
                    <span className="text-green-600 text-[11px] font-bold uppercase flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span> Clip generated</span>
                    <a href={clipUrl} download className={buttonVariants({ variant: "outline", size: "sm", className: "border-theme-line text-theme-ink rounded-none h-6 text-[10px] uppercase font-bold" })}>
                      Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Index Data (Transcript & Objects) */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-white border border-theme-line">
              <div className="font-serif italic text-[11px] px-2 py-1 border-b border-theme-line bg-[#f0f0f0] uppercase opacity-50">Transcript</div>
              <ScrollArea className="h-[300px]">
                <div className="p-2 space-y-1">
                  {videos.find(v => v.id === activeVideo)?.indexData?.transcripts.map((t, idx) => (
                    <div 
                      key={idx} 
                      className="text-[11px] leading-tight border-l-2 border-transparent hover:border-theme-accent pl-1.5 cursor-pointer py-1 hover:bg-[#fffcf0]"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = t.start;
                          videoRef.current.play();
                        }
                      }}
                    >
                      <span className="font-mono text-theme-accent mr-2">[{t.start}s]</span>
                      {t.text}
                    </div>
                  ))}
                  {!videos.find(v => v.id === activeVideo)?.indexData && (
                    <p className="text-[10px] opacity-50 text-center py-4 uppercase font-mono">No index data available</p>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="bg-white border border-theme-line">
              <div className="font-serif italic text-[11px] px-2 py-1 border-b border-theme-line bg-[#f0f0f0] uppercase opacity-50">Detected Objects</div>
              <ScrollArea className="h-[200px]">
                <div className="p-2 flex flex-wrap gap-1">
                  {videos.find(v => v.id === activeVideo)?.indexData?.objects.map((o, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline" 
                      className="text-[9px] font-mono rounded-none border-theme-line cursor-pointer hover:border-theme-accent hover:text-theme-accent"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = o.start;
                          videoRef.current.play();
                        }
                      }}
                    >
                      {o.label} ({o.start}s)
                    </Badge>
                  ))}
                  {!videos.find(v => v.id === activeVideo)?.indexData && (
                    <p className="text-[10px] opacity-50 text-center py-4 uppercase font-mono w-full">No objects detected</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

        </div>
        
        <footer className="border-t border-theme-line py-2 flex items-center justify-between text-[9px] font-mono uppercase">
          <div><span className="w-1.5 h-1.5 bg-[#00FF00] rounded-full inline-block mr-1"></span> SYSTEM READY: WHISPER-V3 ACTIVE</div>
          <div>STORAGE: LOCAL / UPLOADS</div>
          <div>API: v2.4.0-build.82</div>
        </footer>
      </div>
    </div>
  );
}
