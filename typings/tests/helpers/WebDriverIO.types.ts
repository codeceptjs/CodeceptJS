import { expectError, expectType } from 'tsd'

// @ts-ignore
const wd = new CodeceptJS.WebDriver()

const str = 'text'
const num = 1

expectError(wd.amOnPage())
expectType<CodeceptJS.StepPromise>(wd.amOnPage(''))

expectError(wd.focus())
expectType<CodeceptJS.ElementStepPromise>(wd.focus('div'))
wd.focus({ css: 'div' })
wd.focus({ xpath: '//div' })
wd.focus({ name: 'div' })
wd.focus({ id: 'div' })
wd.focus({ android: 'div' })
wd.focus({ ios: 'div' })
// @ts-ignore
wd.focus(locate('div'))
wd.focus('div', 'body')
// @ts-ignore
wd.focus('div', locate('div'))
wd.focus('div', { css: 'div' })
wd.focus('div', { xpath: '//div' })
wd.focus('div', { name: '//div' })
wd.focus('div', { id: '//div' })
wd.focus('div', { android: '//div' })
wd.focus('div', { ios: '//div' })

expectError(wd.blur())
expectType<CodeceptJS.ElementStepPromise>(wd.blur('div'))
wd.blur({ css: 'div' })
wd.blur({ xpath: '//div' })
wd.blur({ name: 'div' })
wd.blur({ id: 'div' })
wd.blur({ android: 'div' })
wd.blur({ ios: 'div' })
// @ts-ignore
wd.blur(locate('div'))
wd.blur('div', 'body')
// @ts-ignore
wd.blur('div', locate('div'))
wd.blur('div', { css: 'div' })
wd.blur('div', { xpath: '//div' })
wd.blur('div', { name: '//div' })
wd.blur('div', { id: '//div' })
wd.blur('div', { android: '//div' })
wd.blur('div', { ios: '//div' })

expectType<CodeceptJS.ElementStepPromise>(wd.click())
expectType<CodeceptJS.ElementStepPromise>(wd.click('div'))
wd.click({ css: 'div' })
wd.click({ xpath: '//div' })
wd.click({ name: 'div' })
wd.click({ id: 'div' })
wd.click({ android: 'div' })
wd.click({ ios: 'div' })
// @ts-ignore
wd.click(locate('div'))
wd.click('div', 'body')
// @ts-ignore
wd.click('div', locate('div'))
wd.click('div', { css: 'div' })
wd.click('div', { xpath: '//div' })
wd.click('div', { name: '//div' })
wd.click('div', { id: '//div' })
wd.click('div', { android: '//div' })
wd.click('div', { ios: '//div' })

expectError(wd.forceClick())
expectType<CodeceptJS.ElementStepPromise>(wd.forceClick('div'))
wd.forceClick({ css: 'div' })
wd.forceClick({ xpath: '//div' })
wd.forceClick({ name: 'div' })
wd.forceClick({ id: 'div' })
wd.forceClick({ android: 'div' })
wd.forceClick({ ios: 'div' })
// @ts-ignore
wd.forceClick(locate('div'))
wd.forceClick('div', 'body')
// @ts-ignore
wd.forceClick('div', locate('div'))
wd.forceClick('div', { css: 'div' })
wd.forceClick('div', { xpath: '//div' })
wd.forceClick('div', { name: '//div' })
wd.forceClick('div', { id: '//div' })
wd.forceClick('div', { android: '//div' })
wd.forceClick('div', { ios: '//div' })

expectError(wd.doubleClick())
expectType<CodeceptJS.ElementStepPromise>(wd.doubleClick('div'))
wd.doubleClick({ css: 'div' })
wd.doubleClick({ xpath: '//div' })
wd.doubleClick({ name: 'div' })
wd.doubleClick({ id: 'div' })
wd.doubleClick({ android: 'div' })
wd.doubleClick({ ios: 'div' })
// @ts-ignore
wd.doubleClick(locate('div'))
wd.doubleClick('div', 'body')
// @ts-ignore
wd.doubleClick('div', locate('div'))
wd.doubleClick('div', { css: 'div' })
wd.doubleClick('div', { xpath: '//div' })
wd.doubleClick('div', { name: '//div' })
wd.doubleClick('div', { id: '//div' })
wd.doubleClick('div', { android: '//div' })
wd.doubleClick('div', { ios: '//div' })

