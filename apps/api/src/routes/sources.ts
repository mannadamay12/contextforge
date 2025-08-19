import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

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
