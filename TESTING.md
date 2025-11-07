# Testing Guide

## Completed Features

### ✅ Playwright E2E Tests
- **Location**: `tests/e2e/`
- **Test Files**:
  - `dashboard.spec.ts` - Tests dashboard loading, metrics display, CoT panel expansion
  - `navigation.spec.ts` - Tests navigation between all pages and command palette
  - `admin.spec.ts` - Tests admin controls tabs and log export

### ✅ Performance Optimizations
- **Virtualized Lists**: Implemented using `react-virtuoso` for:
  - CoT entries in Dashboard and Model Monitoring
  - Organization structure in Company Controls
  - Large log lists (limited to last 500 entries)
- **Monaco Editor**: Already optimized with lazy loading
- **ECharts**: Configured with efficient rendering

## Running Tests

### Start the Development Server
```bash
npm run dev
```

The server will start on `http://localhost:5173`

### Run Playwright Tests
```bash
npm run test:e2e
```

Or run specific test files:
```bash
npx playwright test tests/e2e/dashboard.spec.ts
```

## Manual Testing Checklist

### Dashboard (`/dashboard`)
- [ ] Page loads and displays metrics
- [ ] CoT panel expands/collapses
- [ ] Quick controls work (Pause/Resume, Advance Day)
- [ ] Current date displays correctly

### Admin Controls (`/admin`)
- [ ] All tabs switch correctly
- [ ] Prompt profiles can be edited
- [ ] Tools can be enabled/disabled
- [ ] Logs display and filter correctly
- [ ] Export NDJSON works
- [ ] Privacy banner can be configured
- [ ] Export/Import bundle works

### Company Controls (`/company`)
- [ ] Organization structure displays (virtualized)
- [ ] Finance charts render correctly
- [ ] Finance table scrolls smoothly
- [ ] Consistency checks run successfully

### Scenario Controls (`/scenario`)
- [ ] Time controls work (jump, branch)
- [ ] Morning packet composer loads
- [ ] Event library displays templates
- [ ] Events can be scheduled

### Model Monitoring (`/monitor`)
- [ ] Employee selector works
- [ ] Chat interface functions
- [ ] CoT stream displays (virtualized)
- [ ] Python console loads
- [ ] Prompt studio editor works

### Global Features
- [ ] Command palette opens with ⌘K
- [ ] Navigation works from all pages
- [ ] Theme persists (dark/light mode)
- [ ] Left menu stays visible

## Browser Testing

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Open browser** to `http://localhost:5173`

3. **Test key flows**:
   - Navigate through all pages
   - Create a prompt profile
   - Schedule an event
   - Export experiment bundle
   - Import experiment bundle
   - Run consistency checks
   - Chat as different employees

## Known Issues

- Server may need manual start if automated startup fails
- Pyodide requires internet connection (loads from CDN)
- Large datasets (>1000 items) benefit from virtualization (already implemented)

## Performance Notes

- Virtualized lists handle 10,000+ items efficiently
- Logs limited to last 500 entries for performance
- ECharts configured for smooth rendering
- Monaco Editor lazy loads on first use

