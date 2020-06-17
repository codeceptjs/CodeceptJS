const wd = new CodeceptJS.WebDriver()

wd.amOnPage() // $ExpectError
wd.amOnPage('') // $ExpectType void

wd.click() // $ExpectError
wd.click('div') // $ExpectType void
wd.click({ css: 'div' })
wd.click({ xpath: '//div' })
wd.click({ name: 'div' })
wd.click({ id: 'div' })
wd.click({ android: 'div' })
wd.click({ ios: 'div' })
wd.click(locate('div'))
wd.click('div', 'body')
wd.click('div', locate('div'))
wd.click('div', { css: 'div' })
wd.click('div', { xpath: '//div' })
wd.click('div', { name: '//div' })
wd.click('div', { id: '//div' })
wd.click('div', { android: '//div' })
wd.click('div', { ios: '//div' })

wd.forceClick() // $ExpectError
wd.forceClick('div') // $ExpectType void
wd.forceClick({ css: 'div' })
wd.forceClick({ xpath: '//div' })
wd.forceClick({ name: 'div' })
wd.forceClick({ id: 'div' })
wd.forceClick({ android: 'div' })
wd.forceClick({ ios: 'div' })
wd.forceClick(locate('div'))
wd.forceClick('div', 'body')
wd.forceClick('div', locate('div'))
wd.forceClick('div', { css: 'div' })
wd.forceClick('div', { xpath: '//div' })
wd.forceClick('div', { name: '//div' })
wd.forceClick('div', { id: '//div' })
wd.forceClick('div', { android: '//div' })
wd.forceClick('div', { ios: '//div' })

wd.grabAllWindowHandles() // $ExpectType string[]
wd.grabCurrentWindowHandle() // $ExpectType string
