export function getYtDlpExecutable(): string {
  const config = useRuntimeConfig()
  return config.ytDlpPath || 'yt-dlp'
}

export function getYtDlpSpawnError(err: NodeJS.ErrnoException): string {
  if (err.code === 'ENOENT') {
    return 'yt-dlp was not found. Install it and make sure it is on PATH, then restart the app. Alternatively, set NUXT_YT_DLP_PATH to the full path to the executable.'
  }

  return `Failed to run yt-dlp: ${err.message}`
}

export interface Job {
  status: 'running' | 'done' | 'error'
  lines: string[]
  exitCode: number | null
  onLine: Set<(line: string) => void>
  onDone: Set<(success: boolean) => void>
}

const jobs = new Map<string, Job>()

export function createJob(id: string): Job {
  const job: Job = {
    status: 'running',
    lines: [],
    exitCode: null,
    onLine: new Set(),
    onDone: new Set()
  }
  jobs.set(id, job)
  setTimeout(() => jobs.delete(id), 10 * 60 * 1000)
  return job
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id)
}

export function pushLine(job: Job, line: string): void {
  job.lines.push(line)
  for (const handler of job.onLine) {
    handler(line)
  }
}

export function finishJob(job: Job, exitCode: number): void {
  job.exitCode = exitCode
  job.status = exitCode === 0 ? 'done' : 'error'
  const success = exitCode === 0
  for (const handler of job.onDone) {
    handler(success)
  }
  job.onLine.clear()
  job.onDone.clear()
}
