# Deploy Pipeline.AI to the public — free options

## Option 1: Render (easiest, free tier)

1. Push this repo to GitHub
2. Go to https://render.com → New Web Service → connect repo
3. It auto-detects `render.yaml` — just hit Create
4. You get a live URL: `https://pipeline-ai.onrender.com`

Free tier: 512 MB RAM, spins down after 15 min idle (wakes on next request).

---

## Option 2: Railway (free $5 credit)

1. Push to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub repo
3. Set these variables in the Railway dashboard:
   - `NODE_ENV=production`
   - `DATA_DIR=/app/data`
4. Railway auto-detects `package.json` build/start scripts
5. You get a live URL: `https://pipeline-ai-production.up.railway.app`

---

## Option 3: Fly.io (free allowance)

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch` (auto-generates fly.toml)
3. Run: `fly deploy`
4. You get a live URL: `https://pipeline-ai.fly.dev`

---

## Option 4: Google Cloud Run (already Docker-ready)

1. Enable Cloud Run API in your GCP project
2. Build & push:
   ```
   gcloud builds submit --tag gcr.io/PROJECT-ID/pipeline-ai
   ```
3. Deploy:
   ```
   gcloud run deploy pipeline-ai \
     --image gcr.io/PROJECT-ID/pipeline-ai \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 512Mi
   ```
4. You get a live URL: `https://pipeline-ai-RANDOM_HASH.uc.r.appspot.com`

Free tier: 2 million requests/month, 100k GB-sec compute.

---

## ⚠️ Important: Persistent storage

This app stores uploads, clips, and the SQLite database on disk.
Serverless platforms (Cloud Run, Fly.io) have **ephemeral filesystems**.
For production use with persistent data, either:

- Use **Render** (has persistent disk support in free tier)
- Use **Railway** (persistent volumes)
- Attach a cloud storage bucket (S3/GCS) and swap SQLite for Postgres
