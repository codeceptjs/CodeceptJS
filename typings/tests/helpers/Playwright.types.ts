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
playwright.seeInPopup(str); // $ExpectType void
playwright._setPage(str); // $ExpectType void
playwright._addPopupListener(); // $ExpectType void
playwright._getPageUrl(); // $ExpectType void
playwright.grabPopupText(); // $ExpectType Promise<string | null>
playwright._createContextPage(); // $ExpectType void
playwright._createContextPage({}); // $ExpectType void
playwright.amOnPage(str); // $ExpectType void
playwright.resizeWindow(num, num); // $ExpectType void
playwright.haveRequestHeaders(str); // $ExpectType void
playwright.moveCursorTo(str, num, num); // $ExpectType void
playwright.dragAndDrop(str); // $ExpectError
playwright.dragAndDrop(str, str); // $ExpectType void
playwright.dragAndDrop(str, str, { sourcePosition, targetPosition }); // $ExpectType void
playwright.restartBrowser(); // $ExpectType void
playwright.restartBrowser({}); // $ExpectType void
playwright.refreshPage(); // $ExpectType void
playwright.scrollPageToTop(); // $ExpectType void
playwright.scrollPageToBottom(); // $ExpectType void
playwright.scrollTo(str, num, num); // $ExpectType void
playwright.seeInTitle(str); // $ExpectType void
playwright.grabPageScrollPosition(); // $ExpectType Promise<PageScrollPosition>
playwright.seeTitleEquals(str); // $ExpectType void
playwright.dontSeeInTitle(str); // $ExpectType void
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
playwright.seeElement(str); // $ExpectType void
playwright.dontSeeElement(str); // $ExpectType void
playwright.seeElementInDOM(str); // $ExpectType void
playwright.dontSeeElementInDOM(str); // $ExpectType void
playwright.handleDownloads(str); // $ExpectType Promise<void>
playwright.click(str); // $ExpectType void
playwright.click(str, str); // $ExpectType void
playwright.click(str, null, { position }); // $ExpectType void
playwright.clickLink(); // $ExpectType void
playwright.forceClick(str); // $ExpectType void
playwright.focus(str); // $ExpectType void
playwright.blur(str); // $ExpectType void
playwright.doubleClick(str); // $ExpectType void
playwright.rightClick(str); // $ExpectType void
playwright.checkOption(str); // $ExpectType void
playwright.uncheckOption(str); // $ExpectType void
playwright.seeCheckboxIsChecked(str); // $ExpectType void
playwright.dontSeeCheckboxIsChecked(str); // $ExpectType void
playwright.pressKeyDown(str); // $ExpectType void
playwright.pressKeyUp(str); // $ExpectType void
playwright.pressKey(str); // $ExpectType void
playwright.type(str); // $ExpectType void
playwright.fillField(str, str); // $ExpectType void
playwright.clearField(str); // $ExpectType void
playwright.clear(str); // $ExpectType void
playwright.appendField(str, str); // $ExpectType void
playwright.seeInField(str, str); // $ExpectType void
playwright.dontSeeInField(str, str); // $ExpectType void
playwright.attachFile(str, str); // $ExpectType void
playwright.selectOption(str, str); // $ExpectType void
playwright.grabNumberOfVisibleElements(str); // $ExpectType Promise<number>
playwright.seeInCurrentUrl(str); // $ExpectType void
playwright.dontSeeInCurrentUrl(str); // $ExpectType void
playwright.seeCurrentUrlEquals(str); // $ExpectType void
playwright.dontSeeCurrentUrlEquals(str); // $ExpectType void
playwright.see(str); // $ExpectType void
playwright.seeTextEquals(str); // $ExpectType void
playwright.dontSee(str); // $ExpectType void
playwright.grabSource(); // $ExpectType Promise<string>
playwright.grabBrowserLogs(); // $ExpectType Promise<any[]>
playwright.grabCurrentUrl(); // $ExpectType Promise<string>
playwright.seeInSource(str); // $ExpectType void
playwright.dontSeeInSource(str); // $ExpectType void
playwright.seeNumberOfElements(str, num); // $ExpectType void
playwright.seeNumberOfVisibleElements(str, num); // $ExpectType void
playwright.setCookie({ name: str, value: str}); // $ExpectType void
playwright.seeCookie(str); // $ExpectType void
playwright.dontSeeCookie(str); // $ExpectType void
playwright.grabCookie(); // $ExpectType Promise<string[]> | Promise<string>
playwright.clearCookie(); // $ExpectType void
playwright.executeScript(() => {}); // $ExpectType Promise<any>
playwright.grabTextFrom(str); // $ExpectType Promise<string>
playwright.grabTextFromAll(str); // $ExpectType Promise<string[]>
playwright.grabValueFrom(str); // $ExpectType Promise<string>
playwright.grabValueFromAll(str); // $ExpectType Promise<string[]>
playwright.grabHTMLFrom(str); // $ExpectType Promise<string>
playwright.grabHTMLFromAll(str); // $ExpectType Promise<string[]>
playwright.grabCssPropertyFrom(str, str); // $ExpectType Promise<string>
playwright.grabCssPropertyFromAll(str, str); // $ExpectType Promise<string[]>
playwright.seeCssPropertiesOnElements(str, str); // $ExpectType void
playwright.seeAttributesOnElements(str, str); // $ExpectType void
playwright.dragSlider(str, num); // $ExpectType void
playwright.grabAttributeFrom(str, str); // $ExpectType Promise<string>
playwright.grabAttributeFromAll(str, str); // $ExpectType Promise<string[]>
playwright.saveElementScreenshot(str, str); // $ExpectType void
playwright.saveScreenshot(str); // $ExpectType void
playwright.makeApiRequest(str, str, str); // $ExpectType Promise<object>
playwright.wait(num); // $ExpectType void
playwright.waitForEnabled(str); // $ExpectType void
playwright.waitForValue(str, str); // $ExpectType void
playwright.waitNumberOfVisibleElements(str, num); // $ExpectType void
playwright.waitForClickable(str); // $ExpectType void
playwright.waitForElement(str); // $ExpectType void
playwright.waitForVisible(str); // $ExpectType void
playwright.waitForInvisible(str); // $ExpectType void
playwright.waitToHide(str); // $ExpectType void
playwright.waitInUrl(str); // $ExpectType void
playwright.waitUrlEquals(str); // $ExpectType void
playwright.waitForText(str); // $ExpectType void
playwright.waitForRequest(str); // $ExpectType void
playwright.waitForResponse(str); // $ExpectType void
playwright.switchTo(); // $ExpectType void
playwright.waitForFunction(() => { }); // $ExpectType void
playwright.waitForNavigation(str); // $ExpectType void
playwright.waitForDetached(str); // $ExpectType void
playwright.grabDataFromPerformanceTiming(); // $ExpectType Promise<any>
playwright.grabElementBoundingRect(str); // $ExpectType Promise<number> | Promise<DOMRect>
playwright.mockRoute(str); // $ExpectType void
playwright.stopMockingRoute(str); // $ExpectType void
