import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function projectsRoutes(fastify: FastifyInstance) {
  // Get all projects
  fastify.get('/', async (request, reply) => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          user: true,
          sources: true,
          outputs: true,
        },
      })
      return { projects }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch projects' })
    }
  })

  // Get project by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          user: true,
          sources: true,
          outputs: true,
        },
      })
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' })
      }
      return { project }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch project' })
    }
  })

  // Create new project
  fastify.post('/', async (request, reply) => {
    const { name, description, userId } = request.body as {
      name: string
      description?: string
      userId: string
    }
    try {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          userId,
        },
        include: {
          user: true,
        },
      })
      return { project }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to create project' })
    }
  })

  // Update project
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { name, description } = request.body as {
      name?: string
      description?: string
    }
    try {
      const project = await prisma.project.update({
        where: { id },
        data: {
          name,
          description,
        },
        include: {
          user: true,
        },
      })
      return { project }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to update project' })
    }
  })

  // Delete project
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await prisma.project.delete({
        where: { id },
      })
      return { message: 'Project deleted successfully' }
    } catch (error) {
      reply.status(500).send({ error: 'Failed to delete project' })
    }
  })
}
