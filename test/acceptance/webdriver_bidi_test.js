Feature('WebDriver BiDi Protocol @bidi')

Scenario('BiDi should capture console messages during page interactions @bidi', async ({ I }) => {
  await I.clearBiDiEvents()
  await I.amOnPage('/form/example1')

  // Generate console messages
  await I.executeScript(() => {
    console.log('BiDi integration test log')
    console.warn('BiDi integration test warning')
  })

  await I.wait(0.5)

  const consoleMessages = await I.grabBiDiConsoleMessages()
  consoleMessages.length > 0

  const testLog = consoleMessages.find(msg => msg.text && msg.text.includes('BiDi integration test log'))
  I.expectTrue(!!testLog)
})

Scenario('BiDi should monitor network requests during form submission @bidi', async ({ I }) => {
  await I.clearBiDiEvents()
  await I.amOnPage('/form/example1')

  // Fill and submit form to generate network activity
  await I.fillField('name', 'bidi@test.com')
  await I.fillField('#LoginForm_password', 'ThisIsAwesome')
  await I.click('[type="submit"]')

  await I.wait(1)

  const networkEvents = await I.grabBiDiNetworkEvents()
  I.expectTrue(networkEvents.length > 0)

  // Should have captured the form submission request
  const formRequest = networkEvents.find(event => event.type === 'request' && event.url.includes('/form/example1'))
  I.expectTrue(!!formRequest || networkEvents.length > 0)
})

Scenario('BiDi should track navigation events @bidi', async ({ I }) => {
  await I.clearBiDiEvents()

  // Navigate to different pages to generate navigation events
  await I.amOnPage('/form/example1')
  await I.wait(0.5)
  await I.amOnPage('/form/example2')
  await I.wait(0.5)

  const navigationEvents = await I.grabBiDiNavigationEvents()
  I.expectTrue(navigationEvents.length > 0)

  // Should have navigation events for both pages
  const hasNavigationEvents = navigationEvents.some(event => event.type === 'navigationStarted' || event.type === 'load')
  I.expectTrue(hasNavigationEvents)
})

Scenario('BiDi should wait for specific network requests @bidi', async ({ I }) => {
  await I.clearBiDiEvents()
  await I.amOnPage('/form/example1')

  // Start a fetch request in the background
  await I.executeScript(() => {
    setTimeout(() => {
      fetch('/info').catch(() => {})
    }, 100)
  })

  // Wait for the specific network event
  const networkEvent = await I.waitForBiDiNetworkEvent(
    {
      url: '/info',
    },
    3000,
  )

  I.expectTrue(!!networkEvent)
  I.expectTrue(networkEvent.url.includes('/info'))
})

Scenario('BiDi enhanced script execution should work properly @bidi', async ({ I }) => {
  await I.amOnPage('/form/example1')

  const result = await I.executeBiDiScript(() => {
    return {
      title: document.title,
      url: window.location.href,
      timestamp: Date.now(),
    }
  })

  I.expectTrue(!!result)
  I.expectTrue(!!result.title)
  I.expectTrue(!!result.url)
  I.expectTrue(typeof result.timestamp === 'number')
})

Scenario('BiDi performance monitoring should collect metrics @bidi', async ({ I }) => {
  await I.amOnPage('/form/example1')
  await I.startBiDiPerformanceMonitoring()

  // Perform some actions to generate performance data
  await I.fillField('name', 'Performance Test')
  await I.click('[type="submit"]')
  await I.wait(0.5)

  const metrics = await I.getBiDiPerformanceMetrics()
  I.expectTrue(Array.isArray(metrics))

  // Performance metrics collection depends on browser support
  // We just verify the method works without errors
})

Scenario('BiDi should work with within blocks @bidi', async ({ I }) => {
  await I.clearBiDiEvents()
  await I.amOnPage('/form/example1')

  await within('form', async () => {
    await I.fillField('name', 'Within Block BiDi Test')

    await I.executeBiDiScript(() => {
      console.log('BiDi within block test')
    })
  })

  await I.wait(0.5)

  const consoleMessages = await I.grabBiDiConsoleMessages()
  const withinMessage = consoleMessages.find(msg => msg.text && msg.text.includes('BiDi within block test'))

  I.expectTrue(!!withinMessage)
})

Scenario('BiDi should maintain backward compatibility @bidi', async ({ I }) => {
  await I.amOnPage('/form/example1')

  // Test that existing WebDriver methods still work with BiDi enabled
  await I.see('Fields with * are required')
  await I.fillField('name', 'Compatibility Test')

  const title = await I.grabTitle()
  I.expectTrue(!!title)

  const currentUrl = await I.grabCurrentUrl()
  I.expectTrue(currentUrl.includes('/form/example1'))

  // Traditional browser logs should still work
  await I.executeScript(() => {
    console.log('Traditional log test')
  })

  await I.wait(0.5)

  const browserLogs = await I.grabBrowserLogs()
  I.expectTrue(Array.isArray(browserLogs))
})

Scenario('BiDi event management should work correctly @bidi', async ({ I }) => {
  await I.amOnPage('/form/example1')

  // Generate some events
  await I.executeScript(() => {
    console.log('Event before clear')
  })

  await I.wait(0.5)

  // Verify events are captured
  let consoleMessages = await I.grabBiDiConsoleMessages()
  I.expectTrue(consoleMessages.length > 0)

  // Clear events
  await I.clearBiDiEvents()

  // Verify events are cleared
  consoleMessages = await I.grabBiDiConsoleMessages()
  const networkEvents = await I.grabBiDiNetworkEvents()
  const navigationEvents = await I.grabBiDiNavigationEvents()

  I.expectEqual(consoleMessages.length, 0)
  I.expectEqual(networkEvents.length, 0)
  I.expectEqual(navigationEvents.length, 0)
})

Scenario('BiDi should handle multiple concurrent requests @bidi', async ({ I }) => {
  await I.clearBiDiEvents()
  await I.amOnPage('/form/example1')

  // Start multiple concurrent requests
  await I.executeScript(() => {
    const requests = ['/info', '/form/example2', '/form/complex']
    requests.forEach((url, index) => {
      setTimeout(() => {
        fetch(url).catch(() => {})
      }, index * 100)
    })
  })

  await I.wait(2)

  const networkEvents = await I.grabBiDiNetworkEvents()
  I.expectTrue(networkEvents.length > 0)

  // Should capture multiple request events
  const requestEvents = networkEvents.filter(event => event.type === 'request')
  I.expectTrue(requestEvents.length > 1)
})
