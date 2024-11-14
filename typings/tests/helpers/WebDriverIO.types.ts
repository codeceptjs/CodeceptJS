import { expectError, expectType } from 'tsd';

// @ts-ignore
const wd = new CodeceptJS.WebDriver();

const str = 'text';
const num = 1;

expectError(wd.amOnPage());
expectType<void>(wd.amOnPage(''));

expectError(wd.focus());
expectType<void>(wd.focus('div'));
wd.focus({ css: 'div' });
wd.focus({ xpath: '//div' });
wd.focus({ name: 'div' });
wd.focus({ id: 'div' });
wd.focus({ android: 'div' });
wd.focus({ ios: 'div' });
// @ts-ignore
wd.focus(locate('div'));
wd.focus('div', 'body');
// @ts-ignore
wd.focus('div', locate('div'));
wd.focus('div', { css: 'div' });
wd.focus('div', { xpath: '//div' });
wd.focus('div', { name: '//div' });
wd.focus('div', { id: '//div' });
wd.focus('div', { android: '//div' });
wd.focus('div', { ios: '//div' });

expectError(wd.blur());
expectType<void>(wd.blur('div'));
wd.blur({ css: 'div' });
wd.blur({ xpath: '//div' });
wd.blur({ name: 'div' });
wd.blur({ id: 'div' });
wd.blur({ android: 'div' });
wd.blur({ ios: 'div' });
// @ts-ignore
wd.blur(locate('div'));
wd.blur('div', 'body');
// @ts-ignore
wd.blur('div', locate('div'));
wd.blur('div', { css: 'div' });
wd.blur('div', { xpath: '//div' });
wd.blur('div', { name: '//div' });
wd.blur('div', { id: '//div' });
wd.blur('div', { android: '//div' });
wd.blur('div', { ios: '//div' });

expectError(wd.click());
expectType<void>(wd.click('div'));
wd.click({ css: 'div' });
wd.click({ xpath: '//div' });
wd.click({ name: 'div' });
wd.click({ id: 'div' });
wd.click({ android: 'div' });
wd.click({ ios: 'div' });
// @ts-ignore
wd.click(locate('div'));
wd.click('div', 'body');
// @ts-ignore
wd.click('div', locate('div'));
wd.click('div', { css: 'div' });
wd.click('div', { xpath: '//div' });
wd.click('div', { name: '//div' });
wd.click('div', { id: '//div' });
wd.click('div', { android: '//div' });
wd.click('div', { ios: '//div' });

expectError(wd.forceClick());
expectType<void>(wd.forceClick('div'));
wd.forceClick({ css: 'div' });
wd.forceClick({ xpath: '//div' });
wd.forceClick({ name: 'div' });
wd.forceClick({ id: 'div' });
wd.forceClick({ android: 'div' });
wd.forceClick({ ios: 'div' });
// @ts-ignore
wd.forceClick(locate('div'));
wd.forceClick('div', 'body');
// @ts-ignore
wd.forceClick('div', locate('div'));
wd.forceClick('div', { css: 'div' });
wd.forceClick('div', { xpath: '//div' });
wd.forceClick('div', { name: '//div' });
wd.forceClick('div', { id: '//div' });
wd.forceClick('div', { android: '//div' });
wd.forceClick('div', { ios: '//div' });

expectError(wd.doubleClick());
expectType<void>(wd.doubleClick('div'));
wd.doubleClick({ css: 'div' });
wd.doubleClick({ xpath: '//div' });
wd.doubleClick({ name: 'div' });
wd.doubleClick({ id: 'div' });
wd.doubleClick({ android: 'div' });
wd.doubleClick({ ios: 'div' });
// @ts-ignore
wd.doubleClick(locate('div'));
wd.doubleClick('div', 'body');
// @ts-ignore
wd.doubleClick('div', locate('div'));
wd.doubleClick('div', { css: 'div' });
wd.doubleClick('div', { xpath: '//div' });
wd.doubleClick('div', { name: '//div' });
wd.doubleClick('div', { id: '//div' });
wd.doubleClick('div', { android: '//div' });
wd.doubleClick('div', { ios: '//div' });

