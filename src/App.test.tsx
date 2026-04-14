import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/src/App';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('@/src/components/Header', () => ({
  default: ({ uploading, uploadProgress, uploadError, onUpload }: any) => (
    <header>
      <h1>Pipeline.AI</h1>
      <button onClick={onUpload}>
        {uploading ? `Uploading ${uploadProgress}%` : 'Upload Video'}
      </button>
      {uploadError && <span data-testid="upload-error">{uploadError}</span>}
    </header>
  ),
}));

vi.mock('@/src/components/SearchPanel', () => ({
  default: ({ searchQuery, onQueryChange, onSearch }: any) => (
    <div>
      <input
        placeholder="e.g. 'basketball'"
        value={searchQuery}
        onChange={(e: any) => onQueryChange(e.target.value)}
        onKeyDown={(e: any) => e.key === 'Enter' && onSearch()}
      />
    </div>
  ),
}));

vi.mock('@/src/components/VideoLibrary', () => ({
  default: ({ onVideoSelect }: any) => (
    <div>
      <span>Library</span>
      <button
        onClick={() =>
          onVideoSelect({
            id: '1',
            filename: 'test.mp4',
            original_name: 'test.mp4',
            status: 'indexed',
          })
        }
      >
        Video
      </button>
    </div>
  ),
}));

vi.mock('@/src/components/VideoPlayer', () => ({
  default: ({ activeVideo, onGenerateClip, clipping, clipUrl, onVideoReady }: any) => (
    <div>
      <span>Clip Editor</span>
      {activeVideo && <span data-testid="active-video">{activeVideo}</span>}
      <button onClick={onGenerateClip} disabled={!activeVideo || clipping}>
        {clipping ? 'Exporting...' : 'Export Clip'}
      </button>
      {clipUrl && (
        <a href={clipUrl} download>
          Download
        </a>
      )}
      <div ref={(el: any) => el && onVideoReady(el)} />
    </div>
  ),
}));

vi.mock('@/src/components/TranscriptViewer', () => ({
  default: () => (
    <div>
      <span>Transcript</span>
      <span>Detected Objects</span>
    </div>
  ),
}));

vi.mock('@/src/components/StatusBanner', () => ({
  default: ({ error, loading, message }: any) => (
    <div>
      {error && <span data-testid="status-error">{error}</span>}
      {loading && <span>Loading...</span>}
      {message && <span>{message}</span>}
    </div>
  ),
}));

describe('App component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ videos: [] }),
    });
  });

  it('renders the header with app name', () => {
    render(<App />);
    expect(screen.getByText(/Pipeline\.AI/i)).toBeInTheDocument();
  });

  it('renders the upload button', () => {
    render(<App />);
    expect(screen.getByText(/Upload Video/i)).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/basketball/i)).toBeInTheDocument();
  });

  it('renders the library section', () => {
    render(<App />);
    expect(screen.getByText(/Library/i)).toBeInTheDocument();
  });

  it('renders the clip editor section', () => {
    render(<App />);
    expect(screen.getByText(/Clip Editor/i)).toBeInTheDocument();
  });

  it('renders the transcript section', () => {
    render(<App />);
    expect(screen.getByText(/Transcript/i)).toBeInTheDocument();
  });

  it('renders the detected objects section', () => {
    render(<App />);
    expect(screen.getByText(/Detected Objects/i)).toBeInTheDocument();
  });
});
