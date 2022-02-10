const wd = new CodeceptJS.WebDriver();

const str_wd = 'text';
const num_wd = 1;

wd.amOnPage(); // $ExpectError
wd.amOnPage(''); // $ExpectType Promise<any>

wd.click(); // $ExpectError
wd.click('div'); // $ExpectType Promise<any>
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
wd.forceClick('div'); // $ExpectType Promise<any>
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
wd.doubleClick('div'); // $ExpectType Promise<any>
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
wd.rightClick('div'); // $ExpectType Promise<any>
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
wd.fillField('div', str_wd); // $ExpectType Promise<any>
wd.fillField({ css: 'div' }, str_wd);
wd.fillField({ xpath: '//div' }, str_wd);
wd.fillField({ name: 'div' }, str_wd);
wd.fillField({ id: 'div' }, str_wd);
wd.fillField({ android: 'div' }, str_wd);
wd.fillField({ ios: 'div' }, str_wd);
wd.fillField(locate('div'), str_wd);

wd.appendField(); // $ExpectError
wd.appendField('div'); // $ExpectError
wd.appendField('div', str_wd); // $ExpectType Promise<any>
wd.appendField({ css: 'div' }, str_wd);
wd.appendField({ xpath: '//div' }, str_wd);
wd.appendField({ name: 'div' }, str_wd);
wd.appendField({ id: 'div' }, str_wd);
wd.appendField({ android: 'div' }, str_wd);
wd.appendField({ ios: 'div' }, str_wd);
wd.appendField(locate('div'), str_wd);

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
wd.selectOption('div', str_wd); // $ExpectType Promise<any>

wd.attachFile(); // $ExpectError
wd.attachFile('div'); // $ExpectError
wd.attachFile('div', str_wd); // $ExpectType Promise<any>

wd.checkOption(); // $ExpectError
wd.checkOption('div'); // $ExpectType Promise<any>

wd.uncheckOption(); // $ExpectError
wd.uncheckOption('div'); // $ExpectType Promise<any>

wd.seeInTitle(); // $ExpectError
wd.seeInTitle(str_wd); // $ExpectType Promise<any>

wd.seeTitleEquals(); // $ExpectError
wd.seeTitleEquals(str_wd); // $ExpectType Promise<any>

wd.dontSeeInTitle(); // $ExpectError
wd.dontSeeInTitle(str_wd); // $ExpectType Promise<any>

wd.see(); // $ExpectError
wd.see(str_wd); // $ExpectType Promise<any>
wd.see(str_wd, 'div'); // $ExpectType Promise<any>

wd.dontSee(); // $ExpectError
wd.dontSee(str_wd); // $ExpectType Promise<any>
wd.dontSee(str_wd, 'div'); // $ExpectType Promise<any>

wd.seeTextEquals(); // $ExpectError
wd.seeTextEquals(str_wd); // $ExpectType Promise<any>
wd.seeTextEquals(str_wd, 'div'); // $ExpectType Promise<any>

wd.seeInField(); // $ExpectError
wd.seeInField('div'); // $ExpectError
wd.seeInField('div', str_wd); // $ExpectType Promise<any>

wd.dontSeeInField(); // $ExpectError
wd.dontSeeInField('div'); // $ExpectError
wd.dontSeeInField('div', str_wd); // $ExpectType Promise<any>

wd.seeCheckboxIsChecked(); // $ExpectError
wd.seeCheckboxIsChecked('div'); // $ExpectType Promise<any>

wd.dontSeeCheckboxIsChecked(); // $ExpectError
wd.dontSeeCheckboxIsChecked('div'); // $ExpectType Promise<any>

wd.seeElement(); // $ExpectError
wd.seeElement('div'); // $ExpectType Promise<any>

wd.dontSeeElement(); // $ExpectError
wd.dontSeeElement('div'); // $ExpectType Promise<any>

wd.seeElementInDOM(); // $ExpectError
wd.seeElementInDOM('div'); // $ExpectType Promise<any>

wd.dontSeeElementInDOM(); // $ExpectError
wd.dontSeeElementInDOM('div'); // $ExpectType Promise<any>

wd.seeInSource(); // $ExpectError
wd.seeInSource(str_wd); // $ExpectType Promise<any>

wd.dontSeeInSource(); // $ExpectError
wd.dontSeeInSource(str_wd); // $ExpectType Promise<any>

wd.seeNumberOfElements(); // $ExpectError
wd.seeNumberOfElements('div'); // $ExpectError
wd.seeNumberOfElements('div', num_wd); // $ExpectType Promise<any>

