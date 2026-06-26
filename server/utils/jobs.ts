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
