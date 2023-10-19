export {}; // mark the file as external module to redeclare variables in the same block

const playwright = new CodeceptJS.PlaywrightTs();

const str = 'text';
const num = 1;
const position = { x: 100, y: 200 };
const sourcePosition = { x: 10, y: 20 };
const targetPosition = { x: 20, y: 30 };

playwright.usePlaywrightTo(str, () => {}); // $ExpectType Promise<any>
playwright.amAcceptingPopups(); // $ExpectType Promise<any>
playwright.acceptPopup(); // $ExpectType Promise<any>
playwright.amCancellingPopups(); // $ExpectType Promise<any>
playwright.cancelPopup(); // $ExpectType Promise<any>
playwright.seeInPopup(str); // $ExpectType Promise<any>
playwright._setPage(str); // $ExpectType Promise<any>
playwright._addPopupListener(); // $ExpectType Promise<any>
playwright._getPageUrl(); // $ExpectType Promise<any>
playwright.grabPopupText(); // $ExpectType Promise<string | null>
playwright.amOnPage(str); // $ExpectType Promise<any>
playwright.resizeWindow(num, num); // $ExpectType Promise<any>
playwright.setPlaywrightRequestHeaders(str); // $ExpectType Promise<any>
playwright.moveCursorTo(str, num, num); // $ExpectType Promise<any>
playwright.dragAndDrop(str); // $ExpectError
playwright.dragAndDrop(str, str); // $ExpectType Promise<any>
playwright.dragAndDrop(str, str, { sourcePosition, targetPosition }); // $ExpectType Promise<any>
playwright.refreshPage(); // $ExpectType Promise<any>
playwright.scrollPageToTop(); // $ExpectType Promise<any>
playwright.scrollPageToBottom(); // $ExpectType Promise<any>
playwright.scrollTo(str, num, num); // $ExpectType Promise<any>
playwright.seeInTitle(str); // $ExpectType Promise<any>
playwright.grabPageScrollPosition(); // $ExpectType Promise<PageScrollPosition>
playwright.seeTitleEquals(str); // $ExpectType Promise<any>
playwright.dontSeeInTitle(str); // $ExpectType Promise<any>
playwright.grabTitle(); // $ExpectType Promise<string>
playwright._locate(); // $ExpectType Promise<any>
playwright._locateCheckable(); // $ExpectType Promise<any>
playwright._locateClickable(); // $ExpectType Promise<any>
playwright._locateFields(); // $ExpectType Promise<any>
playwright.switchToNextTab(); // $ExpectType Promise<any>
playwright.switchToPreviousTab(); // $ExpectType Promise<any>
playwright.closeCurrentTab(); // $ExpectType Promise<any>
playwright.closeOtherTabs(); // $ExpectType Promise<any>
playwright.openNewTab(); // $ExpectType Promise<any>
playwright.grabNumberOfOpenTabs(); // $ExpectType Promise<number>
playwright.seeElement(str); // $ExpectType Promise<any>
playwright.dontSeeElement(str); // $ExpectType Promise<any>
playwright.seeElementInDOM(str); // $ExpectType Promise<any>
playwright.dontSeeElementInDOM(str); // $ExpectType Promise<any>
playwright.handleDownloads(str); // $ExpectType Promise<void>
playwright.click(str); // $ExpectType Promise<any>
playwright.click(str, str); // $ExpectType Promise<any>
playwright.click(str, null, { position }); // $ExpectType Promise<any>
playwright.clickLink(); // $ExpectType Promise<any>
playwright.forceClick(str); // $ExpectType Promise<any>
playwright.focus(str); // $ExpectType Promise<any>
playwright.blur(str); // $ExpectType Promise<any>
playwright.doubleClick(str); // $ExpectType Promise<any>
playwright.rightClick(str); // $ExpectType Promise<any>
playwright.checkOption(str); // $ExpectType Promise<any>
playwright.uncheckOption(str); // $ExpectType Promise<any>
playwright.seeCheckboxIsChecked(str); // $ExpectType Promise<any>
playwright.dontSeeCheckboxIsChecked(str); // $ExpectType Promise<any>
playwright.pressKeyDown(str); // $ExpectType Promise<any>
playwright.pressKeyUp(str); // $ExpectType Promise<any>
playwright.pressKey(str); // $ExpectType Promise<any>
playwright.type(str); // $ExpectType Promise<any>
playwright.fillField(str, str); // $ExpectType Promise<any>
playwright.clearField(str); // $ExpectType Promise<any>
playwright.appendField(str, str); // $ExpectType Promise<any>
playwright.seeInField(str, str); // $ExpectType Promise<any>
playwright.dontSeeInField(str, str); // $ExpectType Promise<any>
playwright.attachFile(str, str); // $ExpectType Promise<any>
playwright.selectOption(str, str); // $ExpectType Promise<any>
playwright.grabNumberOfVisibleElements(str); // $ExpectType Promise<number>
playwright.seeInCurrentUrl(str); // $ExpectType Promise<any>
playwright.dontSeeInCurrentUrl(str); // $ExpectType Promise<any>
playwright.seeCurrentUrlEquals(str); // $ExpectType Promise<any>
playwright.dontSeeCurrentUrlEquals(str); // $ExpectType Promise<any>
playwright.see(str); // $ExpectType Promise<any>
playwright.seeTextEquals(str); // $ExpectType Promise<any>
playwright.dontSee(str); // $ExpectType Promise<any>
playwright.grabSource(); // $ExpectType Promise<string>
playwright.grabBrowserLogs(); // $ExpectType Promise<any[]>
playwright.grabCurrentUrl(); // $ExpectType Promise<string>
playwright.seeInSource(str); // $ExpectType Promise<any>
playwright.dontSeeInSource(str); // $ExpectType Promise<any>
playwright.seeNumberOfElements(str, num); // $ExpectType Promise<any>
playwright.seeNumberOfVisibleElements(str, num); // $ExpectType Promise<any>
playwright.setCookie({ name: str, value: str}); // $ExpectType Promise<any>
playwright.seeCookie(str); // $ExpectType Promise<any>
playwright.dontSeeCookie(str); // $ExpectType Promise<any>
playwright.grabCookie(); // $ExpectType Promise<string[]> | Promise<string>
playwright.clearCookie(); // $ExpectType Promise<any>
playwright.executeScript(() => {}); // $ExpectType Promise<any>
playwright.grabTextFrom(str); // $ExpectType Promise<string>
playwright.grabTextFromAll(str); // $ExpectType Promise<string[]>
playwright.grabValueFrom(str); // $ExpectType Promise<string>
playwright.grabValueFromAll(str); // $ExpectType Promise<string[]>
playwright.grabHTMLFrom(str); // $ExpectType Promise<string>
playwright.grabHTMLFromAll(str); // $ExpectType Promise<string[]>
playwright.grabCssPropertyFrom(str, str); // $ExpectType Promise<string>
playwright.grabCssPropertyFromAll(str, str); // $ExpectType Promise<string[]>
playwright.seeCssPropertiesOnElements(str, str); // $ExpectType Promise<any>
playwright.seeAttributesOnElements(str, str); // $ExpectType Promise<any>
playwright.dragSlider(str, num); // $ExpectType Promise<any>
playwright.grabAttributeFrom(str, str); // $ExpectType Promise<string>
playwright.grabAttributeFromAll(str, str); // $ExpectType Promise<string[]>
playwright.saveElementScreenshot(str, str); // $ExpectType Promise<any>
playwright.saveScreenshot(str); // $ExpectType Promise<any>
playwright.makeApiRequest(str, str, str); // $ExpectType Promise<object>
playwright.wait(num); // $ExpectType Promise<any>
playwright.waitForEnabled(str); // $ExpectType Promise<any>
playwright.waitForValue(str, str); // $ExpectType Promise<any>
playwright.waitNumberOfVisibleElements(str, num); // $ExpectType Promise<any>
playwright.waitForClickable(str); // $ExpectType Promise<any>
playwright.waitForElement(str); // $ExpectType Promise<any>
playwright.waitForVisible(str); // $ExpectType Promise<any>
playwright.waitForInvisible(str); // $ExpectType Promise<any>
playwright.waitToHide(str); // $ExpectType Promise<any>
playwright.waitInUrl(str); // $ExpectType Promise<any>
playwright.waitUrlEquals(str); // $ExpectType Promise<any>
playwright.waitForText(str); // $ExpectType Promise<any>
playwright.waitForRequest(str); // $ExpectType Promise<any>
playwright.waitForResponse(str); // $ExpectType Promise<any>
playwright.switchTo(); // $ExpectType Promise<any>
playwright.waitForFunction(() => { }); // $ExpectType Promise<any>
playwright.waitForNavigation(str); // $ExpectType Promise<any>
playwright.waitForDetached(str); // $ExpectType Promise<any>
playwright.grabDataFromPerformanceTiming(); // $ExpectType Promise<any>
playwright.grabElementBoundingRect(str); // $ExpectType Promise<number> | Promise<DOMRect>
playwright.mockRoute(str); // $ExpectType Promise<any>
playwright.stopMockingRoute(str); // $ExpectType Promise<any>

playwright.startRecordingTraffic(); // $ExpectType Promise<any>
playwright.stopRecordingTraffic(); // $ExpectType Promise<any>
playwright.seeTraffic(); // $ExpectError
playwright.seeTraffic(str); // $ExpectError
playwright.seeTraffic({ name: str, url: str}); // $ExpectType Promise<any>
playwright.seeTraffic({ name: str }); // $ExpectError
playwright.seeTraffic({ url: str }); // $ExpectError
playwright.dontSeeTraffic(); // $ExpectError
playwright.dontSeeTraffic(str); // $ExpectError
playwright.dontSeeTraffic({ name: str, url: str}); // $ExpectType Promise<any>
playwright.dontSeeTraffic({ name: str, url: /hello/}); // $ExpectType Promise<any>
playwright.dontSeeTraffic({ name: str }); // $ExpectError
playwright.dontSeeTraffic({ url: str }); // $ExpectError