expectError(wd.rightClick())
expectType<CodeceptJS.ElementStepPromise>(wd.rightClick('div'))
wd.rightClick({ css: 'div' })
wd.rightClick({ xpath: '//div' })
wd.rightClick({ name: 'div' })
wd.rightClick({ id: 'div' })
wd.rightClick({ android: 'div' })
wd.rightClick({ ios: 'div' })
// @ts-ignore
wd.rightClick(locate('div'))
wd.rightClick('div', 'body')
// @ts-ignore
wd.rightClick('div', locate('div'))
wd.rightClick('div', { css: 'div' })
wd.rightClick('div', { xpath: '//div' })
wd.rightClick('div', { name: '//div' })
wd.rightClick('div', { id: '//div' })
wd.rightClick('div', { android: '//div' })
wd.rightClick('div', { ios: '//div' })

expectError(wd.fillField())
expectError(wd.fillField('div'))
expectType<CodeceptJS.ElementStepPromise>(wd.fillField('div', str))
wd.fillField({ css: 'div' }, str)
wd.fillField({ xpath: '//div' }, str)
wd.fillField({ name: 'div' }, str)
wd.fillField({ id: 'div' }, str)
wd.fillField({ android: 'div' }, str)
wd.fillField({ ios: 'div' }, str)
// @ts-ignore
wd.fillField(locate('div'), str)

expectError(wd.appendField())
expectError(wd.appendField('div'))
expectType<CodeceptJS.ElementStepPromise>(wd.appendField('div', str))
wd.appendField({ css: 'div' }, str)
wd.appendField({ xpath: '//div' }, str)
wd.appendField({ name: 'div' }, str)
wd.appendField({ id: 'div' }, str)
wd.appendField({ android: 'div' }, str)
wd.appendField({ ios: 'div' }, str)
// @ts-ignore
wd.appendField(locate('div'), str)

expectError(wd.clearField())
wd.clearField('div')
wd.clearField({ css: 'div' })
wd.clearField({ xpath: '//div' })
wd.clearField({ name: 'div' })
wd.clearField({ id: 'div' })
wd.clearField({ android: 'div' })
wd.clearField({ ios: 'div' })

expectError(wd.selectOption())
expectError(wd.selectOption('div'))
expectType<CodeceptJS.ElementStepPromise>(wd.selectOption('div', str))

expectError(wd.attachFile())
expectError(wd.attachFile('div'))
expectType<CodeceptJS.ElementStepPromise>(wd.attachFile('div', str))

expectError(wd.checkOption())
expectType<CodeceptJS.ElementStepPromise>(wd.checkOption('div'))

expectError(wd.uncheckOption())
expectType<CodeceptJS.ElementStepPromise>(wd.uncheckOption('div'))

expectError(wd.seeInTitle())
expectType<CodeceptJS.StepPromise>(wd.seeInTitle(str))

expectError(wd.seeTitleEquals())
expectType<CodeceptJS.StepPromise>(wd.seeTitleEquals(str))

expectError(wd.dontSeeInTitle())
expectType<CodeceptJS.StepPromise>(wd.dontSeeInTitle(str))

expectError(wd.see())
expectType<CodeceptJS.StepPromise>(wd.see(str))
expectType<CodeceptJS.StepPromise>(wd.see(str, 'div'))

expectError(wd.dontSee())
expectType<CodeceptJS.StepPromise>(wd.dontSee(str))
expectType<CodeceptJS.StepPromise>(wd.dontSee(str, 'div'))

expectError(wd.seeTextEquals())
expectType<CodeceptJS.StepPromise>(wd.seeTextEquals(str))
expectType<CodeceptJS.StepPromise>(wd.seeTextEquals(str, 'div'))

expectError(wd.seeInField())
expectError(wd.seeInField('div'))
expectType<CodeceptJS.StepPromise>(wd.seeInField('div', str))

expectError(wd.dontSeeInField())
expectError(wd.dontSeeInField('div'))
expectType<CodeceptJS.StepPromise>(wd.dontSeeInField('div', str))

