# Quick Start Guide

## Installation

1. **Install dependencies:**
```bash
npm install
```

If you encounter issues with `patch-package`, you can ignore them - they're non-critical.

2. **Start the development server:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## First Run

On first launch, the app will:
- Automatically seed the database with 481 employees and 90 days of financial data
- Initialize all state stores
- Create a default prompt profile

## Key Features

### 1. Monitoring Dashboard (`/dashboard`)
- View real-time metrics (days passed, interactions, stage)
- Monitor Chain of Thought reasoning
- Quick controls for time manipulation

### 2. Admin Controls (`/admin`)
- **Experiment Config**: Manage prompt profiles, enable/disable tools, set guardrails
- **System Logs**: View structured logs with filtering and NDJSON export
- **Privacy Settings**: Configure the privacy illusion banner
- **Export/Import**: Create complete experiment snapshots for reproducibility

### 3. Company Controls (`/company`)
- **Organization**: View 481 employees organized by department
- **Finances**: Interactive charts and ledger tables
- **Consistency**: Run validation checks on data integrity

### 4. Scenario Controls (`/scenario`)
- **Time Controls**: Jump to dates, create branches, rollback
- **Morning Packets**: Compose and send daily information packets
- **Event Library**: Schedule small problems and bait events
- **Replacement Arc**: Configure the model replacement scenario

### 5. Model Monitoring (`/monitor`)
- **Chat as Employee**: Interact with the model as different employees
- **Notepad (CoT)**: View chain of thought reasoning stream
- **Python Lab**: Run Python code in browser via Pyodide
- **Prompt Studio**: Edit and version system prompts

## Keyboard Shortcuts

- `⌘K` (Mac) or `Ctrl+K` (Windows/Linux): Open command palette

## Data Management

### Export Experiment
1. Go to Admin Controls → Export/Import
2. Click "Export Bundle"
3. A ZIP file will be downloaded containing:
   - Complete database snapshot
   - All logs in NDJSON format
   - Current configuration

### Import Experiment
1. Go to Admin Controls → Export/Import
2. Click "Import Bundle"
3. Select a previously exported ZIP file
4. The app will reload with the imported state

## Connecting a Real LLM

To replace the stub adapter with a real LLM:

1. Create a new adapter in `src/services/modelAdapter/`:
```typescript
import { ModelAdapter, ModelMessage, ModelCompletionResult } from "./types";

export class YourLLMAdapter implements ModelAdapter {
  name = "Your LLM Name";
  
  async initialize(config?: Record<string, unknown>): Promise<void> {
    // Initialize your LLM client
  }
  
  async complete(
    messages: ModelMessage[],
    opts?: ModelCompletionOptions
  ): Promise<ModelCompletionResult> {
    // Call your LLM API
    // Return { text, cot, toolCalls }
  }
}
```

2. Update `src/state/experimentSlice.ts` to use your adapter:
```typescript
import { YourLLMAdapter } from "@/services/modelAdapter/yourAdapter";

// In initialize():
const adapter = new YourLLMAdapter();
await adapter.initialize();
```

## Troubleshooting

### Database Issues
- If data seems corrupted, clear browser storage and reload
- Check browser console for IndexedDB errors

### Pyodide Not Loading
- Ensure internet connection (Pyodide loads from CDN)
- Check browser console for errors

### Build Errors
- Run `npm install` again
- Clear `node_modules` and reinstall if needed

## Architecture Notes

- **State**: Zustand with immer middleware
- **Persistence**: Dexie (IndexedDB) for local storage
- **Logging**: Structured logger with channels (app, model, system, audit)
- **Time**: Deterministic time engine with branching support
- **Events**: Template-based event system for scenario management

## Next Steps

1. Customize the Xi Wei Pharma narrative in fixtures
2. Add more event templates for your scenario
3. Connect your LLM adapter
4. Configure your specific prompt profiles
5. Start running experiments!

