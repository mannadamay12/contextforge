// apps/api/src/index.ts
import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'

// Initialize job processing worker
import './queues/processing.js'

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
fastify.register(async function (fastify) {
  const { default: projectsRoutes } = await import('./routes/projects.js')
  await projectsRoutes(fastify)
}, { prefix: '/api/projects' })

fastify.register(async function (fastify) {
  const { default: sourcesRoutes } = await import('./routes/sources.js')
  await sourcesRoutes(fastify)
}, { prefix: '/api/sources' })

fastify.register(async function (fastify) {
  const { default: aliasesRoutes } = await import('./routes/aliases.js')
  await aliasesRoutes(fastify)
}, { prefix: '/api/aliases' })

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