// Test file demonstrating TypeScript features with tsx loader
import { BaseUrlPrefixes, Customer } from './common/types'

// Enum test
enum TestStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed'
}

// Interface test
interface TestData {
  id: number
  name: string
  status: TestStatus
}

// Type test
type ApiResponse = {
  success: boolean
  data: TestData[]
}

Feature('TypeScript Support with tsx')

Scenario('Basic TypeScript test with imports', ({ I }) => {
  const testData: TestData = {
    id: 1,
    name: 'Test with TypeScript',
    status: TestStatus.PASSED
  }

  // Test that imported types work
  const urlPrefix: string = BaseUrlPrefixes.apiUrl
  console.log('URL Prefix:', urlPrefix)
  console.log('Test Data:', testData)

  // Verify types are correctly used
  I.assertEqual(testData.status, TestStatus.PASSED)
  I.assertEqual(urlPrefix, 'api/v2')
})

Scenario('TypeScript enum usage', ({ I }) => {
  const statuses: TestStatus[] = [
    TestStatus.PENDING,
    TestStatus.RUNNING,
    TestStatus.PASSED,
    TestStatus.FAILED
  ]

  console.log('All test statuses:', statuses)
  I.assertEqual(statuses.length, 4)
  I.assertEqual(statuses[0], 'pending')
})

Scenario('TypeScript interface and type usage', ({ I }) => {
  const response: ApiResponse = {
    success: true,
    data: [
      { id: 1, name: 'Test 1', status: TestStatus.PASSED },
      { id: 2, name: 'Test 2', status: TestStatus.RUNNING }
    ]
  }

  console.log('API Response:', JSON.stringify(response, null, 2))
  I.assertEqual(response.success, true)
  I.assertEqual(response.data.length, 2)
})

Scenario('Complex TypeScript types from imports', ({ I }) => {
  // Test the imported custom type
  const customerId: Customer = 'UAB126' as Customer

  console.log('Customer ID:', customerId)
  console.log('Base URL Prefixes:', BaseUrlPrefixes)

  // Verify imported const object
  I.assertEqual(BaseUrlPrefixes.apiUrl, 'api/v2')
  I.assertEqual(BaseUrlPrefixes.apiVUrl, 'api')
})
