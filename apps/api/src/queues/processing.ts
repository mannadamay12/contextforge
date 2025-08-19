// apps/api/src/queues/processing.ts
import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export const processingQueue = new Queue('content-processing', {
  connection: redis,
})

export const processingWorker = new Worker(
  'content-processing',
  async (job: Job) => {
    const { sourceId, type, url } = job.data
    
    // Process based on source type
    const processor = getProcessor(type)
    const result = await processor.process({ url, sourceId })
    
    // Update database with result
    await updateSourceStatus(sourceId, result)
  },
  { connection: redis }
)