# Music Downloader

A local browser UI for downloading YouTube and YouTube Music tracks as MP3 with full metadata — title, artist, album, track number, and album art embedded.

Wraps `yt-dlp` and `ffmpeg` so you don't have to use the command line.

> **Local only.** This runs on your machine. Nothing is sent to any server or cloud service.

## Prerequisites

The following tools must be installed and available on your PATH before running this app:

- **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** — handles downloading and metadata extraction
- **[ffmpeg](https://ffmpeg.org/)** — handles audio conversion and embedding thumbnail/metadata into the MP3

Install both via winget:

```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

## Setup

Install dependencies:

```bash
pnpm install
```

## Running

Start the local server:

```bash
pnpm dev
```

Then open **http://localhost:3000** in your browser.

## Usage

1. Paste a YouTube or YouTube Music URL (single track or full playlist/album)
2. Click **Get Info** to preview the metadata before downloading
3. Optionally set a custom **output folder** — defaults to `~/Music`
4. Click **Download** and watch the progress terminal

Downloaded files are saved directly to disk under:
```
<output folder>\<Album>\<track_number> - <title>.mp3
```

## Configuration

Copy `.env` and adjust as needed:

| Variable | Description |
|---|---|
| `NUXT_MUSIC_OUTPUT_PATH` | Full path to your Music folder. Defaults to `~/Music` if empty. |
| `NUXT_BROWSER_FOR_COOKIES` | Browser to pull cookies from (`chrome`, `edge`, `firefox`). Helps avoid rate limiting. Leave empty to skip. |

Example `.env`:
```
NUXT_MUSIC_OUTPUT_PATH=C:\Users\YourName\Music
NUXT_BROWSER_FOR_COOKIES=chrome
```

## What gets embedded in each MP3

- Title
- Artist
- Album
- Track number
- Year / release date
- Album art (thumbnail)

This metadata comes from YouTube's structured music block present on official YouTube Music uploads.

## Limitations

- **Local only** — designed to run on your own machine, not deployable to a server
- Works best with YouTube Music links where full album/artist metadata is available
- yt-dlp and ffmpeg must be on PATH; the app does not install them
