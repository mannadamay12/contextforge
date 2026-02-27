// apps/api/src/queues/processing.ts
import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'
import { GitHubProcessor } from '../../../../packages/shared/dist/processors/github.js'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required for BullMQ
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
})
const prisma = new PrismaClient()

export interface ProcessingJobData {
  sourceId: string
  projectId: string
  type: string
  url: string
  userId?: string
}

export const processingQueue = new Queue<ProcessingJobData>('content-processing', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 successful jobs
    removeOnFail: 50,      // Keep last 50 failed jobs
    attempts: 3,           // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
})

export const queueEvents = new QueueEvents('content-processing', {
  connection: redis,
})

// Processor factory - returns the appropriate processor for each source type
function getProcessor(type: string) {
  switch (type) {
    case 'GITHUB_REPO':
    case 'GITHUB_ISSUE':
    case 'GITHUB_PR':
      return new GitHubProcessor()
    
    case 'ARXIV_PAPER':
      // TODO: Implement ArXiv processor
      throw new Error('ArXiv processor not implemented yet')
    
    case 'WEB_PAGE':
      // TODO: Implement Web crawler
      throw new Error('Web crawler not implemented yet')
      
    case 'YOUTUBE_VIDEO':
      // TODO: Implement YouTube processor  
      throw new Error('YouTube processor not implemented yet')
      
    default:
      throw new Error(`Unsupported source type: ${type}`)
  }
}

// Update source in database with processing results
async function updateSourceStatus(
  sourceId: string, 
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED', 
  content?: string,
  metadata?: any,
  error?: string
) {
  try {
    await prisma.source.update({
      where: { id: sourceId },
      data: {
        status,
        content: content || undefined,
        metadata: metadata || undefined,
        // Store error in metadata if present
        ...(error && {
          metadata: {
            ...metadata,
            error,
            errorTimestamp: new Date().toISOString()
          }
        })
      },
    })
    
    console.log(`✅ Updated source ${sourceId} to status: ${status}`)
  } catch (dbError) {
    console.error(`❌ Failed to update source ${sourceId}:`, dbError)
    throw dbError
  }
}

// Create and export the worker
export const processingWorker = new Worker<ProcessingJobData>(
  'content-processing',
  async (job: Job<ProcessingJobData>) => {
    const { sourceId, type, url, projectId } = job.data
    
    console.log(`🚀 Starting job ${job.id}: Processing ${type} source: ${url}`)
    
    try {
      // Update status to processing
      await updateSourceStatus(sourceId, 'PROCESSING')
      
      // Get the appropriate processor
      const processor = getProcessor(type)
      
      // Process the source
      const result = await processor.process({ url, type })
      
      if (result.status === 'success') {
        // Update database with successful result
        await updateSourceStatus(
          sourceId,
          'COMPLETED',
          result.content,
          result.metadata
        )
        
        console.log(`✅ Job ${job.id} completed successfully`)
        
        return {
          success: true,
          sourceId,
          contentLength: result.content.length,
          metadata: result.metadata
        }
      } else {
        // Handle processing error
        throw new Error(result.error || 'Processing failed')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Job ${job.id} failed:`, errorMessage)
      
      // Update database with failure
      await updateSourceStatus(sourceId, 'FAILED', undefined, undefined, errorMessage)
      
      // Re-throw to let BullMQ handle retries
      throw error
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10,      // Maximum 10 jobs
      duration: 1000, // per second (rate limiting)
    },
  }
)

// Job event handlers for logging and monitoring
processingWorker.on('completed', (job, result) => {
  console.log(`🎉 Job ${job.id} completed:`, result)
})

processingWorker.on('failed', (job, err) => {
  console.error(`💥 Job ${job?.id} failed:`, err.message)
})

processingWorker.on('progress', (job, progress) => {
  console.log(`⏳ Job ${job.id} progress: ${progress}%`)
})

// Queue event handlers
queueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(`📋 Queue: Job ${jobId} completed`)
})

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.log(`📋 Queue: Job ${jobId} failed - ${failedReason}`)
})

// Helper function to add a job to the queue
export async function addProcessingJob(data: ProcessingJobData) {
  const job = await processingQueue.add(
    'process-source',
    data,
    {
      priority: getPriority(data.type),
      delay: 0, // Process immediately
      // Add job ID for tracking
      jobId: `${data.sourceId}-${Date.now()}`,
    }
  )
  
  console.log(`📥 Added job ${job.id} to queue: ${data.type} - ${data.url}`)
  return job
}

// Priority system: higher numbers = higher priority
function getPriority(sourceType: string): number {
  const priorities = {
    'GITHUB_REPO': 10,
    'GITHUB_ISSUE': 8,
    'GITHUB_PR': 8,
    'WEB_PAGE': 5,
    'ARXIV_PAPER': 7,
    'YOUTUBE_VIDEO': 3,
    'PDF_DOCUMENT': 6,
    'LOCAL_FILE': 15, // Highest priority for local files
  }
  
  return priorities[sourceType as keyof typeof priorities] || 1
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down worker gracefully...')
  await processingWorker.close()
  await processingQueue.close()
  await queueEvents.close()
  await redis.quit()
  process.exit(0)
})