# Sauce Labs Troubleshooting Guide

This guide helps resolve common Sauce Labs infrastructure errors when running CodeceptJS tests with Appium.

## Common Error: "Infrastructure Error -- The Sauce VMs failed to start the browser or device"

This error typically occurs due to:

### 1. Missing or Invalid Credentials
```bash
# Set these environment variables before running tests
export SAUCE_USERNAME="your_sauce_username"
export SAUCE_ACCESS_KEY="your_sauce_access_key"
```

### 2. Outdated Platform/Device Combinations
The error often occurs when requesting deprecated or unavailable devices/OS versions.

**Updated Android Configuration:**
```javascript
{
  helpers: {
    Appium: {
      host: 'ondemand.us-west-1.saucelabs.com',
      port: 443,
      protocol: 'https',
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
      desiredCapabilities: {
        'sauce:options': {
          appiumVersion: '2.0.0',
          name: 'Your Test Name',
          build: process.env.BUILD_NUMBER || 'local-build',
          tags: ['codeceptjs', 'appium', 'android'],
          recordVideo: false,
          recordScreenshots: false,
          idleTimeout: 300,
          newCommandTimeout: 300,
        },
        browserName: '',
        platformName: 'Android',
        platformVersion: '12.0', // Use recent versions
        deviceName: 'Google Pixel 6 GoogleAPI Emulator',
        automationName: 'UiAutomator2',
        autoGrantPermissions: true,
        noReset: true,
        app: 'sauce-storage:your-app.apk'
      }
    }
  }
}
```

**Updated iOS Configuration:**
```javascript
{
  helpers: {
    Appium: {
      host: 'ondemand.us-west-1.saucelabs.com',
      port: 443,
      protocol: 'https',
      user: process.env.SAUCE_USERNAME,
      key: process.env.SAUCE_ACCESS_KEY,
      desiredCapabilities: {
        'sauce:options': {
          appiumVersion: '2.0.0',
          name: 'Your iOS Test',
          build: process.env.BUILD_NUMBER || 'local-build',
          tags: ['codeceptjs', 'appium', 'ios'],
          recordVideo: false,
          recordScreenshots: false,
          idleTimeout: 300,
          newCommandTimeout: 300,
        },
        browserName: '',
        platformName: 'iOS',
        platformVersion: '16.0', // Use recent versions
        deviceName: 'iPhone 14 Simulator',
        automationName: 'XCUITest',
        autoAcceptAlerts: true,
        noReset: true,
        app: 'sauce-storage:your-ios-app.ipa'
      }
    }
  }
}
```

### 3. Regional Endpoint Issues
Use specific regional endpoints instead of the generic one:
- US West: `ondemand.us-west-1.saucelabs.com`
- US East: `ondemand.us-east-1.saucelabs.com`
- EU: `ondemand.eu-central-1.saucelabs.com`

### 4. App Upload Issues
Ensure your app is properly uploaded to Sauce Storage:
```bash
# Upload app to Sauce Labs
curl -u "$SAUCE_USERNAME:$SAUCE_ACCESS_KEY" \
  -X POST "https://api.us-west-1.saucelabs.com/rest/v1/storage/upload" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @your-app.apk
```

### 5. Capability Validation
Before running tests, validate your capabilities using Sauce Labs Platform Configurator:
https://saucelabs.com/platform/platform-configurator

### 6. Alternative Workarounds

**Local Testing Fallback:**
```javascript
const sauceConfig = {
  // Sauce Labs configuration
};

const localConfig = {
  host: 'localhost',
  port: 4723,
  protocol: 'http',
  desiredCapabilities: {
    platformName: 'Android',
    platformVersion: '11.0',
    deviceName: 'Android Emulator',
    automationName: 'UiAutomator2',
    app: '/path/to/your/app.apk'
  }
};

// Use local config if Sauce Labs credentials are missing
const config = (process.env.SAUCE_USERNAME && process.env.SAUCE_ACCESS_KEY) 
  ? sauceConfig 
  : localConfig;
```

### 7. Debugging Steps

1. **Check Sauce Labs service status:**
   ```bash
   curl -s "https://saucelabs.com/rest/v1/info/status"
   ```

2. **Verify account limits:**
   - Check concurrent session limits
   - Verify account is not suspended
   - Ensure sufficient credits/minutes

3. **Test with basic capabilities:**
   Start with minimal capabilities and add complexity gradually.

4. **Monitor Sauce Labs dashboard:**
   Check real-time test execution in the Sauce Labs dashboard for detailed error messages.

### 8. Best Practices

- Use HTTPS protocol for better security
- Set appropriate timeouts (300+ seconds for mobile tests)
- Use specific device names rather than generic ones
- Keep platform versions current (within 2-3 major versions)
- Use `sauce:options` for Sauce Labs specific configurations
- Enable `noReset: true` to speed up test execution
- Set meaningful test names and builds for better organization

### 9. Contact Support

If issues persist after following this guide:
- Check Sauce Labs status page: https://status.saucelabs.com/
- Contact Sauce Labs support with your session ID and error details
- Consider using alternative cloud providers (BrowserStack, etc.)