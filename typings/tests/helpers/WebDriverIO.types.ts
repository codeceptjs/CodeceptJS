export {}; // mark the file as external module to redeclare variables in the same block

const wd = new CodeceptJS.WebDriver();

const str = 'text';
const num = 1;

wd.amOnPage(); // $ExpectError
wd.amOnPage(''); // $ExpectType Promise<void>

wd.focus(); // $ExpectError
wd.focus('div'); // $ExpectType Promise<void>
wd.focus({ css: 'div' });
wd.focus({ xpath: '//div' });
wd.focus({ name: 'div' });
wd.focus({ id: 'div' });
wd.focus({ android: 'div' });
wd.focus({ ios: 'div' });
wd.focus(locate('div'));
wd.focus('div', 'body');
wd.focus('div', locate('div'));
wd.focus('div', { css: 'div' });
wd.focus('div', { xpath: '//div' });
wd.focus('div', { name: '//div' });
wd.focus('div', { id: '//div' });
wd.focus('div', { android: '//div' });
wd.focus('div', { ios: '//div' });

wd.blur(); // $ExpectError
wd.blur('div'); // $ExpectType Promise<void>
wd.blur({ css: 'div' });
wd.blur({ xpath: '//div' });
wd.blur({ name: 'div' });
wd.blur({ id: 'div' });
wd.blur({ android: 'div' });
wd.blur({ ios: 'div' });
wd.blur(locate('div'));
wd.blur('div', 'body');
wd.blur('div', locate('div'));
wd.blur('div', { css: 'div' });
wd.blur('div', { xpath: '//div' });
wd.blur('div', { name: '//div' });
wd.blur('div', { id: '//div' });
wd.blur('div', { android: '//div' });
wd.blur('div', { ios: '//div' });

wd.click(); // $ExpectError
wd.click('div'); // $ExpectType Promise<void>
wd.click({ css: 'div' });
wd.click({ xpath: '//div' });
wd.click({ name: 'div' });
wd.click({ id: 'div' });
wd.click({ android: 'div' });
wd.click({ ios: 'div' });
wd.click(locate('div'));
wd.click('div', 'body');
wd.click('div', locate('div'));
wd.click('div', { css: 'div' });
wd.click('div', { xpath: '//div' });
wd.click('div', { name: '//div' });
wd.click('div', { id: '//div' });
wd.click('div', { android: '//div' });
wd.click('div', { ios: '//div' });

wd.forceClick(); // $ExpectError
wd.forceClick('div'); // $ExpectType Promise<void>
wd.forceClick({ css: 'div' });
wd.forceClick({ xpath: '//div' });
wd.forceClick({ name: 'div' });
wd.forceClick({ id: 'div' });
wd.forceClick({ android: 'div' });
wd.forceClick({ ios: 'div' });
wd.forceClick(locate('div'));
wd.forceClick('div', 'body');
wd.forceClick('div', locate('div'));
wd.forceClick('div', { css: 'div' });
wd.forceClick('div', { xpath: '//div' });
wd.forceClick('div', { name: '//div' });
wd.forceClick('div', { id: '//div' });
wd.forceClick('div', { android: '//div' });
wd.forceClick('div', { ios: '//div' });

wd.doubleClick(); // $ExpectError
wd.doubleClick('div'); // $ExpectType Promise<void>
wd.doubleClick({ css: 'div' });
wd.doubleClick({ xpath: '//div' });
wd.doubleClick({ name: 'div' });
wd.doubleClick({ id: 'div' });
wd.doubleClick({ android: 'div' });
wd.doubleClick({ ios: 'div' });
wd.doubleClick(locate('div'));
wd.doubleClick('div', 'body');
wd.doubleClick('div', locate('div'));
wd.doubleClick('div', { css: 'div' });
wd.doubleClick('div', { xpath: '//div' });
wd.doubleClick('div', { name: '//div' });
wd.doubleClick('div', { id: '//div' });
wd.doubleClick('div', { android: '//div' });
wd.doubleClick('div', { ios: '//div' });

