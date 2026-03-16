# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**waoowaoo** — AI-powered short drama / comic video studio. Takes novel text as input and produces complete videos through a multi-stage pipeline: story analysis → script → storyboard → image generation → video generation → voiceover → lip-sync.

## Development Commands

```bash
# Local dev (starts Next.js + workers + watchdog + Bull Board concurrently)
npm run dev

# Infrastructure only (MySQL, Redis, MinIO)
docker compose up mysql redis minio -d

# Database schema sync (no migrations, uses db push)
npx prisma db push

# Build
npm run build

# Type check
npm run typecheck

# Lint
npm run lint:all

# Full pre-commit verification
npm run verify:commit   # lint + typecheck + test:behavior:full

# Tests
npm run test:behavior:full          # Guards + unit + API contract + chain tests
npm run test:behavior:unit          # Unit tests only
npm run test:behavior:api           # API contract tests
npm run test:behavior:chain         # Integration chain tests
vitest run tests/path/to/file.ts    # Run a single test file
```

Bull Board (queue dashboard): http://localhost:3010

## Architecture

### Process Model

`npm run dev` / `npm run start` spawns 4 concurrent processes:
1. **Next.js** — serves frontend + API routes
2. **Worker** (`src/lib/workers/index.ts`) — BullMQ consumers for all 4 queues
3. **Watchdog** (`scripts/watchdog.ts`) — detects stalled tasks and marks them failed
4. **Bull Board** (`scripts/bull-board.ts`) — queue monitoring UI on port 3010

### Request → Queue → Worker Flow

```
FE (React Query) → POST /api/tasks
  → createTask() saves to DB (tasks table)
  → enqueue to BullMQ Redis queue (IMAGE | VIDEO | VOICE | TEXT)
  → Worker picks up job
  → withTaskLifecycle() wrapper:
      tryMarkTaskProcessing()
      → execute handler (src/lib/workers/handlers/)
      → reportTaskProgress()
      → update DB (panel.imageUrl, panel.videoUrl, etc.)
      tryMarkTaskCompleted() / tryMarkTaskFailed()
      → publishTaskEvent() via SSE
  → FE receives SSE event → React Query refetch → UI update
```

Real-time updates flow through `/api/sse` (Server-Sent Events). FE subscribes on mount and invalidates React Query cache on task events.

### Queue Types

| Queue | Concurrency (env) | Task Types |
|---|---|---|
| TEXT | `QUEUE_CONCURRENCY_TEXT` (50) | ANALYZE_NOVEL, STORY_TO_SCRIPT_RUN, SCRIPT_TO_STORYBOARD_RUN, LLM tasks |
| IMAGE | `QUEUE_CONCURRENCY_IMAGE` (50) | IMAGE_PANEL, IMAGE_CHARACTER, IMAGE_LOCATION, PANEL_VARIANT |
| VIDEO | `QUEUE_CONCURRENCY_VIDEO` (50) | VIDEO_PANEL, LIP_SYNC |
| VOICE | `QUEUE_CONCURRENCY_VOICE` (20) | VOICE_LINE, VOICE_DESIGN |

### Video Creation Pipeline (novel-promotion mode)

```
ANALYZE_NOVEL (TEXT)          → parse story → episodes, characters, locations, clips
STORY_TO_SCRIPT_RUN (TEXT)    → generate detailed script
SCRIPT_TO_STORYBOARD_RUN (TEXT) → generate storyboard shot descriptions
IMAGE_CHARACTER / IMAGE_LOCATION (IMAGE) → reference images for assets
IMAGE_PANEL (IMAGE)           → generate panel frames
VIDEO_PANEL (VIDEO)           → image-to-video per panel
VOICE_LINE (VOICE)            → TTS synthesis per line
LIP_SYNC (VIDEO)              → video + audio → lip-sync video
```

### Key Directory Map

```
src/
├── app/
│   ├── [locale]/workspace/          # All UI pages (8 stages)
│   └── api/                         # Next.js API routes
├── lib/
│   ├── workers/
│   │   ├── handlers/                # ~48 task handler files (one per task type)
│   │   ├── {image,video,voice,text}.worker.ts
│   │   └── shared.ts                # withTaskLifecycle(), reportTaskProgress()
│   ├── task/
│   │   ├── service.ts               # createTask(), queryTasks()
│   │   ├── queues.ts                # BullMQ queue instances
│   │   ├── submitter.ts             # submitTask() — used by API + internal
│   │   └── publisher.ts             # SSE event publishing
│   ├── generators/
│   │   ├── factory.ts               # createImageGenerator(), createVideoGenerator()
│   │   └── {image,video,audio}/     # Provider implementations (FAL, Google, Vidu, etc.)
│   ├── novel-promotion/             # Core domain logic for the pipeline
│   ├── llm/                         # LLM abstraction (chat-completion, streaming)
│   ├── storage/                     # Storage abstraction (MinIO / COS / local)
│   ├── billing/                     # Credit freeze/settle per task
│   ├── model-gateway/               # Routes requests to correct AI provider
│   └── model-capabilities/          # Per-model feature flags / capability catalog
├── components/                      # React UI components
└── types/                           # Shared TypeScript types
```

### Important Patterns

**`withTaskLifecycle()`** (`src/lib/workers/shared.ts`) — wraps every handler. Handles status transitions, billing settlement, error classification, and event publishing. All new task handlers must use this.

**Generator factory pattern** — never call AI provider APIs directly from task handlers. Use `createImageGenerator(modelId)`, `createVideoGenerator(modelId)`, `createAudioGenerator(modelId)` from `src/lib/generators/factory.ts`.

**Model capabilities** (`src/lib/model-capabilities/`) — model features (supported resolutions, aspect ratios, generation modes) are declared in a catalog. Do not hardcode capability checks inline (enforced by `check:no-hardcoded-model-capabilities` guard).

**Media normalization** — all outbound image references must go through `normalizeImageReference()`. Enforced by `check:outbound-image-unification` guard.

**API routes** — all routes must use the `apiHandler()` wrapper from `src/lib/api-auth.ts` for auth + error handling. Enforced by `check:api-handler` guard.

**No direct LLM calls from API routes** — LLM calls must happen inside workers, not in API route handlers. Enforced by `check:no-api-direct-llm-call` guard.

### Database

Uses Prisma with `db push` (no migration files). Schema is at `prisma/schema.prisma`.

Key models: `novel_promotion_projects`, `novel_promotion_episodes`, `novel_promotion_clips`, `novel_promotion_shots`, `novel_promotion_storyboards`, `novel_promotion_panels`, `novel_promotion_voice_lines`, `novel_promotion_characters`, `novel_promotion_locations`, `tasks`, `task_events`.

### Environment

Copy `.env.example` to `.env`. Key vars:
- `DATABASE_URL` — MySQL connection string
- `REDIS_HOST` / `REDIS_PORT` — BullMQ backend
- `STORAGE_TYPE` — `minio` | `local` | `cos`
- `BILLING_MODE` — `OFF` for local dev
- `NEXTAUTH_SECRET` — required for auth
- Queue concurrency: `QUEUE_CONCURRENCY_{IMAGE,VIDEO,VOICE,TEXT}`

### Guards (automated code contracts)

Many architectural rules are enforced via static analysis scripts in `scripts/guards/`. They run as part of `test:behavior:guards`. Before adding new task types, API routes, or model capabilities, check which guards apply (`check:test-tasktype-coverage`, `check:test-route-coverage`, `check:capability-catalog`, `check:pricing-catalog`).
