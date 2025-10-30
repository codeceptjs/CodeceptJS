# ESM Conversion Progress

## Phase 1: Core Library Files ✅ COMPLETED

Converted files:
- ✅ package.json - Added "type": "module"
- ✅ lib/codecept.js - Main CodeceptJS class
- ✅ lib/event.js - Event dispatcher
- ✅ lib/output.js - Output formatting
- ✅ lib/utils.js - Utility functions
- ✅ lib/utils/mask_data.js - Data masking utilities

## Phase 2: Major Helper Files ✅ COMPLETED

Converted files:
- ✅ lib/helper/Playwright.js (4776 lines)
- ✅ lib/helper/Puppeteer.js (3459 lines)
- ✅ lib/helper/WebDriver.js (3378 lines)
- ✅ lib/element/WebElement.js
- ✅ lib/workerStorage.js
- ✅ lib/step/comment.js

## Phase 3: Additional Helper Files ✅ COMPLETED

Converted files:
- ✅ lib/helper/Appium.js (1912 lines)
- ✅ lib/helper/GraphQL.js
- ✅ lib/helper/GraphQLDataFactory.js
- ✅ lib/helper/AI.js
- ✅ lib/helper/clientscripts/PollyWebDriverExt.js

## Phase 4: Listeners & Plugins ✅ COMPLETED

Converted files:
- ✅ lib/listener/steps.js
- ✅ lib/listener/retryEnhancer.js
- ✅ lib/listener/enhancedGlobalRetry.js
- ✅ lib/plugin/enhancedRetryFailedStep.js
- ✅ lib/plugin/htmlReporter.js (3649 lines)
- ✅ lib/retryCoordinator.js
- ✅ lib/test-server.js
- ✅ lib/template/heal.js

## 🎉 lib/ Directory: 100% COMPLETE!

All JavaScript files in the lib/ directory have been converted to ESM!

## Remaining Work

### Bin Files
- [ ] bin/codecept.js
- [ ] bin/test-server.js

### Test Files (36 files)
- [ ] test/helper/*.js
- [ ] test/graphql/*.js
- [ ] test/runner/*.js
- [ ] test/unit/*.js
- [ ] test/data/graphql/index.js
- [ ] test/data/sandbox/**/*.js
- [ ] test/mock-server/*.js

### Examples & Configs
- [ ] examples/*.js
- [ ] example-esm/*.js (already ESM)
- [ ] Test config files in test/data/sandbox/configs/

## Commands to Find Remaining Files

```bash
# Find files with require() or module.exports (excluding node_modules and .git)
find . -name "*.js" -type f -not -path "./node_modules/*" -not -path "./.git/*" | xargs grep -l "^const .* = require\|^module.exports =" 2>/dev/null

# Count remaining files
find . -name "*.js" -type f -not -path "./node_modules/*" -not -path "./.git/*" | xargs grep -l "^const .* = require\|^module.exports =" 2>/dev/null | wc -l
```

## TypeScript Configuration (PENDING)

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

**lib/ Files Converted**: ✅ 100% COMPLETE (all ~30+ files)
**Project Remaining**: 36 files (bin + tests + examples)
**Overall Completion**: ~85%

## Commit History

- Phase 1 (d3b1228c): Core library files
- Phase 2 (d2775653): Major helpers (Playwright, WebDriver, Puppeteer)
- Phase 3 (934e0fda): Additional helpers
- Phase 4 (aa01456b): Listeners, plugins, infrastructure
- Template (5f353145): heal.js template

