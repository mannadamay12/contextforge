import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'
import { GitHubProcessor } from '../../../../packages/shared/dist/processors/github.js'
import { addProcessingJob, processingQueue } from '../queues/processing.js'

const prisma = new PrismaClient()

export default async function sourcesRoutes(fastify: FastifyInstance) {
  // Get all sources
  fastify.get('/', async (request, reply) => {
    try {
      const sources = await prisma.source.findMany({
        include: {
          project: true,
        },
      })
      return { sources }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch sources' })
    }
  })

  // Get source by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const source = await prisma.source.findUnique({
        where: { id },
        include: {
          project: true,
        },
      })
      if (!source) {
        return reply.status(404).send({ error: 'Source not found' })
      }
      return { source }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch source' })
    }
  })

  // Create new source
  fastify.post('/', async (request, reply) => {
    const { projectId, type, url, content, metadata } = request.body as {
      projectId: string
      type: string
      url?: string
      content?: string
      metadata?: any
    }
    try {
      const source = await prisma.source.create({
        data: {
          projectId,
          type: type as any,
          url,
          content,
          metadata,
          status: 'PENDING', // Set initial status
        },
        include: {
          project: true,
        },
      })
      return { source }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to create source' })
    }
  })

  // Create and queue source for processing
  fastify.post('/create-and-process', async (request, reply) => {
    const { projectId, type, url, userId } = request.body as {
      projectId: string
      type: string
      url: string
      userId?: string
    }
    
    try {
      // Create the source in database
      const source = await prisma.source.create({
        data: {
          projectId,
          type: type as any,
          url,
          status: 'PENDING',
          metadata: {
            queuedAt: new Date().toISOString()
          }
        },
        include: {
          project: true,
        },
      })

      // Add to processing queue
      const job = await addProcessingJob({
        sourceId: source.id,
        projectId,
        type,
        url,
        userId
      })

      return { 
        source,
        job: {
          id: job.id,
          name: job.name,
          data: job.data
        }
      }
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to create and queue source',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Update source
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { type, url, content, metadata, status } = request.body as {
      type?: string
      url?: string
      content?: string
      metadata?: any
      status?: string
    }
    try {
      const source = await prisma.source.update({
        where: { id },
        data: {
          type: type as any,
          url,
          content,
          metadata,
          status: status as any,
        },
        include: {
          project: true,
        },
      })
      return { source }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to update source' })
    }
  })

  // Process source (test endpoint)
  fastify.post('/process', async (request, reply) => {
    const { url, type } = request.body as { url: string; type: string }
    
    try {
      if (type === 'GITHUB_REPO') {
        const processor = new GitHubProcessor()
        const result = await processor.process({ url, type })
        return { result }
      } else {
        return reply.status(400).send({ error: 'Unsupported source type' })
      }
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to process source',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Get job status
  fastify.get('/jobs/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string }
    
    try {
      const job = await processingQueue.getJob(jobId)
      
      if (!job) {
        return reply.status(404).send({ error: 'Job not found' })
      }

      const state = await job.getState()
      
      return {
        job: {
          id: job.id,
          name: job.name,
          data: job.data,
          state,
          progress: job.progress,
          returnvalue: job.returnvalue,
          failedReason: job.failedReason,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn
        }
      }
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Get queue statistics
  fastify.get('/queue/stats', async (request, reply) => {
    try {
      const waiting = await processingQueue.getWaiting()
      const active = await processingQueue.getActive()
      const completed = await processingQueue.getCompleted()
      const failed = await processingQueue.getFailed()

      return {
        stats: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length
        },
        jobs: {
          waiting: waiting.slice(0, 5).map(job => ({
            id: job.id,
            name: job.name,
            data: job.data
          })),
          active: active.slice(0, 5).map(job => ({
            id: job.id,
            name: job.name,
            data: job.data,
            progress: job.progress
          }))
        }
      }
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to get queue stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // Delete source
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await prisma.source.delete({
        where: { id },
      })
      return { message: 'Source deleted successfully' }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to delete source' })
    }
  })
}