wd.seeNumberOfVisibleElements(); // $ExpectError
wd.seeNumberOfVisibleElements('div'); // $ExpectError
wd.seeNumberOfVisibleElements('div', num_wd); // $ExpectType Promise<any>

wd.seeCssPropertiesOnElements(); // $ExpectError
wd.seeCssPropertiesOnElements('div'); // $ExpectError
wd.seeCssPropertiesOnElements('div', str_wd); // $ExpectType Promise<any>

wd.seeAttributesOnElements(); // $ExpectError
wd.seeAttributesOnElements('div'); // $ExpectError
wd.seeAttributesOnElements('div', str_wd); // $ExpectType Promise<any>

wd.seeInCurrentUrl(); // $ExpectError
wd.seeInCurrentUrl(str_wd); // $ExpectType Promise<any>

wd.seeCurrentUrlEquals(); // $ExpectError
wd.seeCurrentUrlEquals(str_wd); // $ExpectType Promise<any>

wd.dontSeeInCurrentUrl(); // $ExpectError
wd.dontSeeInCurrentUrl(str_wd); // $ExpectType Promise<any>

wd.dontSeeCurrentUrlEquals(); // $ExpectError
wd.dontSeeCurrentUrlEquals(str_wd); // $ExpectType Promise<any>

wd.executeScript(); // $ExpectError
wd.executeScript(str_wd); // $ExpectType Promise<any>
wd.executeScript(() => {}); // $ExpectType Promise<any>
wd.executeScript(() => {}, {}); // $ExpectType Promise<any>

wd.executeAsyncScript(); // $ExpectError
wd.executeAsyncScript(str_wd); // $ExpectType Promise<any>
wd.executeAsyncScript(() => {}); // $ExpectType Promise<any>
wd.executeAsyncScript(() => {}, {}); // $ExpectType Promise<any>

wd.scrollIntoView(); // $ExpectError
wd.scrollIntoView('div'); // $ExpectError
wd.scrollIntoView('div', { behavior: 'auto', block: 'center', inline: 'center' });

wd.scrollTo(); // $ExpectError
wd.scrollTo('div'); // $ExpectType Promise<any>
wd.scrollTo('div', num_wd, num_wd); // $ExpectType Promise<any>

wd.moveCursorTo(); // $ExpectError
wd.moveCursorTo('div'); // $ExpectType Promise<any>
wd.moveCursorTo('div', num_wd, num_wd); // $ExpectType Promise<any>

wd.saveScreenshot(); // $ExpectError
wd.saveScreenshot(str_wd); // $ExpectType Promise<any>
wd.saveScreenshot(str_wd, true); // $ExpectType Promise<any>

wd.setCookie(); // $ExpectError
wd.setCookie({ name: str_wd, value: str_wd }); // $ExpectType Promise<any>
wd.setCookie([{ name: str_wd, value: str_wd }]); // $ExpectType Promise<any>

wd.clearCookie(); // $ExpectType Promise<any>
wd.clearCookie(str_wd); // $ExpectType Promise<any>

wd.seeCookie(); // $ExpectError
wd.seeCookie(str_wd); // $ExpectType Promise<any>

wd.acceptPopup(); // $ExpectType void

wd.cancelPopup(); // $ExpectType void

wd.seeInPopup(); // $ExpectError
wd.seeInPopup(str_wd); // $ExpectType void

wd.pressKeyDown(); // $ExpectError
wd.pressKeyDown(str_wd); // $ExpectType Promise<any>

wd.pressKeyUp(); // $ExpectError
wd.pressKeyUp(str_wd); // $ExpectType Promise<any>

wd.pressKey(); // $ExpectError
wd.pressKey(str_wd); // $ExpectType Promise<any>

wd.type(); // $ExpectError
wd.type(str_wd); // $ExpectType Promise<any>

wd.resizeWindow(); // $ExpectError
wd.resizeWindow(num_wd); // $ExpectError
wd.resizeWindow(num_wd, num_wd); // $ExpectType Promise<any>

wd.dragAndDrop(); // $ExpectError
wd.dragAndDrop('div'); // $ExpectError
wd.dragAndDrop('div', 'div'); // $ExpectType Promise<any>

wd.dragSlider(); // $ExpectError
wd.dragSlider('div', num_wd); // $ExpectType Promise<any>

wd.switchToWindow(); // $ExpectError
wd.switchToWindow(str_wd); // $ExpectType void

