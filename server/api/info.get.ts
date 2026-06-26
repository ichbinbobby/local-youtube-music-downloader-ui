import { spawn } from 'node:child_process'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({ statusCode: 400, message: 'url query parameter is required' })
  }

  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--dump-single-json',
      '--flat-playlist',
      '--no-warnings',
      url
    ])

    let stdout = ''
    let stderr = ''

    ytdlp.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })
    ytdlp.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    ytdlp.on('close', (code: number | null) => {
      if (code !== 0) {
        const msg = stderr.split('\n').find(l => l.toLowerCase().includes('error')) ?? stderr.trim() ?? 'yt-dlp failed'
        reject(createError({ statusCode: 500, message: msg }))
        return
      }
      try {
        resolve(JSON.parse(stdout.trim()))
      } catch {
        reject(createError({ statusCode: 500, message: 'Failed to parse yt-dlp output' }))
      }
    })

    ytdlp.on('error', (err: Error) => {
      reject(createError({ statusCode: 500, message: `Failed to run yt-dlp: ${err.message}` }))
    })
  })
})
