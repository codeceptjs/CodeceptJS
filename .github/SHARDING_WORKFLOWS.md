# Test Sharding Workflows

This document explains the GitHub Actions workflows that demonstrate the new test sharding functionality in CodeceptJS.

## Updated/Created Workflows

### 1. `acceptance-tests.yml` (Updated)

**Purpose**: Demonstrates sharding with acceptance tests across multiple browser configurations.

**Key Features**:

- Runs traditional docker-compose tests (for backward compatibility)
- Adds new sharded acceptance tests using CodeceptJS directly
- Tests across multiple browser configurations (Puppeteer, Playwright)
- Uses 2x2 matrix: 2 configs × 2 shards = 4 parallel jobs

**Example Output**:

```
- Sharded Tests: codecept.Puppeteer.js (Shard 1/2)
- Sharded Tests: codecept.Puppeteer.js (Shard 2/2)
- Sharded Tests: codecept.Playwright.js (Shard 1/2)
- Sharded Tests: codecept.Playwright.js (Shard 2/2)
```

### 2. `sharding-demo.yml` (New)

**Purpose**: Comprehensive demonstration of sharding features with larger test suite.

**Key Features**:

- Uses sandbox tests (2 main test files) for sharding demonstration
- Shows basic sharding with 2-way split (`1/2`, `2/2`)
- Demonstrates combination of `--shuffle` + `--shard` options
- Uses `DONT_FAIL_ON_EMPTY_RUN=true` to handle cases where some shards may be empty

### 3. `test.yml` (Updated)

**Purpose**: Clarifies which tests support sharding.

**Changes**:

- Added comment explaining that runner tests are mocha-based and don't support sharding
- Points to sharding-demo.yml for examples of CodeceptJS-based sharding

## Sharding Commands Used

### Basic Sharding

```bash
npx codeceptjs run --config ./codecept.js --shard 1/2
npx codeceptjs run --config ./codecept.js --shard 2/2
```

### Combined with Other Options

```bash
npx codeceptjs run --config ./codecept.js --shuffle --shard 1/2 --verbose
```

## Test Distribution

The sharding algorithm distributes tests evenly:

- **38 tests across 4 shards**: ~9-10 tests per shard
- **6 acceptance tests across 2 shards**: 3 tests per shard
- **Uneven splits handled gracefully**: Earlier shards get extra tests when needed

## Benefits Demonstrated

1. **Parallel Execution**: Tests run simultaneously across multiple CI workers
2. **No Manual Configuration**: Automatic test distribution without maintaining test lists
3. **Load Balancing**: Even distribution ensures balanced execution times
4. **Flexibility**: Works with any number of shards and test configurations
5. **Integration**: Compatible with existing CodeceptJS features (`--shuffle`, `--verbose`, etc.)

## CI Matrix Integration

The workflows show practical CI matrix usage:

```yaml
strategy:
  matrix:
    config: ['codecept.Puppeteer.js', 'codecept.Playwright.js']
    shard: ['1/2', '2/2']
```

This creates 4 parallel jobs:

- Config A, Shard 1/2
- Config A, Shard 2/2
- Config B, Shard 1/2
- Config B, Shard 2/2

Perfect for scaling test execution across multiple machines and configurations.
