import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@contextforge.com' },
    update: {},
    create: {
      email: 'test@contextforge.com',
      name: 'Test User',
    },
  })

  // Create a test project
  const project = await prisma.project.upsert({
    where: { id: 'test-project-1' },
    update: {},
    create: {
      id: 'test-project-1',
      name: 'Sample AI Research Project',
      description: 'A sample project to demonstrate ContextForge capabilities',
      userId: user.id,
    },
  })

  // Create a test alias
  const alias = await prisma.alias.upsert({
    where: { name: 'react-docs' },
    update: {},
    create: {
      name: 'react-docs',
      description: 'React documentation and guides',
      sources: [
        'https://react.dev/learn',
        'https://react.dev/reference',
        'https://github.com/facebook/react'
      ],
      userId: user.id,
      isPublic: true,
    },
  })

  console.log({ user, project, alias })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
