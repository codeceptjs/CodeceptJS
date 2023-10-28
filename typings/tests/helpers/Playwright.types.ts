export {}; // mark the file as external module to redeclare variables in the same block

const playwright = new CodeceptJS.Playwright();

const str = 'text';
const num = 1;
const position = { x: 100, y: 200 };
const sourcePosition = { x: 10, y: 20 };
const targetPosition = { x: 20, y: 30 };

playwright.usePlaywrightTo(str, () => {}); // $ExpectType void
playwright.amAcceptingPopups(); // $ExpectType void
playwright.acceptPopup(); // $ExpectType void
playwright.amCancellingPopups(); // $ExpectType void
playwright.cancelPopup(); // $ExpectType void
playwright.seeInPopup(str); // $ExpectType Promise<void>
playwright._setPage(str); // $ExpectType void
playwright._addPopupListener(); // $ExpectType void
playwright._getPageUrl(); // $ExpectType void
playwright.grabPopupText(); // $ExpectType Promise<string | null>
playwright._createContextPage(); // $ExpectType void
playwright._createContextPage({}); // $ExpectType void
playwright.amOnPage(str); // $ExpectType Promise<void>
playwright.resizeWindow(num, num); // $ExpectType Promise<void>
playwright.haveRequestHeaders(str); // $ExpectType void
playwright.moveCursorTo(str, num, num); // $ExpectType Promise<void>
playwright.dragAndDrop(str); // $ExpectError
playwright.dragAndDrop(str, str); // $ExpectType Promise<void>
playwright.dragAndDrop(str, str, { sourcePosition, targetPosition }); // $ExpectType Promise<void>
playwright.restartBrowser(); // $ExpectType void
playwright.restartBrowser({}); // $ExpectType void
playwright.refreshPage(); // $ExpectType Promise<void>
playwright.scrollPageToTop(); // $ExpectType Promise<void>
playwright.scrollPageToBottom(); // $ExpectType Promise<void>
playwright.scrollTo(str, num, num); // $ExpectType Promise<void>
playwright.seeInTitle(str); // $ExpectType Promise<void>
playwright.grabPageScrollPosition(); // $ExpectType Promise<PageScrollPosition>
playwright.seeTitleEquals(str); // $ExpectType Promise<void>
playwright.dontSeeInTitle(str); // $ExpectType Promise<void>
playwright.grabTitle(); // $ExpectType Promise<string>
playwright._locate(); // $ExpectType void
playwright._locateCheckable(); // $ExpectType void
playwright._locateClickable(); // $ExpectType void
playwright._locateFields(); // $ExpectType void
playwright.switchToNextTab(); // $ExpectType void
playwright.switchToPreviousTab(); // $ExpectType void
playwright.closeCurrentTab(); // $ExpectType void
playwright.closeOtherTabs(); // $ExpectType void
playwright.openNewTab(); // $ExpectType void
playwright.grabNumberOfOpenTabs(); // $ExpectType Promise<number>
playwright.seeElement(str); // $ExpectType Promise<void>
playwright.dontSeeElement(str); // $ExpectType Promise<void>
playwright.seeElementInDOM(str); // $ExpectType Promise<void>
playwright.dontSeeElementInDOM(str); // $ExpectType Promise<void>
playwright.handleDownloads(str); // $ExpectType Promise<void>
playwright.click(str); // $ExpectType Promise<void>
playwright.click(str, str); // $ExpectType Promise<void>
playwright.click(str, null, { position }); // $ExpectType Promise<void>
playwright.clickLink(); // $ExpectType void
playwright.forceClick(str); // $ExpectType Promise<void>
playwright.focus(str); // $ExpectType Promise<void>
playwright.blur(str); // $ExpectType Promise<void>
playwright.doubleClick(str); // $ExpectType Promise<void>
playwright.rightClick(str); // $ExpectType Promise<void>
playwright.checkOption(str); // $ExpectType Promise<void>
playwright.uncheckOption(str); // $ExpectType Promise<void>
playwright.seeCheckboxIsChecked(str); // $ExpectType Promise<void>
playwright.dontSeeCheckboxIsChecked(str); // $ExpectType Promise<void>
playwright.pressKeyDown(str); // $ExpectType Promise<void>
playwright.pressKeyUp(str); // $ExpectType Promise<void>
playwright.pressKey(str); // $ExpectType Promise<void>
playwright.type(str); // $ExpectType Promise<void>
playwright.fillField(str, str); // $ExpectType Promise<void>
playwright.clearField(str); // $ExpectType void
playwright.appendField(str, str); // $ExpectType Promise<void>
playwright.seeInField(str, str); // $ExpectType Promise<void>
playwright.dontSeeInField(str, str); // $ExpectType Promise<void>
playwright.attachFile(str, str); // $ExpectType Promise<void>
playwright.selectOption(str, str); // $ExpectType Promise<void>
playwright.grabNumberOfVisibleElements(str); // $ExpectType Promise<number>
playwright.seeInCurrentUrl(str); // $ExpectType Promise<void>
playwright.dontSeeInCurrentUrl(str); // $ExpectType Promise<void>
playwright.seeCurrentUrlEquals(str); // $ExpectType Promise<void>
playwright.dontSeeCurrentUrlEquals(str); // $ExpectType Promise<void>
playwright.see(str); // $ExpectType Promise<void>
playwright.seeTextEquals(str); // $ExpectType Promise<void>
playwright.dontSee(str); // $ExpectType Promise<void>
playwright.grabSource(); // $ExpectType Promise<string>
playwright.grabBrowserLogs(); // $ExpectType Promise<any[]>
playwright.grabCurrentUrl(); // $ExpectType Promise<string>
playwright.seeInSource(str); // $ExpectType Promise<void>
playwright.dontSeeInSource(str); // $ExpectType Promise<void>
playwright.seeNumberOfElements(str, num); // $ExpectType Promise<void>
playwright.seeNumberOfVisibleElements(str, num); // $ExpectType Promise<void>
playwright.setCookie({ name: str, value: str}); // $ExpectType Promise<void>
playwright.seeCookie(str); // $ExpectType Promise<void>
playwright.dontSeeCookie(str); // $ExpectType Promise<void>
playwright.grabCookie(); // $ExpectType any
playwright.clearCookie(); // $ExpectType Promise<void>
playwright.executeScript(() => {}); // $ExpectType Promise<any>
playwright.grabTextFrom(str); // $ExpectType Promise<string>
playwright.grabTextFromAll(str); // $ExpectType Promise<string[]>
playwright.grabValueFrom(str); // $ExpectType Promise<string>
playwright.grabValueFromAll(str); // $ExpectType Promise<string[]>
playwright.grabHTMLFrom(str); // $ExpectType Promise<string>
playwright.grabHTMLFromAll(str); // $ExpectType Promise<string[]>
playwright.grabCssPropertyFrom(str, str); // $ExpectType Promise<string>
playwright.grabCssPropertyFromAll(str, str); // $ExpectType Promise<string[]>
playwright.seeCssPropertiesOnElements(str, str); // $ExpectType Promise<void>
playwright.seeAttributesOnElements(str, str); // $ExpectType Promise<void>
playwright.dragSlider(str, num); // $ExpectType Promise<void>
playwright.grabAttributeFrom(str, str); // $ExpectType Promise<string>
playwright.grabAttributeFromAll(str, str); // $ExpectType Promise<string[]>
playwright.saveElementScreenshot(str, str); // $ExpectType Promise<void>
playwright.saveScreenshot(str); // $ExpectType Promise<void>
playwright.makeApiRequest(str, str, str); // $ExpectType Promise<object>
playwright.wait(num); // $ExpectType Promise<void>
playwright.waitForEnabled(str); // $ExpectType Promise<void>
playwright.waitForValue(str, str); // $ExpectType Promise<void>
playwright.waitNumberOfVisibleElements(str, num); // $ExpectType Promise<void>
playwright.waitForClickable(str); // $ExpectType Promise<void>
playwright.waitForElement(str); // $ExpectType Promise<void>
playwright.waitForVisible(str); // $ExpectType Promise<void>
playwright.waitForInvisible(str); // $ExpectType Promise<void>
playwright.waitToHide(str); // $ExpectType Promise<void>
playwright.waitInUrl(str); // $ExpectType Promise<void>
playwright.waitUrlEquals(str); // $ExpectType Promise<void>
playwright.waitForText(str); // $ExpectType Promise<void>
playwright.waitForRequest(str); // $ExpectType void
playwright.waitForResponse(str); // $ExpectType void
playwright.switchTo(); // $ExpectType Promise<void>
playwright.waitForFunction(() => { }); // $ExpectType Promise<void>
playwright.waitForNavigation(str); // $ExpectType void
playwright.waitForDetached(str); // $ExpectType Promise<void>
playwright.grabDataFromPerformanceTiming(); // $ExpectType Promise<void>
playwright.grabElementBoundingRect(str); // $ExpectType Promise<number> | Promise<DOMRect>
playwright.mockRoute(str); // $ExpectType void
playwright.stopMockingRoute(str); // $ExpectType void

playwright.startRecordingTraffic(); // $ExpectType void
playwright.stopRecordingTraffic(); // $ExpectType void
playwright.seeTraffic(); // $ExpectError
playwright.seeTraffic(str); // $ExpectError
playwright.seeTraffic({ name: str }); // $ExpectError
playwright.seeTraffic({ url: str }); // $ExpectError
playwright.seeTraffic({ name: str, url: str}); // $ExpectType Promise<any>
playwright.dontSeeTraffic(); // $ExpectError
playwright.dontSeeTraffic(str); // $ExpectError
playwright.dontSeeTraffic({ name: str, url: str}); // $ExpectType void
playwright.dontSeeTraffic({ name: str, url: /hello/}); // $ExpectType void
playwright.dontSeeTraffic({ name: str }); // $ExpectError
playwright.dontSeeTraffic({ url: str }); // $ExpectError