wd.rightClick(); // $ExpectError
wd.rightClick('div'); // $ExpectType Promise<void>
wd.rightClick({ css: 'div' });
wd.rightClick({ xpath: '//div' });
wd.rightClick({ name: 'div' });
wd.rightClick({ id: 'div' });
wd.rightClick({ android: 'div' });
wd.rightClick({ ios: 'div' });
wd.rightClick(locate('div'));
wd.rightClick('div', 'body');
wd.rightClick('div', locate('div'));
wd.rightClick('div', { css: 'div' });
wd.rightClick('div', { xpath: '//div' });
wd.rightClick('div', { name: '//div' });
wd.rightClick('div', { id: '//div' });
wd.rightClick('div', { android: '//div' });
wd.rightClick('div', { ios: '//div' });

wd.fillField(); // $ExpectError
wd.fillField('div'); // $ExpectError
wd.fillField('div', str); // $ExpectType Promise<void>
wd.fillField({ css: 'div' }, str);
wd.fillField({ xpath: '//div' }, str);
wd.fillField({ name: 'div' }, str);
wd.fillField({ id: 'div' }, str);
wd.fillField({ android: 'div' }, str);
wd.fillField({ ios: 'div' }, str);
wd.fillField(locate('div'), str);

wd.appendField(); // $ExpectError
wd.appendField('div'); // $ExpectError
wd.appendField('div', str); // $ExpectType Promise<void>
wd.appendField({ css: 'div' }, str);
wd.appendField({ xpath: '//div' }, str);
wd.appendField({ name: 'div' }, str);
wd.appendField({ id: 'div' }, str);
wd.appendField({ android: 'div' }, str);
wd.appendField({ ios: 'div' }, str);
wd.appendField(locate('div'), str);

wd.clearField(); // $ExpectError
wd.clearField('div');
wd.clearField({ css: 'div' });
wd.clearField({ xpath: '//div' });
wd.clearField({ name: 'div' });
wd.clearField({ id: 'div' });
wd.clearField({ android: 'div' });
wd.clearField({ ios: 'div' });

wd.selectOption(); // $ExpectError
wd.selectOption('div'); // $ExpectError
wd.selectOption('div', str); // $ExpectType Promise<void>

wd.attachFile(); // $ExpectError
wd.attachFile('div'); // $ExpectError
wd.attachFile('div', str); // $ExpectType Promise<void>

wd.checkOption(); // $ExpectError
wd.checkOption('div'); // $ExpectType Promise<void>

wd.uncheckOption(); // $ExpectError
wd.uncheckOption('div'); // $ExpectType Promise<void>

wd.seeInTitle(); // $ExpectError
wd.seeInTitle(str); // $ExpectType Promise<void>

wd.seeTitleEquals(); // $ExpectError
wd.seeTitleEquals(str); // $ExpectType Promise<void>

wd.dontSeeInTitle(); // $ExpectError
wd.dontSeeInTitle(str); // $ExpectType Promise<void>

wd.see(); // $ExpectError
wd.see(str); // $ExpectType Promise<void>
wd.see(str, 'div'); // $ExpectType Promise<void>

wd.dontSee(); // $ExpectError
wd.dontSee(str); // $ExpectType Promise<void>
wd.dontSee(str, 'div'); // $ExpectType Promise<void>

wd.seeTextEquals(); // $ExpectError
wd.seeTextEquals(str); // $ExpectType Promise<void>
wd.seeTextEquals(str, 'div'); // $ExpectType Promise<void>

wd.seeInField(); // $ExpectError
wd.seeInField('div'); // $ExpectError
wd.seeInField('div', str); // $ExpectType Promise<void>

wd.dontSeeInField(); // $ExpectError
wd.dontSeeInField('div'); // $ExpectError
wd.dontSeeInField('div', str); // $ExpectType Promise<void>

wd.seeCheckboxIsChecked(); // $ExpectError
wd.seeCheckboxIsChecked('div'); // $ExpectType Promise<void>

wd.dontSeeCheckboxIsChecked(); // $ExpectError
wd.dontSeeCheckboxIsChecked('div'); // $ExpectType Promise<void>

