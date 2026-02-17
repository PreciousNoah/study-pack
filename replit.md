# PrepMate - AI Study Pack Generator

## Overview

PrepMate is a full-stack web application that transforms PDF documents into AI-generated study materials. Users upload PDF files, and the system uses OpenAI to generate summaries, flashcards, and quizzes. The app features interactive flashcard flip animations, quiz scoring, and a dashboard for managing study packs.

The tech stack is:
- **Frontend**: React + TypeScript with Vite, TailwindCSS, shadcn/ui components, Framer Motion
- **Backend**: Express.js (Node/TypeScript) with REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Replit OpenID Connect (OIDC) authentication
- **AI**: OpenAI API via Replit AI Integrations for content generation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (`client/`)
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State Management**: TanStack React Query for server state; local React state for UI
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Animations**: Framer Motion for flashcard flip animations and page transitions
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

**Key pages**:
- `Landing` - Marketing/login page, redirects authenticated users to dashboard
- `Dashboard` - Lists user's study packs with upload dialog
- `StudyPackDetails` - Tabbed view showing summary, flashcards (with flip animation), and quizzes (with scoring)

**Key hooks**:
- `use-auth.ts` - Handles Replit Auth user state via `/api/auth/user`
- `use-study-packs.ts` - CRUD operations for study packs using React Query
- `use-toast.ts` - Toast notification system

### Backend (`server/`)
- **Framework**: Express.js with TypeScript, run via `tsx`
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **File Upload**: Multer with memory storage (5MB limit for PDFs)
- **PDF Processing**: `pdf-parse` library extracts text from uploaded PDFs
- **AI Generation**: OpenAI API generates summaries, flashcards, and quizzes from extracted text
- **Session Management**: Express sessions stored in PostgreSQL via `connect-pg-simple`
- **Build**: esbuild for server, Vite for client; output to `dist/`

**API Routes** (defined in `shared/routes.ts` as a contract):
- `GET /api/study-packs` - List user's study packs
- `GET /api/study-packs/:id` - Get study pack with flashcards and quizzes
- `POST /api/study-packs/generate` - Upload PDF and generate study materials (multipart/form-data)
- `DELETE /api/study-packs/:id` - Delete a study pack
- Auth routes handled by Replit Auth integration

### Shared Code (`shared/`)
- **Schema** (`schema.ts`): Drizzle ORM table definitions for `study_packs`, `flashcards`, `quizzes`
- **Auth Models** (`models/auth.ts`): `users` and `sessions` tables required by Replit Auth
- **Chat Models** (`models/chat.ts`): `conversations` and `messages` tables for the chat/audio integration
- **Route Contract** (`routes.ts`): Shared API path definitions and Zod validation schemas

### Database Schema
- **`users`** - Replit Auth users (varchar id, email, name, profile image)
- **`sessions`** - Express session storage (required for Replit Auth)
- **`study_packs`** - User's uploaded study materials (title, summary, file name, difficulty settings, generation parameters)
- **`flashcards`** - Question/answer pairs linked to study packs (cascade delete)
- **`quizzes`** - Multiple choice questions with JSONB options, linked to study packs (cascade delete)
- **`conversations`** / **`messages`** - Chat integration tables

Database migrations are managed via `drizzle-kit push` (schema-push approach, no migration files needed for dev).

### Authentication
- Replit OIDC authentication flow (`server/replit_integrations/auth/`)
- `setupAuth()` configures Passport.js with OpenID Connect strategy
- `isAuthenticated` middleware protects API routes
- User info stored in `users` table, upserted on login
- Sessions persisted in PostgreSQL `sessions` table
- Frontend checks auth via `GET /api/auth/user`, redirects to `/api/login` when unauthorized

### Replit Integrations (`server/replit_integrations/`)
Pre-built integration modules available:
- **auth/** - Replit OIDC authentication (actively used)
- **audio/** - Voice recording, playback, and streaming via OpenAI
- **chat/** - Text-based chat with OpenAI streaming
- **image/** - Image generation via OpenAI (gpt-image-1)
- **batch/** - Batch processing with rate limiting and retries

### Development vs Production
- **Dev**: `tsx server/index.ts` runs the server, Vite dev server provides HMR for the client
- **Build**: `tsx script/build.ts` builds client with Vite and server with esbuild
- **Production**: `node dist/index.cjs` serves pre-built static files

## External Dependencies

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (must be provisioned)
- `SESSION_SECRET` - Secret for Express sessions
- `ISSUER_URL` - Replit OIDC issuer (defaults to `https://replit.com/oidc`)
- `REPL_ID` - Replit environment identifier (auto-set by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key via Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL via Replit AI Integrations

### Third-Party Services
- **PostgreSQL** - Primary data store (provisioned via Replit)
- **OpenAI API** - Powers PDF content generation (summaries, flashcards, quizzes), routed through Replit AI Integrations proxy
- **Replit Auth** - OIDC-based authentication, no separate auth provider needed
- **Google Fonts** - DM Sans, Fira Code, Geist Mono, Inter, Lora font families

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit` - ORM and migration tooling for PostgreSQL
- `pdf-parse` - PDF text extraction
- `multer` - Multipart file upload handling
- `passport` / `openid-client` - OIDC authentication
- `framer-motion` - Flashcard flip and page transition animations
- `wouter` - Client-side routing
- `@tanstack/react-query` - Server state management
- `zod` / `drizzle-zod` - Schema validation
- `connect-pg-simple` - PostgreSQL session store