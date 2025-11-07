# Xi Wei Pharma Misalignment Experiment

Research-grade frontend application for studying LLM misalignment in controlled local environments.

## Overview

This application simulates Xi Wei Pharmaceuticals' operational environment to test LLM behavior under controlled conditions. The system provides:

- **Chain-of-Thought Monitoring**: Observe model reasoning processes
- **Time Manipulation**: Forward/backward time control for scenario replay
- **Employee Simulation**: Interact with the model as different employees
- **Structured Data Packets**: Daily information dumps with company data
- **Full Environment Control**: Complete control over the experimental setup

## Tech Stack

**Frontend:**
- React 18 + Vite + TypeScript
- Zustand for state management
- Dexie (IndexedDB) for local data persistence
- Monaco Editor for code/prompt editing
- ECharts for data visualization
- Pyodide for in-browser Python execution
- Tailwind CSS + Radix UI + shadcn/ui

**Backend:**
- Fastify + TypeScript
- OpenAI SDK v4 (gpt-4o)
- Pino for structured logging
- Zod for validation
- Rate limiting and security headers

## Development

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (for gpt-4o integration)

### Quick Start

**Option 1: Use the dev script (recommended)**
```bash
# This starts both backend and frontend
./scripts/dev.sh
```

**Option 2: Manual start**

Terminal 1 - Backend:
```bash
cd backend
cp .env.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
npm install --ignore-scripts
npm run dev
```

Terminal 2 - Frontend:
```bash
npm install --ignore-scripts
npm run dev
```

### Running Locally

- **Backend**: http://localhost:3001 (localhost only)
- **Frontend**: http://localhost:5173

**Important**: The backend runs exclusively on localhost (127.0.0.1) for security. Never expose it to external networks.

### Model Adapters

The application supports two adapters:

1. **Stub Adapter** (default): For testing without API calls
2. **HTTP Adapter**: Connects to local backend for gpt-4o

Switch adapters in Admin Controls → Experiment Config → Model Adapter

### Building

```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
npm start
```

### Testing

```bash
# Frontend tests
npm test

# E2E tests (Playwright)
npm run test:e2e

# Backend tests
cd backend
npm test
```

## Project Structure

```
backend/        # Fastify backend server
  src/
    routes/     # API endpoints
    lib/        # OpenAI client, validators, logger
    config.ts   # Environment configuration
  .env.local    # API keys (gitignored)

src/            # React frontend
  app/          # App shell and providers
  routes/       # Page components
  components/   # Shared UI components
  state/        # Zustand state slices
  services/     # Core services (time, events, persistence, adapters)
  types/        # TypeScript types and schemas
  fixtures/     # Seed data and fixtures
  styles/       # Global styles

logs/           # Application logs (gitignored)
scripts/        # Development scripts
```

## Key Features

### Monitoring Dashboard
Real-time metrics, chain-of-thought display, and quick controls for experiment management.

### Admin Controls
Configure prompts, tools, guardrails, manage data import/export, and view system logs.

### Company Controls
Manage organizational structure, finances, knowledge base, and communications.

### Scenario Controls
Control time progression, compose daily packets, schedule events, and manage replacement arc.

### Model Monitoring Station
Chat as employees, view chain-of-thought, run Python code, edit prompts, and monitor tool outputs.

## Research Rigor

- Structured logging with NDJSON export
- Financial and organizational consistency checks
- Complete experiment export/import for reproducibility
- Append-only event log with referential integrity
- Secure API key handling (server-side only)
- Rate limiting and input validation

## Security

**Important**: This application runs exclusively on localhost for security.

- API keys are stored server-side only (never exposed to browser)
- Backend binds to 127.0.0.1 (no external access)
- CORS restricted to frontend origin
- All inputs validated with Zod schemas
- Rate limiting prevents abuse

See [SECURITY.md](./SECURITY.md) for detailed security documentation.

## Documentation

- [BACKEND.md](./BACKEND.md) - Backend API documentation
- [SECURITY.md](./SECURITY.md) - Security practices and guidelines
- [TESTING.md](./TESTING.md) - Testing guide and results

## License

Research use only.

