# Nuxt Music Downloader — Project Brief

## What we're building
A local Nuxt.js app that acts as a personal music downloader. The user pastes a YouTube or YouTube Music URL (single video or full playlist/album), and the app downloads it as MP3 with full metadata (title, artist, album, track number, album art) saved directly to a local Music folder.

The goal is to replace paid tools like "4K YouTube to MP3" with an unlimited, free, local alternative.

---

## How it works

```
User pastes URL in browser UI
      ↓
Nuxt server route receives the URL
      ↓
Node.js spawns yt-dlp as a child process (like running it in PowerShell)
      ↓
yt-dlp downloads audio, converts to MP3, embeds metadata + album art via ffmpeg
      ↓
File saved directly to the user's local Music folder
      ↓
UI shows success / progress
```

---

## Prerequisites (already installed on the machine)

- **yt-dlp** — does the actual downloading and metadata extraction
- **ffmpeg** — handles audio conversion and embedding thumbnail/metadata into MP3
- **Node.js** — runs Nuxt
- **OS: Windows**

All installed via winget.

---

## The yt-dlp command being wrapped

```powershell
yt-dlp -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --embed-metadata -o "%(album)s\%(track_number)s - %(title)s.%(ext)s" "URL"
```

### Flag breakdown
| Flag | Purpose |
|---|---|
| `-x` | Extract audio only, no video |
| `--audio-format mp3` | Convert to MP3 |
| `--audio-quality 0` | Best quality |
| `--embed-thumbnail` | Embed album art into the MP3 (requires ffmpeg) |
| `--embed-metadata` | Embed ID3 tags: title, artist, album, track number, year |
| `-o "%(album)s\%(track_number)s - %(title)s.%(ext)s"` | Output filename template |

### Output filename example
```
Toys In The Attic\
  01 - Sweet Emotion.mp3
  02 - Walk This Way.mp3
```

### Metadata embedded into each MP3
- Title
- Artist
- Album
- Track number
- Year / release date
- Album art (thumbnail)

yt-dlp extracts this from YouTube's structured music metadata block that appears in official music video descriptions, e.g.:
```
Sweet Emotion · Aerosmith
Toys In The Attic
℗ 1975 Aerodisc Partnership
Released on: 1975-04-08
```

---

## Project structure

```
nuxt-music-downloader/
├── server/
│   └── api/
│       ├── info.get.ts        ← fetch metadata preview before downloading
│       └── download.post.ts   ← spawn yt-dlp, save to Music folder
├── pages/
│   └── index.vue              ← main UI
├── nuxt.config.ts
└── package.json
```

---

## Server routes

### `server/api/info.get.ts`
- Accepts: `?url=` query param
- Runs: `yt-dlp --dump-json <url>`
- Returns: JSON with title, artist, album, thumbnail, track count (if playlist)
- Used to show a preview before the user confirms download

### `server/api/download.post.ts`
- Accepts: `{ url }` in request body
- Spawns yt-dlp with all flags above
- Output path: user's local Music folder, e.g. `C:\Users\<name>\Music\%(album)s\%(track_number)s - %(title)s.%(ext)s`
- Streams yt-dlp stdout/stderr back so the UI can show real-time progress
- Returns `{ success: true }` on completion or `{ error }` on failure

---

## UI (pages/index.vue)

### Features to build
1. **URL input** — paste a YouTube or YouTube Music URL (single or playlist)
2. **Fetch info button** — calls `/api/info`, shows preview:
   - Thumbnail / album art
   - Album name
   - Artist
   - Track list (if playlist)
3. **Download button** — calls `/api/download`, shows progress
4. **Output folder setting** — configurable path to Music folder

### Nice to have
- Real-time download progress (yt-dlp prints progress to stdout, pipe it to the UI via SSE or polling)
- Download history
- Format selector (MP3 vs M4A)

---

## Key implementation notes

### child_process in Nuxt server route
```ts
import { spawn } from 'child_process'

const ytdlp = spawn('yt-dlp', [
  '-x',
  '--audio-format', 'mp3',
  '--audio-quality', '0',
  '--embed-thumbnail',
  '--embed-metadata',
  '-o', `C:\\Users\\YourName\\Music\\%(album)s\\%(track_number)s - %(title)s.%(ext)s`,
  url
])

ytdlp.stdout.on('data', (data) => console.log(data.toString()))
ytdlp.on('close', (code) => { /* resolve or reject */ })
```

### Output path
- Save directly to disk, do NOT stream through the browser
- Make the output folder configurable (store in a config file or `.env`)

### Playlist support
- yt-dlp handles playlists automatically — same command, just pass the playlist URL
- No extra flags needed

### Rate limiting
- Add `--cookies-from-browser chrome` (or edge/firefox) to pass browser cookies and avoid rate limiting
- Optionally add `--sleep-interval 3` for a pause between tracks

---

## .env variables to consider

```
MUSIC_OUTPUT_PATH=C:\Users\YourName\Music
BROWSER_FOR_COOKIES=chrome
```

---

## Out of scope
- No cloud hosting — this runs locally only
- No user authentication
- No database
- yt-dlp and ffmpeg are assumed to already be installed and on PATH