expectError(wd.rightClick());
expectType<void>(wd.rightClick('div'));
wd.rightClick({ css: 'div' });
wd.rightClick({ xpath: '//div' });
wd.rightClick({ name: 'div' });
wd.rightClick({ id: 'div' });
wd.rightClick({ android: 'div' });
wd.rightClick({ ios: 'div' });
// @ts-ignore
wd.rightClick(locate('div'));
wd.rightClick('div', 'body');
// @ts-ignore
wd.rightClick('div', locate('div'));
wd.rightClick('div', { css: 'div' });
wd.rightClick('div', { xpath: '//div' });
wd.rightClick('div', { name: '//div' });
wd.rightClick('div', { id: '//div' });
wd.rightClick('div', { android: '//div' });
wd.rightClick('div', { ios: '//div' });

expectError(wd.fillField());
expectError(wd.fillField('div'));
expectType<void>(wd.fillField('div', str));
wd.fillField({ css: 'div' }, str);
wd.fillField({ xpath: '//div' }, str);
wd.fillField({ name: 'div' }, str);
wd.fillField({ id: 'div' }, str);
wd.fillField({ android: 'div' }, str);
wd.fillField({ ios: 'div' }, str);
// @ts-ignore
wd.fillField(locate('div'), str);

expectError(wd.appendField());
expectError(wd.appendField('div'));
expectType<void>(wd.appendField('div', str));
wd.appendField({ css: 'div' }, str);
wd.appendField({ xpath: '//div' }, str);
wd.appendField({ name: 'div' }, str);
wd.appendField({ id: 'div' }, str);
wd.appendField({ android: 'div' }, str);
wd.appendField({ ios: 'div' }, str);
// @ts-ignore
wd.appendField(locate('div'), str);

expectError(wd.clearField());
wd.clearField('div');
wd.clearField({ css: 'div' });
wd.clearField({ xpath: '//div' });
wd.clearField({ name: 'div' });
wd.clearField({ id: 'div' });
wd.clearField({ android: 'div' });
wd.clearField({ ios: 'div' });

expectError(wd.selectOption());
expectError(wd.selectOption('div'));
expectType<void>(wd.selectOption('div', str));

expectError(wd.attachFile());
expectError(wd.attachFile('div'));
expectType<void>(wd.attachFile('div', str));

expectError(wd.checkOption());
expectType<void>(wd.checkOption('div'));

expectError(wd.uncheckOption());
expectType<void>(wd.uncheckOption('div'));

expectError(wd.seeInTitle());
expectType<void>(wd.seeInTitle(str));

expectError(wd.seeTitleEquals());
expectType<void>(wd.seeTitleEquals(str));

expectError(wd.dontSeeInTitle());
expectType<void>(wd.dontSeeInTitle(str));

expectError(wd.see());
expectType<void>(wd.see(str));
expectType<void>(wd.see(str, 'div'));

expectError(wd.dontSee());
expectType<void>(wd.dontSee(str));
expectType<void>(wd.dontSee(str, 'div'));

expectError(wd.seeTextEquals());
expectType<void>(wd.seeTextEquals(str));
expectType<void>(wd.seeTextEquals(str, 'div'));

expectError(wd.seeInField());
expectError(wd.seeInField('div'));
expectType<void>(wd.seeInField('div', str));

expectError(wd.dontSeeInField());
expectError(wd.dontSeeInField('div'));
expectType<void>(wd.dontSeeInField('div', str));

expectError(wd.seeCheckboxIsChecked());
expectType<void>(wd.seeCheckboxIsChecked('div'));

expectError(wd.dontSeeCheckboxIsChecked());
expectType<void>(wd.dontSeeCheckboxIsChecked('div'));

expectError(wd.seeElement());
expectType<void>(wd.seeElement('div'));

expectError(wd.dontSeeElement());
expectType<void>(wd.dontSeeElement('div'));

expectError(wd.seeElementInDOM());
expectType<void>(wd.seeElementInDOM('div'));

expectError(wd.dontSeeElementInDOM());
expectType<void>(wd.dontSeeElementInDOM('div'));

expectError(wd.seeInSource());
expectType<void>(wd.seeInSource(str));

expectError(wd.dontSeeInSource());
expectType<void>(wd.dontSeeInSource(str));

expectError(wd.seeNumberOfElements());
expectError(wd.seeNumberOfElements('div'));
expectType<void>(wd.seeNumberOfElements('div', num));

expectError(wd.seeNumberOfVisibleElements());
expectError(wd.seeNumberOfVisibleElements('div'));
expectType<void>(wd.seeNumberOfVisibleElements('div', num));

expectError(wd.seeCssPropertiesOnElements());
expectError(wd.seeCssPropertiesOnElements('div'));
expectType<void>(wd.seeCssPropertiesOnElements('div', str));

