# ESM Conversion Progress

## Phase 1: Core Library Files ✅ COMPLETED

Converted files:
- ✅ package.json - Added "type": "module"
- ✅ lib/codecept.js - Main CodeceptJS class
- ✅ lib/event.js - Event dispatcher
- ✅ lib/output.js - Output formatting
- ✅ lib/utils.js - Utility functions
- ✅ lib/utils/mask_data.js - Data masking utilities

## Phase 2: Helper Files (IN PROGRESS)

Files requiring conversion:
- [ ] lib/helper/Playwright.js
- [ ] lib/helper/Puppeteer.js
- [ ] lib/helper/WebDriver.js  
- [ ] lib/helper/Appium.js
- [ ] lib/helper/GraphQL.js
- [ ] lib/helper/AI.js
- [ ] lib/helper/* (other helpers)

## Phase 3: Core Infrastructure

- [ ] lib/container.js
- [ ] lib/workers.js
- [ ] lib/workerStorage.js
- [ ] lib/recorder.js
- [ ] lib/step/*.js
- [ ] lib/listener/*.js
- [ ] lib/plugin/*.js
- [ ] lib/element/WebElement.js

## Phase 4: Command & Mocha Integration

- [ ] lib/command/*.js
- [ ] lib/mocha/*.js
- [ ] lib/data/*.js

## Phase 5: Test Files

- [ ] test/**/*.js (all test files)

## Phase 6: Examples & Templates

- [ ] examples/*.js
- [ ] lib/template/*.js

## Commands to Find Remaining Files

```bash
# Find files with require()
find lib -name "*.js" | xargs grep -l "require("

# Find files with module.exports
find lib -name "*.js" | xargs grep -l "module.exports"

# Count remaining files
find lib -name "*.js" | xargs grep -l "^const .* = require\|^module.exports" | wc -l
```

## TypeScript Configuration

The tsconfig.json will need to be updated to support ESM:
```json
{
  "compilerOptions": {
    "module": "ES2022",
    "target": "ES2022",
    "moduleResolution": "node16"
  }
}
```

## Testing Strategy

After each phase:
1. Run linter: `npm run lint`
2. Run unit tests: `npm run test:unit`
3. Run integration tests progressively
4. Fix any runtime errors

## Current Status

**Files Converted**: 6
**Estimated Remaining**: ~150
**Completion**: ~4%