expectError(wd.seeCheckboxIsChecked())
expectType<CodeceptJS.StepPromise>(wd.seeCheckboxIsChecked('div'))

expectError(wd.dontSeeCheckboxIsChecked())
expectType<CodeceptJS.StepPromise>(wd.dontSeeCheckboxIsChecked('div'))

expectError(wd.seeElement())
expectType<CodeceptJS.StepPromise>(wd.seeElement('div'))

expectError(wd.dontSeeElement())
expectType<CodeceptJS.StepPromise>(wd.dontSeeElement('div'))

expectError(wd.seeElementInDOM())
expectType<CodeceptJS.StepPromise>(wd.seeElementInDOM('div'))

expectError(wd.dontSeeElementInDOM())
expectType<CodeceptJS.StepPromise>(wd.dontSeeElementInDOM('div'))

expectError(wd.seeInSource())
expectType<CodeceptJS.StepPromise>(wd.seeInSource(str))

expectError(wd.dontSeeInSource())
expectType<CodeceptJS.StepPromise>(wd.dontSeeInSource(str))

expectError(wd.seeNumberOfElements())
expectError(wd.seeNumberOfElements('div'))
expectType<CodeceptJS.StepPromise>(wd.seeNumberOfElements('div', num))

expectError(wd.seeNumberOfVisibleElements())
expectError(wd.seeNumberOfVisibleElements('div'))
expectType<CodeceptJS.StepPromise>(wd.seeNumberOfVisibleElements('div', num))

expectError(wd.seeCssPropertiesOnElements())
expectError(wd.seeCssPropertiesOnElements('div'))
expectType<CodeceptJS.StepPromise>(wd.seeCssPropertiesOnElements('div', str))

expectError(wd.seeAttributesOnElements())
expectError(wd.seeAttributesOnElements('div'))
expectType<CodeceptJS.StepPromise>(wd.seeAttributesOnElements('div', str))

expectError(wd.seeInCurrentUrl())
expectType<CodeceptJS.StepPromise>(wd.seeInCurrentUrl(str))

expectError(wd.seeCurrentUrlEquals())
expectType<CodeceptJS.StepPromise>(wd.seeCurrentUrlEquals(str))

expectError(wd.dontSeeInCurrentUrl())
expectType<CodeceptJS.StepPromise>(wd.dontSeeInCurrentUrl(str))

expectError(wd.dontSeeCurrentUrlEquals())
expectType<CodeceptJS.StepPromise>(wd.dontSeeCurrentUrlEquals(str))

expectError(wd.executeScript())
expectType<Promise<any>>(wd.executeScript(str))
expectType<Promise<any>>(wd.executeScript(() => {}))
expectType<Promise<any>>(wd.executeScript(() => {}, {}))

expectError(wd.executeAsyncScript())
expectType<Promise<any>>(wd.executeAsyncScript(str))
expectType<Promise<any>>(wd.executeAsyncScript(() => {}))
expectType<Promise<any>>(wd.executeAsyncScript(() => {}, {}))

expectError(wd.scrollIntoView())
expectError(wd.scrollIntoView('div'))
wd.scrollIntoView('div', true)
wd.scrollIntoView('div', { behavior: 'auto', block: 'center', inline: 'center' })

expectError(wd.scrollTo())
expectType<CodeceptJS.ElementStepPromise>(wd.scrollTo('div'))
expectType<CodeceptJS.ElementStepPromise>(wd.scrollTo('div', num, num))

expectError(wd.moveCursorTo())
expectType<CodeceptJS.ElementStepPromise>(wd.moveCursorTo('div'))
expectType<CodeceptJS.ElementStepPromise>(wd.moveCursorTo('div', num, num))

expectError(wd.saveScreenshot())
expectType<CodeceptJS.StepPromise>(wd.saveScreenshot(str))
expectType<CodeceptJS.StepPromise>(wd.saveScreenshot(str, true))

expectError(wd.setCookie())
expectType<CodeceptJS.StepPromise>(wd.setCookie({ name: str, value: str }))
expectType<CodeceptJS.StepPromise>(wd.setCookie([{ name: str, value: str }]))

