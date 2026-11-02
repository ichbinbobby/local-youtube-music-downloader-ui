import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { createJob, pushLine, finishJob, getYtDlpExecutable, getYtDlpSpawnError } from '../utils/jobs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const url = body?.url as string
  const clientOutputPath = body?.outputPath as string | undefined

  if (!url) {
    throw createError({ statusCode: 400, message: 'url is required' })
  }

  const isPlaylist = body?.isPlaylist as boolean | undefined

  const config = useRuntimeConfig()
  const outputDir = clientOutputPath || (config.musicOutputPath as string) || join(homedir(), 'Downloads')
  const browser = config.browserForCookies as string | undefined

  // For playlists, use playlist_index as track number in both filename and ID3 tag.
  // %(album,playlist_title)s tries album first, falls back to playlist title.
  // For single videos, skip the track number entirely — yt-dlp won't have it.
  const outputTemplate = isPlaylist
    ? join(outputDir, '%(album,playlist_title)s', '%(playlist_index)02d - %(title)s.%(ext)s')
    : join(outputDir, '%(title)s.%(ext)s')

  const args = [
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '--embed-thumbnail',
    '--embed-metadata',
    '--progress',
    '--newline',
    '-o', outputTemplate
  ]

  if (isPlaylist) {
    // Inject playlist_index into the ID3 track_number field so players sort correctly
    args.push('--parse-metadata', '%(playlist_index)s:%(track_number)s')
  }

  if (browser) {
    args.push('--cookies-from-browser', browser)
  }

  args.push(url)

  const jobId = randomUUID()
  const job = createJob(jobId)

  const ytdlp = spawn(getYtDlpExecutable(), args)
  let finished = false

  const finish = (exitCode: number) => {
    if (finished) return
    finished = true
    finishJob(job, exitCode)
  }

  const handleData = (data: Buffer) => {
    const lines = data.toString().split('\n').filter((l: string) => l.trim())
    for (const line of lines) {
      pushLine(job, line)
    }
  }

  ytdlp.stdout.on('data', handleData)
  ytdlp.stderr.on('data', handleData)

  ytdlp.on('close', (code: number | null) => {
    finish(code ?? 1)
  })

  ytdlp.on('error', (err: NodeJS.ErrnoException) => {
    pushLine(job, getYtDlpSpawnError(err))
    finish(1)
  })

  return { jobId }
})
