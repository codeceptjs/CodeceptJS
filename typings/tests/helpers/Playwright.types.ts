const playwright = new CodeceptJS.Playwright();

const str_pl = 'text';
const num_pl = 1;
const position = { x: 100, y: 200 };
const sourcePosition = { x: 10, y: 20 };
const targetPosition = { x: 20, y: 30 };

playwright.usePlaywrightTo(str_pl, () => {}); // $ExpectType Promise<any>
playwright.amAcceptingPopups(); // $ExpectType Promise<any>
playwright.acceptPopup(); // $ExpectType Promise<any>
playwright.amCancellingPopups(); // $ExpectType Promise<any>
playwright.cancelPopup(); // $ExpectType Promise<any>
playwright.seeInPopup(str_pl); // $ExpectType Promise<any>
playwright._setPage(str_pl); // $ExpectType Promise<any>
playwright._addPopupListener(); // $ExpectType Promise<any>
playwright._getPageUrl(); // $ExpectType Promise<any>
playwright.grabPopupText(); // $ExpectType Promise<string | null>
playwright.amOnPage(str_pl); // $ExpectType Promise<any>
playwright.resizeWindow(num_pl, num_pl); // $ExpectType Promise<any>
playwright.haveRequestHeaders(str_pl); // $ExpectType Promise<any>
playwright.moveCursorTo(str_pl, num_pl, num_pl); // $ExpectType Promise<any>
playwright.dragAndDrop(str_pl); // $ExpectError
playwright.dragAndDrop(str_pl, str_pl); // $ExpectType Promise<any>
playwright.dragAndDrop(str_pl, str_pl, { sourcePosition, targetPosition }); // $ExpectType Promise<any>
playwright.refreshPage(); // $ExpectType Promise<any>
playwright.scrollPageToTop(); // $ExpectType Promise<any>
playwright.scrollPageToBottom(); // $ExpectType Promise<any>
playwright.scrollTo(str_pl, num_pl, num_pl); // $ExpectType Promise<any>
playwright.seeInTitle(str_pl); // $ExpectType Promise<any>
playwright.grabPageScrollPosition(); // $ExpectType Promise<PageScrollPosition>
playwright.seeTitleEquals(str_pl); // $ExpectType Promise<any>
playwright.dontSeeInTitle(str_pl); // $ExpectType Promise<any>
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
playwright.seeElement(str_pl); // $ExpectType Promise<any>
playwright.dontSeeElement(str_pl); // $ExpectType Promise<any>
playwright.seeElementInDOM(str_pl); // $ExpectType Promise<any>
playwright.dontSeeElementInDOM(str_pl); // $ExpectType Promise<any>
playwright.handleDownloads(); // $ExpectType Promise<void>
playwright.click(str_pl); // $ExpectType Promise<any>
playwright.click(str_pl, str_pl); // $ExpectType Promise<any>
playwright.click(str_pl, null, { position }); // $ExpectType Promise<any>
playwright.clickLink(); // $ExpectType Promise<any>
playwright.forceClick(str_pl); // $ExpectType Promise<any>
playwright.doubleClick(str_pl); // $ExpectType Promise<any>
playwright.rightClick(str_pl); // $ExpectType Promise<any>
playwright.checkOption(str_pl); // $ExpectType Promise<any>
playwright.uncheckOption(str_pl); // $ExpectType Promise<any>
playwright.seeCheckboxIsChecked(str_pl); // $ExpectType Promise<any>
playwright.dontSeeCheckboxIsChecked(str_pl); // $ExpectType Promise<any>
playwright.pressKeyDown(str_pl); // $ExpectType Promise<any>
playwright.pressKeyUp(str_pl); // $ExpectType Promise<any>
playwright.pressKey(str_pl); // $ExpectType Promise<any>
playwright.type(str_pl); // $ExpectType Promise<any>
playwright.fillField(str_pl, str_pl); // $ExpectType Promise<any>
playwright.clearField(str_pl); // $ExpectType Promise<any>
playwright.appendField(str_pl, str_pl); // $ExpectType Promise<any>
playwright.seeInField(str_pl, str_pl); // $ExpectType Promise<any>
playwright.dontSeeInField(str_pl, str_pl); // $ExpectType Promise<any>
playwright.attachFile(str_pl, str_pl); // $ExpectType Promise<any>
playwright.selectOption(str_pl, str_pl); // $ExpectType Promise<any>
playwright.grabNumberOfVisibleElements(str_pl); // $ExpectType Promise<number>
playwright.seeInCurrentUrl(str_pl); // $ExpectType Promise<any>
playwright.dontSeeInCurrentUrl(str_pl); // $ExpectType Promise<any>
playwright.seeCurrentUrlEquals(str_pl); // $ExpectType Promise<any>
playwright.dontSeeCurrentUrlEquals(str_pl); // $ExpectType Promise<any>
playwright.see(str_pl); // $ExpectType Promise<any>
playwright.seeTextEquals(str_pl); // $ExpectType Promise<any>
playwright.dontSee(str_pl); // $ExpectType Promise<any>
playwright.grabSource(); // $ExpectType Promise<string>
playwright.grabBrowserLogs(); // $ExpectType Promise<any[]>
playwright.grabCurrentUrl(); // $ExpectType Promise<string>
playwright.seeInSource(str_pl); // $ExpectType Promise<any>
playwright.dontSeeInSource(str_pl); // $ExpectType Promise<any>
playwright.seeNumberOfElements(str_pl, num_pl); // $ExpectType Promise<any>
playwright.seeNumberOfVisibleElements(str_pl, num_pl); // $ExpectType Promise<any>
playwright.setCookie({ name: str_pl, value: str_pl}); // $ExpectType Promise<any>
playwright.seeCookie(str_pl); // $ExpectType Promise<any>
playwright.dontSeeCookie(str_pl); // $ExpectType Promise<any>
playwright.grabCookie(); // $ExpectType Promise<string[]> | Promise<string>
playwright.clearCookie(); // $ExpectType Promise<any>
playwright.executeScript(() => {}); // $ExpectType Promise<any>
playwright.grabTextFrom(str_pl); // $ExpectType Promise<string>
playwright.grabTextFromAll(str_pl); // $ExpectType Promise<string[]>
playwright.grabValueFrom(str_pl); // $ExpectType Promise<string>
playwright.grabValueFromAll(str_pl); // $ExpectType Promise<string[]>
playwright.grabHTMLFrom(str_pl); // $ExpectType Promise<string>
playwright.grabHTMLFromAll(str_pl); // $ExpectType Promise<string[]>
playwright.grabCssPropertyFrom(str_pl, str_pl); // $ExpectType Promise<string>
playwright.grabCssPropertyFromAll(str_pl, str_pl); // $ExpectType Promise<string[]>
playwright.seeCssPropertiesOnElements(str_pl, str_pl); // $ExpectType Promise<any>
playwright.seeAttributesOnElements(str_pl, str_pl); // $ExpectType Promise<any>
playwright.dragSlider(str_pl, num_pl); // $ExpectType Promise<any>
playwright.grabAttributeFrom(str_pl, str_pl); // $ExpectType Promise<string>
playwright.grabAttributeFromAll(str_pl, str_pl); // $ExpectType Promise<string[]>
playwright.saveElementScreenshot(str_pl, str_pl); // $ExpectType Promise<any>
playwright.saveScreenshot(str_pl); // $ExpectType Promise<any>
playwright.makeApiRequest(str_pl, str_pl, str_pl); // $ExpectType Promise<object>
playwright.wait(num_pl); // $ExpectType Promise<any>
playwright.waitForEnabled(str_pl); // $ExpectType Promise<any>
playwright.waitForValue(str_pl, str_pl); // $ExpectType Promise<any>
playwright.waitNumberOfVisibleElements(str_pl, num_pl); // $ExpectType Promise<any>
playwright.waitForClickable(str_pl); // $ExpectType Promise<any>
playwright.waitForElement(str_pl); // $ExpectType Promise<any>
playwright.waitForVisible(str_pl); // $ExpectType Promise<any>
playwright.waitForInvisible(str_pl); // $ExpectType Promise<any>
playwright.waitToHide(str_pl); // $ExpectType Promise<any>
playwright.waitInUrl(str_pl); // $ExpectType Promise<any>
playwright.waitUrlEquals(str_pl); // $ExpectType Promise<any>
playwright.waitForText(str_pl); // $ExpectType Promise<any>
playwright.waitForRequest(str_pl); // $ExpectType Promise<any>
playwright.waitForResponse(str_pl); // $ExpectType Promise<any>
playwright.switchTo(); // $ExpectType Promise<any>
playwright.waitForFunction(() => { }); // $ExpectType Promise<any>
playwright.waitForNavigation(str_pl); // $ExpectType Promise<any>
playwright.waitForDetached(str_pl); // $ExpectType Promise<any>
playwright.grabDataFromPerformanceTiming(); // $ExpectType Promise<any>
playwright.grabElementBoundingRect(str_pl); // $ExpectType Promise<number> | Promise<DOMRect>
playwright.mockRoute(str_pl); // $ExpectType Promise<any>
playwright.stopMockingRoute(str_pl); // $ExpectType Promise<any>
