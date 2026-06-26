import { createEventStream } from 'h3'
import { getJob } from '../../utils/jobs'

export default defineEventHandler((event) => {
  const jobId = getRouterParam(event, 'jobId')!
  const job = getJob(jobId)

  if (!job) {
    throw createError({ statusCode: 404, message: 'Job not found' })
  }

  const eventStream = createEventStream(event)

  // Snapshot current state synchronously before any awaits
  const buffered = [...job.lines]
  const alreadyDone = job.status !== 'running'

  const lineHandler = (line: string) => {
    eventStream.push(line).catch(() => {})
  }

  const doneHandler = (success: boolean) => {
    eventStream.push({ event: 'done', data: JSON.stringify({ success }) })
      .then(() => eventStream.close())
      .catch(() => {})
  }

  if (!alreadyDone) {
    job.onLine.add(lineHandler)
    job.onDone.add(doneHandler)

    eventStream.onClosed(() => {
      job.onLine.delete(lineHandler)
      job.onDone.delete(doneHandler)
    })
  }

  // process.nextTick fires before I/O callbacks, so buffered lines go out
  // before any new yt-dlp stdout events can fire via lineHandler
  process.nextTick(async () => {
    for (const line of buffered) {
      await eventStream.push(line).catch(() => {})
    }
    if (alreadyDone) {
      await eventStream.push({ event: 'done', data: JSON.stringify({ success: job.exitCode === 0 }) }).catch(() => {})
      await eventStream.close().catch(() => {})
    }
  })

  return eventStream.send()
})
