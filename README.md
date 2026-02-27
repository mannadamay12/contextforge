# ContextForge

> **Transform scattered content into AI-ready context with intelligent aggregation and optimization**

ContextForge is a modern, scalable content aggregation platform designed for AI workflows. It combines multiple data sources into optimized, LLM-ready context while providing a superior user experience through a web-based interface.

## 🚀 Features

- **Multi-Source Content Aggregation**: GitHub repos, websites, PDFs, ArXiv papers, YouTube videos
- **Intelligent Processing Engine**: Smart content extraction, deduplication, and optimization
- **Real-Time Processing Dashboard**: Live status updates and progress tracking
- **AI-Optimized Output**: Multiple formats (XML, Markdown, JSON) with token counting
- **Project Management**: Workspace organization with version history and collaboration

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Fastify API with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Queue System**: Redis with BullMQ for background processing
- **Containerization**: Docker Compose for local development

## 📋 Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (via Docker)
- Redis (via Docker)

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd contextforge
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET
# Optional: GITHUB_TOKEN, OPENAI_API_KEY, etc.
```

### 3. Start Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Install dependencies
npm run install:all

# Setup database
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Start Development Servers

```bash
# Start both frontend and API
npm run dev

# Or start individually
npm run dev:web    # Frontend on http://localhost:3000
npm run dev:api    # API on http://localhost:3001
```

## 📁 Project Structure

```
contextforge/
├── apps/
│   ├── api/          # Fastify API server
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared utilities and types
├── prisma/           # Database schema and migrations
├── docker-compose.yml
└── package.json
```

## 🗄️ Database

The project uses PostgreSQL with the following main entities:

- **Users**: Authentication and user management
- **Projects**: Workspace organization
- **Sources**: Content sources (GitHub, web pages, etc.)
- **Outputs**: Processed and optimized content
- **Aliases**: Reusable source collections

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:web          # Frontend only
npm run dev:api          # API only

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma client

# Build
npm run build            # Build all
npm run build:web        # Build frontend
npm run build:api        # Build API

# Production
npm run start            # Start production servers
```

### API Endpoints

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/sources` - List all sources
- `POST /api/sources` - Create new source
- `GET /api/aliases` - List all aliases
- `POST /api/aliases` - Create new alias

## 🚀 Deployment

### Local Production

```bash
npm run build
npm run start
```

### Docker Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request



  ┌─────────────────────────────────────────────────────────────┐
  │                    Development Setup                        │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  Host Machine                        Docker Containers     │
  │  ┌─────────────────┐                 ┌─────────────────┐   │
  │  │   Next.js Web   │                 │   PostgreSQL    │   │
  │  │  localhost:3000 │ ────────────────│  localhost:5432 │   │
  │  └─────────────────┘                 └─────────────────┘   │
  │                                                             │
  │  ┌─────────────────┐                 ┌─────────────────┐   │
  │  │  Fastify API    │                 │     Redis       │   │
  │  │  localhost:3001 │ ────────────────│  localhost:6379 │   │
  │  └─────────────────┘                 └─────────────────┘   │
  │                                                             │
  │  ┌─────────────────┐                                       │
  │  │ Shared Packages │                                       │
  │  │   Processors    │                                       │
  │  │   Enhancers     │                                       │
  │  └─────────────────┘                                       │
  └─────────────────────────────────────────────────────────────┘

  🚀 Working Features:

  - ✅ Monorepo structure with proper workspace configuration
  - ✅ Database with Prisma ORM, migrations, and seeded test data
  - ✅ API server serving JSON endpoints with database integration
  - ✅ Web app running with Turbopack for fast development
  - ✅ Background services in Docker (PostgreSQL, Redis)
  - ✅ Development scripts working correctly

  🛠️ Development Commands:

  # Start both web and API
  npm run dev

  # Individual services
  npm run dev:web      # Next.js app (localhost:3000)
  npm run dev:api      # API server (localhost:3001)

  # Database operations
  npm run db:migrate   # Run migrations
  npm run db:seed      # Seed test data
  npm run db:studio    # Open database browser

  # Dependencies
  npm run install:all  # Install all package dependencies