wd.seeElement(); // $ExpectError
wd.seeElement('div'); // $ExpectType Promise<void>

wd.dontSeeElement(); // $ExpectError
wd.dontSeeElement('div'); // $ExpectType Promise<void>

wd.seeElementInDOM(); // $ExpectError
wd.seeElementInDOM('div'); // $ExpectType Promise<void>

wd.dontSeeElementInDOM(); // $ExpectError
wd.dontSeeElementInDOM('div'); // $ExpectType Promise<void>

wd.seeInSource(); // $ExpectError
wd.seeInSource(str); // $ExpectType Promise<void>

wd.dontSeeInSource(); // $ExpectError
wd.dontSeeInSource(str); // $ExpectType Promise<void>

wd.seeNumberOfElements(); // $ExpectError
wd.seeNumberOfElements('div'); // $ExpectError
wd.seeNumberOfElements('div', num); // $ExpectType Promise<void>

wd.seeNumberOfVisibleElements(); // $ExpectError
wd.seeNumberOfVisibleElements('div'); // $ExpectError
wd.seeNumberOfVisibleElements('div', num); // $ExpectType Promise<void>

wd.seeCssPropertiesOnElements(); // $ExpectError
wd.seeCssPropertiesOnElements('div'); // $ExpectError
wd.seeCssPropertiesOnElements('div', str); // $ExpectType Promise<void>

wd.seeAttributesOnElements(); // $ExpectError
wd.seeAttributesOnElements('div'); // $ExpectError
wd.seeAttributesOnElements('div', str); // $ExpectType Promise<void>

wd.seeInCurrentUrl(); // $ExpectError
wd.seeInCurrentUrl(str); // $ExpectType Promise<void>

wd.seeCurrentUrlEquals(); // $ExpectError
wd.seeCurrentUrlEquals(str); // $ExpectType Promise<void>

wd.dontSeeInCurrentUrl(); // $ExpectError
wd.dontSeeInCurrentUrl(str); // $ExpectType Promise<void>

wd.dontSeeCurrentUrlEquals(); // $ExpectError
wd.dontSeeCurrentUrlEquals(str); // $ExpectType Promise<void>

wd.executeScript(); // $ExpectError
wd.executeScript(str); // $ExpectType Promise<any>
wd.executeScript(() => {}); // $ExpectType Promise<any>
wd.executeScript(() => {}, {}); // $ExpectType Promise<any>

wd.executeAsyncScript(); // $ExpectError
wd.executeAsyncScript(str); // $ExpectType Promise<any>
wd.executeAsyncScript(() => {}); // $ExpectType Promise<any>
wd.executeAsyncScript(() => {}, {}); // $ExpectType Promise<any>

wd.scrollIntoView(); // $ExpectError
wd.scrollIntoView('div'); // $ExpectError
wd.scrollIntoView('div', { behavior: 'auto', block: 'center', inline: 'center' });

wd.scrollTo(); // $ExpectError
wd.scrollTo('div'); // $ExpectType Promise<void>
wd.scrollTo('div', num, num); // $ExpectType Promise<void>

wd.moveCursorTo(); // $ExpectError
wd.moveCursorTo('div'); // $ExpectType Promise<void>
wd.moveCursorTo('div', num, num); // $ExpectType Promise<void>

wd.saveScreenshot(); // $ExpectError
wd.saveScreenshot(str); // $ExpectType Promise<void>
wd.saveScreenshot(str, true); // $ExpectType Promise<void>

wd.setCookie(); // $ExpectError
wd.setCookie({ name: str, value: str }); // $ExpectType Promise<void>
wd.setCookie([{ name: str, value: str }]); // $ExpectType Promise<void>

wd.clearCookie(); // $ExpectType Promise<void>
wd.clearCookie(str); // $ExpectType Promise<void>

wd.seeCookie(); // $ExpectError
wd.seeCookie(str); // $ExpectType Promise<void>

wd.acceptPopup(); // $ExpectType void

wd.cancelPopup(); // $ExpectType void

wd.seeInPopup(); // $ExpectError
wd.seeInPopup(str); // $ExpectType void