expectType<void>(wd.clearCookie())
expectType<void>(wd.clearCookie(str))

expectError(wd.seeCookie())
expectType<CodeceptJS.StepPromise>(wd.seeCookie(str))

expectType<void>(wd.acceptPopup())

expectType<void>(wd.cancelPopup())

expectError(wd.seeInPopup())
expectType<void>(wd.seeInPopup(str))

expectError(wd.pressKeyDown())
expectType<CodeceptJS.StepPromise>(wd.pressKeyDown(str))

expectError(wd.pressKeyUp())
expectType<CodeceptJS.StepPromise>(wd.pressKeyUp(str))

expectError(wd.pressKey())
expectType<CodeceptJS.StepPromise>(wd.pressKey(str))

expectError(wd.type())
expectType<CodeceptJS.StepPromise>(wd.type(str))

expectError(wd.resizeWindow())
expectError(wd.resizeWindow(num))
expectType<CodeceptJS.StepPromise>(wd.resizeWindow(num, num))

expectError(wd.dragAndDrop())
expectError(wd.dragAndDrop('div'))
expectType<CodeceptJS.ElementStepPromise>(wd.dragAndDrop('div', 'div'))

expectError(wd.dragSlider())
expectType<CodeceptJS.ElementStepPromise>(wd.dragSlider('div', num))

expectError(wd.switchToWindow())
expectType<void>(wd.switchToWindow(str))

expectType<CodeceptJS.StepPromise>(wd.closeOtherTabs())

expectError(wd.wait())
expectType<CodeceptJS.StepPromise>(wd.wait(num))

expectError(wd.waitForEnabled())
expectType<CodeceptJS.StepPromise>(wd.waitForEnabled('div'))
expectType<CodeceptJS.StepPromise>(wd.waitForEnabled('div', num))

expectError(wd.waitForElement())
expectType<CodeceptJS.StepPromise>(wd.waitForElement('div'))
expectType<CodeceptJS.StepPromise>(wd.waitForElement('div', num))

expectError(wd.waitForClickable())
expectType<CodeceptJS.StepPromise>(wd.waitForClickable('div'))
expectType<CodeceptJS.StepPromise>(wd.waitForClickable('div', num))

expectError(wd.waitForVisible())
expectType<CodeceptJS.StepPromise>(wd.waitForVisible('div'))
expectType<CodeceptJS.StepPromise>(wd.waitForVisible('div', num))

expectError(wd.waitForInvisible())
expectType<CodeceptJS.StepPromise>(wd.waitForInvisible('div'))
expectType<CodeceptJS.StepPromise>(wd.waitForInvisible('div', num))

expectError(wd.waitToHide())
expectType<CodeceptJS.StepPromise>(wd.waitToHide('div'))
expectType<CodeceptJS.StepPromise>(wd.waitToHide('div', num))

expectError(wd.waitForDetached())
expectType<CodeceptJS.StepPromise>(wd.waitForDetached('div'))
expectType<CodeceptJS.StepPromise>(wd.waitForDetached('div', num))

expectError(wd.waitForFunction())
expectType<CodeceptJS.StepPromise>(wd.waitForFunction('div'))
expectType<CodeceptJS.StepPromise>(wd.waitForFunction(() => {}))
expectType<CodeceptJS.StepPromise>(wd.waitForFunction(() => {}, [num], num))
expectType<CodeceptJS.StepPromise>(wd.waitForFunction(() => {}, [str], num))

expectError(wd.waitInUrl())
expectType<CodeceptJS.StepPromise>(wd.waitInUrl(str))
expectType<CodeceptJS.StepPromise>(wd.waitInUrl(str, num))

expectError(wd.waitForText())
expectType<CodeceptJS.StepPromise>(wd.waitForText(str))
expectType<CodeceptJS.StepPromise>(wd.waitForText(str, num, str))

expectError(wd.waitForValue())
expectError(wd.waitForValue(str))
expectType<CodeceptJS.StepPromise>(wd.waitForValue(str, str))
expectType<CodeceptJS.StepPromise>(wd.waitForValue(str, str, num))

