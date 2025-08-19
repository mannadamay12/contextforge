import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function aliasesRoutes(fastify: FastifyInstance) {
  // Get all aliases
  fastify.get('/', async (request, reply) => {
    try {
      const aliases = await prisma.alias.findMany({
        include: {
          user: true,
        },
      })
      return { aliases }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch aliases' })
    }
  })

  // Get alias by name
  fastify.get('/:name', async (request, reply) => {
    const { name } = request.params as { name: string }
    try {
      const alias = await prisma.alias.findUnique({
        where: { name },
        include: {
          user: true,
        },
      })
      if (!alias) {
        return reply.status(404).send({ error: 'Alias not found' })
      }
      return { alias }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch alias' })
    }
  })

  // Create new alias
  fastify.post('/', async (request, reply) => {
    const { name, description, sources, userId, isPublic } = request.body as {
      name: string
      description?: string
      sources: string[]
      userId: string
      isPublic?: boolean
    }
    try {
      const alias = await prisma.alias.create({
        data: {
          name,
          description,
          sources,
          userId,
          isPublic: isPublic || false,
        },
        include: {
          user: true,
        },
      })
      return { alias }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to create alias' })
    }
  })

  // Update alias
  fastify.put('/:name', async (request, reply) => {
    const { name } = request.params as { name: string }
    const { description, sources, isPublic } = request.body as {
      description?: string
      sources?: string[]
      isPublic?: boolean
    }
    try {
      const alias = await prisma.alias.update({
        where: { name },
        data: {
          description,
          sources,
          isPublic,
        },
        include: {
          user: true,
        },
      })
      return { alias }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to update alias' })
    }
  })

  // Delete alias
  fastify.delete('/:name', async (request, reply) => {
    const { name } = request.params as { name: string }
    try {
      await prisma.alias.delete({
        where: { name },
      })
      return { message: 'Alias deleted successfully' }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to delete alias' })
    }
  })
}