wd.pressKeyDown(); // $ExpectError
wd.pressKeyDown(str); // $ExpectType Promise<void>

wd.pressKeyUp(); // $ExpectError
wd.pressKeyUp(str); // $ExpectType Promise<void>

wd.pressKey(); // $ExpectError
wd.pressKey(str); // $ExpectType Promise<void>

wd.type(); // $ExpectError
wd.type(str); // $ExpectType Promise<void>

wd.resizeWindow(); // $ExpectError
wd.resizeWindow(num); // $ExpectError
wd.resizeWindow(num, num); // $ExpectType Promise<void>

wd.dragAndDrop(); // $ExpectError
wd.dragAndDrop('div'); // $ExpectError
wd.dragAndDrop('div', 'div'); // $ExpectType Promise<void>

wd.dragSlider(); // $ExpectError
wd.dragSlider('div', num); // $ExpectType Promise<void>

wd.switchToWindow(); // $ExpectError
wd.switchToWindow(str); // $ExpectType void

wd.closeOtherTabs(); // $ExpectType Promise<void>

wd.wait(); // $ExpectError
wd.wait(num); // $ExpectType Promise<void>

wd.waitForEnabled(); // $ExpectError
wd.waitForEnabled('div'); // $ExpectType Promise<void>
wd.waitForEnabled('div', num); // $ExpectType Promise<void>

wd.waitForElement(); // $ExpectError
wd.waitForElement('div'); // $ExpectType Promise<void>
wd.waitForElement('div', num); // $ExpectType Promise<void>

wd.waitForClickable(); // $ExpectError
wd.waitForClickable('div'); // $ExpectType Promise<void>
wd.waitForClickable('div', num); // $ExpectType Promise<void>

wd.waitForVisible(); // $ExpectError
wd.waitForVisible('div'); // $ExpectType Promise<void>
wd.waitForVisible('div', num); // $ExpectType Promise<void>

wd.waitForInvisible(); // $ExpectError
wd.waitForInvisible('div'); // $ExpectType Promise<void>
wd.waitForInvisible('div', num); // $ExpectType Promise<void>

wd.waitToHide(); // $ExpectError
wd.waitToHide('div'); // $ExpectType Promise<void>
wd.waitToHide('div', num); // $ExpectType Promise<void>

wd.waitForDetached(); // $ExpectError
wd.waitForDetached('div'); // $ExpectType Promise<void>
wd.waitForDetached('div', num); // $ExpectType Promise<void>

wd.waitForFunction(); // $ExpectError
wd.waitForFunction('div'); // $ExpectType Promise<void>
wd.waitForFunction(() => {}); // $ExpectType Promise<void>
wd.waitForFunction(() => {}, [num], num); // $ExpectType Promise<void>
wd.waitForFunction(() => {}, [str], num); // $ExpectType Promise<void>

wd.waitInUrl(); // $ExpectError
wd.waitInUrl(str); // $ExpectType Promise<void>
wd.waitInUrl(str, num); // $ExpectType Promise<void>

wd.waitForText(); // $ExpectError
wd.waitForText(str); // $ExpectType Promise<void>
wd.waitForText(str, num, str); // $ExpectType Promise<void>

wd.waitForValue(); // $ExpectError
wd.waitForValue(str); // $ExpectError
wd.waitForValue(str, str); // $ExpectType Promise<void>
wd.waitForValue(str, str, num); // $ExpectType Promise<void>

wd.waitNumberOfVisibleElements(); // $ExpectError
wd.waitNumberOfVisibleElements('div'); // $ExpectError
wd.waitNumberOfVisibleElements(str, num); // $ExpectType Promise<void>
wd.waitNumberOfVisibleElements(str, num, num); // $ExpectType Promise<void>

wd.waitUrlEquals(); // $ExpectError
wd.waitUrlEquals(str); // $ExpectType Promise<void>
wd.waitUrlEquals(str, num); // $ExpectType Promise<void>

wd.switchTo(); // $ExpectType Promise<void>
wd.switchTo('div'); // $ExpectType Promise<void>