wd.closeOtherTabs(); // $ExpectType Promise<any>

wd.wait(); // $ExpectError
wd.wait(num_wd); // $ExpectType Promise<any>

wd.waitForEnabled(); // $ExpectError
wd.waitForEnabled('div'); // $ExpectType Promise<any>
wd.waitForEnabled('div', num_wd); // $ExpectType Promise<any>

wd.waitForElement(); // $ExpectError
wd.waitForElement('div'); // $ExpectType Promise<any>
wd.waitForElement('div', num_wd); // $ExpectType Promise<any>

wd.waitForClickable(); // $ExpectError
wd.waitForClickable('div'); // $ExpectType Promise<any>
wd.waitForClickable('div', num_wd); // $ExpectType Promise<any>

wd.waitForVisible(); // $ExpectError
wd.waitForVisible('div'); // $ExpectType Promise<any>
wd.waitForVisible('div', num_wd); // $ExpectType Promise<any>

wd.waitForInvisible(); // $ExpectError
wd.waitForInvisible('div'); // $ExpectType Promise<any>
wd.waitForInvisible('div', num_wd); // $ExpectType Promise<any>

wd.waitToHide(); // $ExpectError
wd.waitToHide('div'); // $ExpectType Promise<any>
wd.waitToHide('div', num_wd); // $ExpectType Promise<any>

wd.waitForDetached(); // $ExpectError
wd.waitForDetached('div'); // $ExpectType Promise<any>
wd.waitForDetached('div', num_wd); // $ExpectType Promise<any>

wd.waitForFunction(); // $ExpectError
wd.waitForFunction('div'); // $ExpectType Promise<any>
wd.waitForFunction(() => {}); // $ExpectType Promise<any>
wd.waitForFunction(() => {}, [num_wd], num_wd); // $ExpectType Promise<any>
wd.waitForFunction(() => {}, [str_wd], num_wd); // $ExpectType Promise<any>

wd.waitInUrl(); // $ExpectError
wd.waitInUrl(str_wd); // $ExpectType Promise<any>
wd.waitInUrl(str_wd, num_wd); // $ExpectType Promise<any>

wd.waitForText(); // $ExpectError
wd.waitForText(str_wd); // $ExpectType Promise<any>
wd.waitForText(str_wd, num_wd, str_wd); // $ExpectType Promise<any>

wd.waitForValue(); // $ExpectError
wd.waitForValue(str_wd); // $ExpectError
wd.waitForValue(str_wd, str_wd); // $ExpectType Promise<any>
wd.waitForValue(str_wd, str_wd, num_wd); // $ExpectType Promise<any>

wd.waitNumberOfVisibleElements(); // $ExpectError
wd.waitNumberOfVisibleElements('div'); // $ExpectError
wd.waitNumberOfVisibleElements(str_wd, num_wd); // $ExpectType Promise<any>
wd.waitNumberOfVisibleElements(str_wd, num_wd, num_wd); // $ExpectType Promise<any>

wd.waitUrlEquals(); // $ExpectError
wd.waitUrlEquals(str_wd); // $ExpectType Promise<any>
wd.waitUrlEquals(str_wd, num_wd); // $ExpectType Promise<any>

wd.switchTo(); // $ExpectType Promise<any>
wd.switchTo('div'); // $ExpectType Promise<any>

wd.switchToNextTab(num_wd, num_wd); // $ExpectType Promise<any>

wd.switchToPreviousTab(num_wd, num_wd); // $ExpectType Promise<any>

wd.closeCurrentTab(); // $ExpectType Promise<any>

wd.openNewTab(); // $ExpectType Promise<any>

wd.refreshPage(); // $ExpectType Promise<any>

wd.scrollPageToTop(); // $ExpectType Promise<any>

wd.scrollPageToBottom(); // $ExpectType Promise<any>

wd.setGeoLocation(); // $ExpectError
wd.setGeoLocation(num_wd); // $ExpectError
wd.setGeoLocation(num_wd, num_wd); // $ExpectType Promise<any>
wd.setGeoLocation(num_wd, num_wd, num_wd); // $ExpectType Promise<any>

wd.dontSeeCookie(); // $ExpectError
wd.dontSeeCookie(str_wd); // $ExpectType Promise<any>

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

wd.grabCookie(); // $ExpectType Promise<string[]> | Promise<string>
wd.grabCookie('name'); // $ExpectType Promise<string[]> | Promise<string>

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
