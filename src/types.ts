export interface VideoRecord {
  id: string;
  filename: string;
  original_name: string;
  status: 'uploaded' | 'indexing' | 'indexed';
  clip_generation_progress?: number;
  indexData?: {
    transcripts: { text: string; start: number; end: number }[];
    objects: { label: string; start: number; end: number; confidence?: number }[];
    scenes: { description: string; start: number; end: number }[];
  };
}

export interface SearchResult {
  videoId: string;
  videoFilename: string;
  type: 'transcript' | 'object' | 'scene';
  match: string;
  start: number;
  end: number;
}

export interface ClipJob {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  clipUrl: string | null;
  error: string | null;
}