expectError(wd.seeAttributesOnElements());
expectError(wd.seeAttributesOnElements('div'));
expectType<void>(wd.seeAttributesOnElements('div', str));

expectError(wd.seeInCurrentUrl());
expectType<void>(wd.seeInCurrentUrl(str));

expectError(wd.seeCurrentUrlEquals());
expectType<void>(wd.seeCurrentUrlEquals(str));

expectError(wd.dontSeeInCurrentUrl());
expectType<void>(wd.dontSeeInCurrentUrl(str));

expectError(wd.dontSeeCurrentUrlEquals());
expectType<void>(wd.dontSeeCurrentUrlEquals(str));

expectError(wd.executeScript());
expectType<Promise<any>>(wd.executeScript(str));
expectType<Promise<any>>(wd.executeScript(() => {}));
expectType<Promise<any>>(wd.executeScript(() => {}, {}));

expectError(wd.executeAsyncScript());
expectType<Promise<any>>(wd.executeAsyncScript(str));
expectType<Promise<any>>(wd.executeAsyncScript(() => {}));
expectType<Promise<any>>(wd.executeAsyncScript(() => {}, {}));

expectError(wd.scrollIntoView());
expectError(wd.scrollIntoView('div'));
wd.scrollIntoView('div', true);
wd.scrollIntoView('div', { behavior: 'auto', block: 'center', inline: 'center' });

expectError(wd.scrollTo());
expectType<void>(wd.scrollTo('div'));
expectType<void>(wd.scrollTo('div', num, num));

expectError(wd.moveCursorTo());
expectType<void>(wd.moveCursorTo('div'));
expectType<void>(wd.moveCursorTo('div', num, num));

expectError(wd.saveScreenshot());
expectType<void>(wd.saveScreenshot(str));
expectType<void>(wd.saveScreenshot(str, true));

expectError(wd.setCookie());
expectType<void>(wd.setCookie({ name: str, value: str }));
expectType<void>(wd.setCookie([{ name: str, value: str }]));

expectType<void>(wd.clearCookie());
expectType<void>(wd.clearCookie(str));

expectError(wd.seeCookie());
expectType<void>(wd.seeCookie(str));

expectType<void>(wd.acceptPopup());

expectType<void>(wd.cancelPopup());

expectError(wd.seeInPopup());
expectType<void>(wd.seeInPopup(str));

expectError(wd.pressKeyDown());
expectType<void>(wd.pressKeyDown(str));

expectError(wd.pressKeyUp());
expectType<void>(wd.pressKeyUp(str));

expectError(wd.pressKey());
expectType<void>(wd.pressKey(str));

expectError(wd.type());
expectType<void>(wd.type(str));

expectError(wd.resizeWindow());
expectError(wd.resizeWindow(num));
expectType<void>(wd.resizeWindow(num, num));

expectError(wd.dragAndDrop());
expectError(wd.dragAndDrop('div'));
expectType<void>(wd.dragAndDrop('div', 'div'));

expectError(wd.dragSlider());
expectType<void>(wd.dragSlider('div', num));

expectError(wd.switchToWindow());
expectType<void>(wd.switchToWindow(str));

expectType<void>(wd.closeOtherTabs());

expectError(wd.wait());
expectType<void>(wd.wait(num));

expectError(wd.waitForEnabled());
expectType<void>(wd.waitForEnabled('div'));
expectType<void>(wd.waitForEnabled('div', num));

expectError(wd.waitForElement());
expectType<void>(wd.waitForElement('div'));
expectType<void>(wd.waitForElement('div', num));

expectError(wd.waitForClickable());
expectType<void>(wd.waitForClickable('div'));
expectType<void>(wd.waitForClickable('div', num));

expectError(wd.waitForVisible());
expectType<void>(wd.waitForVisible('div'));
expectType<void>(wd.waitForVisible('div', num));

expectError(wd.waitForInvisible());
expectType<void>(wd.waitForInvisible('div'));
expectType<void>(wd.waitForInvisible('div', num));

expectError(wd.waitToHide());
expectType<void>(wd.waitToHide('div'));
expectType<void>(wd.waitToHide('div', num));

expectError(wd.waitForDetached());
expectType<void>(wd.waitForDetached('div'));
expectType<void>(wd.waitForDetached('div', num));