wd.switchToNextTab(num, num); // $ExpectType Promise<void>

wd.switchToPreviousTab(num, num); // $ExpectType Promise<void>

wd.closeCurrentTab(); // $ExpectType Promise<void>

wd.openNewTab(); // $ExpectType Promise<void>

wd.refreshPage(); // $ExpectType Promise<void>

wd.scrollPageToTop(); // $ExpectType Promise<void>

wd.scrollPageToBottom(); // $ExpectType Promise<void>

wd.setGeoLocation(); // $ExpectError
wd.setGeoLocation(num); // $ExpectError
wd.setGeoLocation(num, num); // $ExpectType Promise<void>
wd.setGeoLocation(num, num, num); // $ExpectType Promise<void>

wd.dontSeeCookie(); // $ExpectError
wd.dontSeeCookie(str); // $ExpectType Promise<void>

wd.dragAndDrop(); // $ExpectError
wd.dragAndDrop('#dragHandle'); // $ExpectError
wd.dragAndDrop('#dragHandle', '#container');

wd.grabTextFromAll(); // $ExpectError
wd.grabTextFromAll('div'); // $ExpectType Promise<string[]>

wd.grabTextFrom(); // $ExpectError
wd.grabTextFrom('div'); // $ExpectType Promise<string>

wd.grabHTMLFromAll(); // $ExpectError
wd.grabHTMLFromAll('div'); // $ExpectType Promise<string[]>

wd.grabHTMLFrom(); // $ExpectError
wd.grabHTMLFrom('div'); // $ExpectType Promise<string>

wd.grabValueFromAll(); // $ExpectError
wd.grabValueFromAll('div'); // $ExpectType Promise<string[]>

wd.grabValueFrom(); // $ExpectError
wd.grabValueFrom('div'); // $ExpectType Promise<string>

wd.grabCssPropertyFromAll(); // $ExpectError
wd.grabCssPropertyFromAll('div'); // $ExpectError
wd.grabCssPropertyFromAll('div', 'color'); // $ExpectType Promise<string[]>

wd.grabCssPropertyFrom(); // $ExpectError
wd.grabCssPropertyFrom('div'); // $ExpectError
wd.grabCssPropertyFrom('div', 'color'); // $ExpectType Promise<string>

wd.grabAttributeFromAll(); // $ExpectError
wd.grabAttributeFromAll('div'); // $ExpectError
wd.grabAttributeFromAll('div', 'style'); // $ExpectType Promise<string[]>

wd.grabAttributeFrom(); // $ExpectError
wd.grabAttributeFrom('div'); // $ExpectError
wd.grabAttributeFrom('div', 'style'); // $ExpectType Promise<string>

wd.grabTitle(); // $ExpectType Promise<string>

wd.grabSource(); // $ExpectType Promise<string>

wd.grabBrowserLogs(); // $ExpectType Promise<object[]> | undefined

wd.grabCurrentUrl(); // $ExpectType Promise<string>

wd.grabNumberOfVisibleElements(); // $ExpectError
wd.grabNumberOfVisibleElements('div'); // $ExpectType Promise<number>

wd.grabCookie(); // $ExpectType any
wd.grabCookie('name'); // $ExpectType any

wd.grabPopupText(); // $ExpectType Promise<string>

wd.grabAllWindowHandles(); // $ExpectType Promise<string[]>
wd.grabCurrentWindowHandle(); // $ExpectType Promise<string>

wd.grabNumberOfOpenTabs(); // $ExpectType Promise<number>

const psp = wd.grabPageScrollPosition(); // $ExpectType Promise<PageScrollPosition>
psp.then(
  result => {
    result.x; // $ExpectType number
    result.y; // $ExpectType number
  },
);

wd.grabGeoLocation(); // $ExpectType Promise<{ latitude: number; longitude: number; altitude: number; }>

wd.grabElementBoundingRect(); // $ExpectError
wd.grabElementBoundingRect('h3'); // $ExpectType Promise<number> | Promise<DOMRect>
wd.grabElementBoundingRect('h3', 'width'); // $ExpectType Promise<number> | Promise<DOMRect>
