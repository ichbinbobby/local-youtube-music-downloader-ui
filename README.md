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

After installing, open a new terminal (and restart the app) so it picks up the updated PATH. Verify both tools are available:

```powershell
yt-dlp --version
ffmpeg -version
```

If `yt-dlp` is installed but not on PATH, set `NUXT_YT_DLP_PATH` to the full path to its executable in `.env`.

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
3. Optionally set a custom **output folder** — defaults to `~/Downloads`
4. Click **Download** and watch the progress terminal

Downloaded files are saved directly to disk under:

```
<output folder>\<Album>\<track_number> - <title>.mp3
```

## Configuration

Copy `.env` and adjust as needed:

| Variable                   | Description                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `NUXT_MUSIC_OUTPUT_PATH`   | Custom download folder. Defaults to `~/Downloads` if empty.                                                 |
| `NUXT_BROWSER_FOR_COOKIES` | Browser to pull cookies from (`chrome`, `edge`, `firefox`). Helps avoid rate limiting. Leave empty to skip. |
| `NUXT_YT_DLP_PATH`         | Full path to the `yt-dlp` executable if it is not available on PATH.                                        |

Example `.env`:

```
NUXT_BROWSER_FOR_COOKIES=
NUXT_YT_DLP_PATH=C:\path\to\yt-dlp.exe
```

> [!TIP]
> The yt-dlp install path may change after an update. If the configured path stops working, find the new `yt-dlp.exe` and update `NUXT_YT_DLP_PATH`.

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
- yt-dlp and ffmpeg must be installed; ffmpeg must be on PATH. yt-dlp can be set with `NUXT_YT_DLP_PATH` if it is not on PATH.