expectError(wd.waitForFunction());
expectType<void>(wd.waitForFunction('div'));
expectType<void>(wd.waitForFunction(() => {}));
expectType<void>(wd.waitForFunction(() => {}, [num], num));
expectType<void>(wd.waitForFunction(() => {}, [str], num));

expectError(wd.waitInUrl());
expectType<void>(wd.waitInUrl(str));
expectType<void>(wd.waitInUrl(str, num));

expectError(wd.waitForText());
expectType<void>(wd.waitForText(str));
expectType<void>(wd.waitForText(str, num, str));

expectError(wd.waitForValue());
expectError(wd.waitForValue(str));
expectType<void>(wd.waitForValue(str, str));
expectType<void>(wd.waitForValue(str, str, num));

expectError(wd.waitNumberOfVisibleElements());
expectError(wd.waitNumberOfVisibleElements('div'));
expectType<void>(wd.waitNumberOfVisibleElements(str, num));
expectType<void>(wd.waitNumberOfVisibleElements(str, num, num));

expectError(wd.waitUrlEquals());
expectType<void>(wd.waitUrlEquals(str));
expectType<void>(wd.waitUrlEquals(str, num));

expectType<void>(wd.switchTo());
expectType<void>(wd.switchTo('div'));

expectType<void>(wd.switchToNextTab(num, num));

expectType<void>(wd.switchToPreviousTab(num, num));

expectType<void>(wd.closeCurrentTab());

expectType<void>(wd.openNewTab());

expectType<void>(wd.refreshPage());

expectType<void>(wd.scrollPageToTop());

expectType<void>(wd.scrollPageToBottom());

expectError(wd.dontSeeCookie());
expectType<void>(wd.dontSeeCookie(str));

expectError(wd.dragAndDrop());
expectError(wd.dragAndDrop('#dragHandle'));
wd.dragAndDrop('#dragHandle', '#container');

expectError(wd.grabTextFromAll());
expectType<Promise<string[]>>(wd.grabTextFromAll('div'));

expectError(wd.grabTextFrom());
expectType<Promise<string>>(wd.grabTextFrom('div'));

expectError(wd.grabHTMLFromAll());
expectType<Promise<string[]>>(wd.grabHTMLFromAll('div'));

expectError(wd.grabHTMLFrom());
expectType<Promise<string>>(wd.grabHTMLFrom('div'));

expectError(wd.grabValueFromAll());
expectType<Promise<string[]>>(wd.grabValueFromAll('div'));

expectError(wd.grabValueFrom());
expectType<Promise<string>>(wd.grabValueFrom('div'));

expectError(wd.grabCssPropertyFromAll());
expectError(wd.grabCssPropertyFromAll('div'));
expectType<Promise<string[]>>(wd.grabCssPropertyFromAll('div', 'color'));

expectError(wd.grabCssPropertyFrom());
expectError(wd.grabCssPropertyFrom('div'));
expectType<Promise<string>>(wd.grabCssPropertyFrom('div', 'color'));

expectError(wd.grabAttributeFromAll());
expectError(wd.grabAttributeFromAll('div'));
expectType<Promise<string[]>>(wd.grabAttributeFromAll('div', 'style'));

expectError(wd.grabAttributeFrom());
expectError(wd.grabAttributeFrom('div'));
expectType<Promise<string>>(wd.grabAttributeFrom('div', 'style'));

expectType<Promise<string>>(wd.grabTitle());

expectType<Promise<string>>(wd.grabSource());

wd.grabBrowserLogs(); // $ExpectType Promise<object[]> | undefined

expectType<Promise<string>>(wd.grabCurrentUrl());

expectError(wd.grabNumberOfVisibleElements());
expectType<Promise<number>>(wd.grabNumberOfVisibleElements('div'));

wd.grabCookie(); // $ExpectType any
wd.grabCookie('name'); // $ExpectType any

expectType<Promise<string>>(wd.grabPopupText());

expectType<Promise<string[]>>(wd.grabAllWindowHandles());
expectType<Promise<string>>(wd.grabCurrentWindowHandle());

expectType<Promise<number>>(wd.grabNumberOfOpenTabs());

const psp = wd.grabPageScrollPosition(); // $ExpectType Promise<PageScrollPosition>
psp.then(
  result => {
    result.x; // $ExpectType number
    result.y; // $ExpectType number
  },
);

expectError(wd.grabElementBoundingRect());
//expectType<Promise<number>>(wd.grabElementBoundingRect('h3'));
//expectType<Promise<number>>(wd.grabElementBoundingRect('h3', 'width'));
