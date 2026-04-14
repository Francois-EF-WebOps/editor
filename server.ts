import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

// Configure ffmpeg
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Setup storage directories
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const CLIPS_DIR = path.join(process.cwd(), 'clips');
const DB_FILE = path.join(process.cwd(), 'db.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(CLIPS_DIR)) fs.mkdirSync(CLIPS_DIR, { recursive: true });

// Serve static files from uploads and clips
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/clips', express.static(CLIPS_DIR));

// Simple JSON database
interface VideoRecord {
  id: string;
  filename: string;
  originalName: string;
  status: 'uploaded' | 'indexing' | 'indexed';
  indexData?: any;
}

let db: { videos: VideoRecord[] } = { videos: [] };
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Multer setup for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage });

// API Routes

// 1. Upload Video
app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const video: VideoRecord = {
    id: uuidv4(),
    filename: req.file.filename,
    originalName: req.file.originalname,
    status: 'uploaded'
  };

  db.videos.push(video);
  saveDb();

  res.json({ success: true, video });
});

// 2. Get Videos
app.get('/api/videos', (req, res) => {
  res.json({ videos: db.videos });
});

// 3. Mock Indexing (Simulates Whisper, YOLO, CLIP)
app.post('/api/videos/:id/index', (req, res) => {
  const { id } = req.params;
  const video = db.videos.find(v => v.id === id);
  
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  video.status = 'indexing';
  saveDb();

  // Simulate async indexing process
  setTimeout(() => {
    video.status = 'indexed';
    
    // Generate some mock index data based on the video
    // In a real app, this would call Whisper, YOLO, CLIP, or Gemini API
    video.indexData = {
      transcripts: [
        { text: "Welcome to the tutorial.", start: 0, end: 2 },
        { text: "Today we will learn about basketball.", start: 2.5, end: 5 },
        { text: "Let's look at this amazing shot.", start: 6, end: 9 },
        { text: "And that's how you score.", start: 10, end: 12 },
      ],
      objects: [
        { label: "person", start: 0, end: 15 },
        { label: "basketball", start: 3, end: 8 },
        { label: "hoop", start: 6, end: 9 },
      ],
      scenes: [
        { description: "Intro scene", start: 0, end: 2.5 },
        { description: "Action shot on the court", start: 2.5, end: 10 },
        { description: "Outro", start: 10, end: 15 },
      ]
    };
    saveDb();
  }, 3000);

  res.json({ success: true, message: 'Indexing started' });
});

// 4. Search Index
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.json({ results: [] });
  }

  const query = q.toLowerCase();
  const results: any[] = [];

  db.videos.forEach(video => {
    if (video.status !== 'indexed' || !video.indexData) return;

    // Search transcripts
    video.indexData.transcripts.forEach((t: any) => {
      if (t.text.toLowerCase().includes(query)) {
        results.push({ videoId: video.id, videoFilename: video.filename, type: 'transcript', match: t.text, start: t.start, end: t.end });
      }
    });

    // Search objects
    video.indexData.objects.forEach((o: any) => {
      if (o.label.toLowerCase().includes(query)) {
        results.push({ videoId: video.id, videoFilename: video.filename, type: 'object', match: o.label, start: o.start, end: o.end });
      }
    });

    // Search scenes
    video.indexData.scenes.forEach((s: any) => {
      if (s.description.toLowerCase().includes(query)) {
        results.push({ videoId: video.id, videoFilename: video.filename, type: 'scene', match: s.description, start: s.start, end: s.end });
      }
    });
  });

  res.json({ results });
});

// 5. Generate Clip
app.post('/api/clip', (req, res) => {
  const { videoId, start, end } = req.body;
  
  const video = db.videos.find(v => v.id === videoId);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const inputPath = path.join(UPLOADS_DIR, video.filename);
  const outputFilename = `clip_${uuidv4()}.mp4`;
  const outputPath = path.join(CLIPS_DIR, outputFilename);

  const duration = end - start;

  ffmpeg(inputPath)
    .setStartTime(start)
    .setDuration(duration)
    .output(outputPath)
    .on('end', () => {
      res.json({ success: true, clipUrl: `/clips/${outputFilename}` });
    })
    .on('error', (err) => {
      console.error('Error generating clip:', err);
      res.status(500).json({ error: 'Failed to generate clip' });
    })
    .run();
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