expectError(wd.waitNumberOfVisibleElements())
expectError(wd.waitNumberOfVisibleElements('div'))
expectType<CodeceptJS.StepPromise>(wd.waitNumberOfVisibleElements(str, num))
expectType<CodeceptJS.StepPromise>(wd.waitNumberOfVisibleElements(str, num, num))

expectError(wd.waitUrlEquals())
expectType<CodeceptJS.StepPromise>(wd.waitUrlEquals(str))
expectType<CodeceptJS.StepPromise>(wd.waitUrlEquals(str, num))

expectType<CodeceptJS.StepPromise>(wd.switchTo())
expectType<CodeceptJS.StepPromise>(wd.switchTo('div'))

expectType<CodeceptJS.StepPromise>(wd.switchToNextTab(num, num))

expectType<CodeceptJS.StepPromise>(wd.switchToPreviousTab(num, num))

expectType<CodeceptJS.StepPromise>(wd.closeCurrentTab())

expectType<CodeceptJS.StepPromise>(wd.openNewTab())

expectType<CodeceptJS.StepPromise>(wd.refreshPage())

expectType<CodeceptJS.StepPromise>(wd.scrollPageToTop())

expectType<CodeceptJS.StepPromise>(wd.scrollPageToBottom())

expectError(wd.dontSeeCookie())
expectType<CodeceptJS.StepPromise>(wd.dontSeeCookie(str))

expectError(wd.dragAndDrop())
expectError(wd.dragAndDrop('#dragHandle'))
wd.dragAndDrop('#dragHandle', '#container')

expectError(wd.grabTextFromAll())
expectType<Promise<string[]>>(wd.grabTextFromAll('div'))

expectError(wd.grabTextFrom())
expectType<Promise<string>>(wd.grabTextFrom('div'))

expectError(wd.grabHTMLFromAll())
expectType<Promise<string[]>>(wd.grabHTMLFromAll('div'))

expectError(wd.grabHTMLFrom())
expectType<Promise<string>>(wd.grabHTMLFrom('div'))

expectError(wd.grabValueFromAll())
expectType<Promise<string[]>>(wd.grabValueFromAll('div'))

expectError(wd.grabValueFrom())
expectType<Promise<string>>(wd.grabValueFrom('div'))

expectError(wd.grabCssPropertyFromAll())
expectError(wd.grabCssPropertyFromAll('div'))
expectType<Promise<string[]>>(wd.grabCssPropertyFromAll('div', 'color'))

expectError(wd.grabCssPropertyFrom())
expectError(wd.grabCssPropertyFrom('div'))
expectType<Promise<string>>(wd.grabCssPropertyFrom('div', 'color'))

expectError(wd.grabAttributeFromAll())
expectError(wd.grabAttributeFromAll('div'))
expectType<Promise<string[]>>(wd.grabAttributeFromAll('div', 'style'))

expectError(wd.grabAttributeFrom())
expectError(wd.grabAttributeFrom('div'))
expectType<Promise<string>>(wd.grabAttributeFrom('div', 'style'))

expectType<Promise<string>>(wd.grabTitle())

expectType<Promise<string>>(wd.grabSource())

wd.grabBrowserLogs() // $ExpectType Promise<object[]> | undefined

expectType<Promise<string>>(wd.grabCurrentUrl())

expectError(wd.grabNumberOfVisibleElements())
expectType<Promise<number>>(wd.grabNumberOfVisibleElements('div'))

wd.grabCookie() // $ExpectType any
wd.grabCookie('name') // $ExpectType any

expectType<Promise<string>>(wd.grabPopupText())

expectType<Promise<string[]>>(wd.grabAllWindowHandles())
expectType<Promise<string>>(wd.grabCurrentWindowHandle())

expectType<Promise<number>>(wd.grabNumberOfOpenTabs())

const psp = wd.grabPageScrollPosition() // $ExpectType Promise<PageScrollPosition>
psp.then((result) => {
  result.x // $ExpectType number
  result.y // $ExpectType number
})

expectError(wd.grabElementBoundingRect())
//expectType<Promise<number>>(wd.grabElementBoundingRect('h3'));
//expectType<Promise<number>>(wd.grabElementBoundingRect('h3', 'width'));
