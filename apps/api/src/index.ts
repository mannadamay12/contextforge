// apps/api/src/index.ts
import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'

const fastify = Fastify({ logger: true })

// Register plugins
fastify.register(cors)
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'ContextForge API',
      description: 'Content aggregation API for AI workflows',
      version: '1.0.0'
    }
  }
})

// Routes
fastify.register(async () => (await import('./routes/projects')).default, { prefix: '/api/projects' })
fastify.register(async () => (await import('./routes/sources')).default, { prefix: '/api/sources' })
fastify.register(async () => (await import('./routes/aliases')).default, { prefix: '/api/aliases' })

const start = async () => {
  try {
    await fastify.listen({ port: 3001 })
    console.log('Server running on http://localhost:3001')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()