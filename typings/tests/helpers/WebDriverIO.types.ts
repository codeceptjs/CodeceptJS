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

wd.doubleClick() // $ExpectError
wd.doubleClick('div') // $ExpectType void
wd.doubleClick({ css: 'div' })
wd.doubleClick({ xpath: '//div' })
wd.doubleClick({ name: 'div' })
wd.doubleClick({ id: 'div' })
wd.doubleClick({ android: 'div' })
wd.doubleClick({ ios: 'div' })
wd.doubleClick(locate('div'))
wd.doubleClick('div', 'body')
wd.doubleClick('div', locate('div'))
wd.doubleClick('div', { css: 'div' })
wd.doubleClick('div', { xpath: '//div' })
wd.doubleClick('div', { name: '//div' })
wd.doubleClick('div', { id: '//div' })
wd.doubleClick('div', { android: '//div' })
wd.doubleClick('div', { ios: '//div' })

wd.rightClick() // $ExpectError
wd.rightClick('div') // $ExpectType void
wd.rightClick({ css: 'div' })
wd.rightClick({ xpath: '//div' })
wd.rightClick({ name: 'div' })
wd.rightClick({ id: 'div' })
wd.rightClick({ android: 'div' })
wd.rightClick({ ios: 'div' })
wd.rightClick(locate('div'))
wd.rightClick('div', 'body')
wd.rightClick('div', locate('div'))
wd.rightClick('div', { css: 'div' })
wd.rightClick('div', { xpath: '//div' })
wd.rightClick('div', { name: '//div' })
wd.rightClick('div', { id: '//div' })
wd.rightClick('div', { android: '//div' })
wd.rightClick('div', { ios: '//div' })

wd.fillField() // $ExpectError
wd.fillField('div') // $ExpectError
wd.fillField('div', 'value') // $ExpectType void
wd.fillField({ css: 'div' }, 'value')
wd.fillField({ xpath: '//div' }, 'value')
wd.fillField({ name: 'div' }, 'value')
wd.fillField({ id: 'div' }, 'value')
wd.fillField({ android: 'div' }, 'value')
wd.fillField({ ios: 'div' }, 'value')
wd.fillField(locate('div'), 'value')

wd.appendField() // $ExpectError
wd.appendField('div') // $ExpectError
wd.appendField('div', 'value') // $ExpectType void
wd.appendField({ css: 'div' }, 'value')
wd.appendField({ xpath: '//div' }, 'value')
wd.appendField({ name: 'div' }, 'value')
wd.appendField({ id: 'div' }, 'value')
wd.appendField({ android: 'div' }, 'value')
wd.appendField({ ios: 'div' }, 'value')
wd.appendField(locate('div'), 'value')

wd.clearField() // $ExpectError
wd.clearField('div')
wd.clearField({ css: 'div' })
wd.clearField({ xpath: '//div' })
wd.clearField({ name: 'div' })
wd.clearField({ id: 'div' })
wd.clearField({ android: 'div' })
wd.clearField({ ios: 'div' })

wd.scrollIntoView('div', {behavior: "auto", block: "center", "inline": "center"})

wd.setCookie({name: 'name', value: 'value'})
wd.setCookie([{name: 'name', value: 'value'}])

wd.grabAllWindowHandles() // $ExpectType string[]
wd.grabCurrentWindowHandle() // $ExpectType string
