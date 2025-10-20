# ESM Conversion Status

## Overview

Converting CodeceptJS from CommonJS (require/module.exports) to ESM (import/export) as part of the 4.x branch rebase.

## Progress: 21/30 files converted (70%)

### ✅ Completed (21 files)

#### Core Library Files
- [x] lib/utils/mask_data.js
- [x] lib/within.js
- [x] lib/retryCoordinator.js
- [x] lib/element/WebElement.js

#### Step & Template Files
- [x] lib/step/comment.js
- [x] lib/template/heal.js

#### Listener Files
- [x] lib/listener/retryEnhancer.js
- [x] lib/listener/enhancedGlobalRetry.js

#### Plugin Files (9/14)
- [x] lib/plugin/allure.js
- [x] lib/plugin/autoLogin.js
- [x] lib/plugin/eachElement.js
- [x] lib/plugin/enhancedRetryFailedStep.js
- [x] lib/plugin/fakerTransform.js
- [x] lib/plugin/retryTo.js
- [x] lib/plugin/tryTo.js
- [x] lib/plugin/standardActingHelpers.js

#### Helper Files (5/12)
- [x] lib/helper/AI.js
- [x] lib/helper/GraphQL.js
- [x] lib/helper/extras/PlaywrightReactVueLocator.js
- [x] lib/helper/testcafe/testcafe-utils.js
- [x] lib/helper/testcafe/testControllerHolder.js

## Remaining Files (9)

### High Priority
1. **lib/plugin/htmlReporter.js** (3648 lines)
   - Status: Not converted
   - Reason: Very large file, complex structure
   - Impact: Medium - used for HTML reporting

2. **lib/test-server.js** (323 lines)
   - Status: Not converted
   - Reason: Internal test server implementation
   - Impact: Low - internal testing only

3. **lib/helper/GraphQLDataFactory.js** (308 lines)
   - Status: Not converted
   - Reason: Moderate size
   - Impact: Medium - GraphQL testing

### Medium Priority (Plugins)
4. **lib/plugin/commentStep.js** (141 lines)
   - Status: Not converted
   - Impact: Medium

5. **lib/plugin/wdio.js** (247 lines)
   - Status: Not converted
   - Impact: Medium - WebDriver IO integration

6. **lib/plugin/selenoid.js** (364 lines)
   - Status: Not converted
   - Impact: Low - Selenoid-specific

### Low Priority (Deprecated/Legacy Helpers)
7. **lib/helper/Appium.js** (1789 lines)
   - Status: Not converted
   - Note: Large file, consider if still actively used

8. **lib/helper/Nightmare.js** (1486 lines)
   - Status: Not converted
   - Note: DEPRECATED - Nightmare helper is no longer maintained

9. **lib/helper/TestCafe.js** (1391 lines)
   - Status: Not converted
   - Note: DEPRECATED - TestCafe integration

10. **lib/helper/Protractor.js** (1840 lines)
    - Status: Not converted
    - Note: DEPRECATED - Protractor is no longer maintained

## Conversion Pattern

Each file is converted using the following pattern:

### From CommonJS:
```javascript
const module = require('./module')
const { export1, export2 } = require('./other')

class MyClass {}

module.exports = MyClass
// or
module.exports = { export1, export2 }
```

### To ESM:
```javascript
import module from './module.js'
import { export1, export2 } from './other.js'

class MyClass {}

export default MyClass
// or
export { export1, export2 }
```

## Key Changes

1. Replace `require()` with `import`
2. Replace `module.exports` with `export default` or named exports
3. Add `.js` extension to local imports
4. Update class inheritance (e.g., `Helper` → `HelperModule`)

## Next Steps

1. Convert remaining high-priority files (htmlReporter, test-server, GraphQLDataFactory)
2. Convert remaining medium-priority plugins
3. Consider deprecating or removing legacy helpers (Nightmare, Protractor, TestCafe)
4. Run full test suite to verify conversions
5. Fix any import/export issues that arise

## Testing Requirements

After conversion, verify:
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Acceptance tests pass
- [ ] Plugin functionality works
- [ ] Helper loading works correctly

## Notes

- Some deprecated helpers (Nightmare, TestCafe, Protractor) may not need conversion if they're being phased out
- The htmlReporter.js file is very large and may need careful manual conversion
- All conversions maintain the same API to ensure backward compatibility
