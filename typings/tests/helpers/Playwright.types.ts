const playwright = new CodeceptJS.Playwright();

const str_pl = 'text';
const num_pl = 1;
const position = { x: 100, y: 200 };
const sourcePosition = { x: 10, y: 20 };
const targetPosition = { x: 20, y: 30 };

playwright.usePlaywrightTo(str_pl, () => {}); // $ExpectType void
playwright.amAcceptingPopups(); // $ExpectType void
playwright.acceptPopup(); // $ExpectType void
playwright.amCancellingPopups(); // $ExpectType void
playwright.cancelPopup(); // $ExpectType void
playwright.seeInPopup(str_pl); // $ExpectType void
playwright._setPage(str_pl); // $ExpectType void
playwright._addPopupListener(); // $ExpectType void
playwright._getPageUrl(); // $ExpectType void
playwright.grabPopupText(); // $ExpectType Promise<string | null>
playwright.amOnPage(str_pl); // $ExpectType void
playwright.resizeWindow(num_pl, num_pl); // $ExpectType void
playwright.haveRequestHeaders(str_pl); // $ExpectType void
playwright.moveCursorTo(str_pl, num_pl, num_pl); // $ExpectType void
playwright.dragAndDrop(str_pl); // $ExpectError
playwright.dragAndDrop(str_pl, str_pl); // $ExpectType void
playwright.dragAndDrop(str_pl, str_pl, { sourcePosition, targetPosition }); // $ExpectType void
playwright.refreshPage(); // $ExpectType void
playwright.scrollPageToTop(); // $ExpectType void
playwright.scrollPageToBottom(); // $ExpectType void
playwright.scrollTo(str_pl, num_pl, num_pl); // $ExpectType void
playwright.seeInTitle(str_pl); // $ExpectType void
playwright.grabPageScrollPosition(); // $ExpectType Promise<PageScrollPosition>
playwright.seeTitleEquals(str_pl); // $ExpectType void
playwright.dontSeeInTitle(str_pl); // $ExpectType void
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
playwright.seeElement(str_pl); // $ExpectType void
playwright.dontSeeElement(str_pl); // $ExpectType void
playwright.seeElementInDOM(str_pl); // $ExpectType void
playwright.dontSeeElementInDOM(str_pl); // $ExpectType void
playwright.handleDownloads(); // $ExpectType Promise<void>
playwright.click(str_pl); // $ExpectType void
playwright.click(str_pl, str_pl); // $ExpectType void
playwright.click(str_pl, null, { position }); // $ExpectType void
playwright.clickLink(); // $ExpectType void
playwright.forceClick(str_pl); // $ExpectType void
playwright.doubleClick(str_pl); // $ExpectType void
playwright.rightClick(str_pl); // $ExpectType void
playwright.checkOption(str_pl); // $ExpectType void
playwright.uncheckOption(str_pl); // $ExpectType void
playwright.seeCheckboxIsChecked(str_pl); // $ExpectType void
playwright.dontSeeCheckboxIsChecked(str_pl); // $ExpectType void
playwright.pressKeyDown(str_pl); // $ExpectType void
playwright.pressKeyUp(str_pl); // $ExpectType void
playwright.pressKey(str_pl); // $ExpectType void
playwright.type(str_pl); // $ExpectType void
playwright.fillField(str_pl, str_pl); // $ExpectType void
playwright.clearField(str_pl); // $ExpectType void
playwright.appendField(str_pl, str_pl); // $ExpectType void
playwright.seeInField(str_pl, str_pl); // $ExpectType void
playwright.dontSeeInField(str_pl, str_pl); // $ExpectType void
playwright.attachFile(str_pl, str_pl); // $ExpectType void
playwright.selectOption(str_pl, str_pl); // $ExpectType void
playwright.grabNumberOfVisibleElements(str_pl); // $ExpectType Promise<number>
playwright.seeInCurrentUrl(str_pl); // $ExpectType void
playwright.dontSeeInCurrentUrl(str_pl); // $ExpectType void
playwright.seeCurrentUrlEquals(str_pl); // $ExpectType void
playwright.dontSeeCurrentUrlEquals(str_pl); // $ExpectType void
playwright.see(str_pl); // $ExpectType void
playwright.seeTextEquals(str_pl); // $ExpectType void
playwright.dontSee(str_pl); // $ExpectType void
playwright.grabSource(); // $ExpectType Promise<string>
playwright.grabBrowserLogs(); // $ExpectType Promise<any[]>
playwright.grabCurrentUrl(); // $ExpectType Promise<string>
playwright.seeInSource(str_pl); // $ExpectType void
playwright.dontSeeInSource(str_pl); // $ExpectType void
playwright.seeNumberOfElements(str_pl, num_pl); // $ExpectType void
playwright.seeNumberOfVisibleElements(str_pl, num_pl); // $ExpectType void
playwright.setCookie({ name: str_pl, value: str_pl}); // $ExpectType void
playwright.seeCookie(str_pl); // $ExpectType void
playwright.dontSeeCookie(str_pl); // $ExpectType void
playwright.grabCookie(); // $ExpectType Promise<string[]> | Promise<string>
playwright.clearCookie(); // $ExpectType void
playwright.executeScript(() => {}); // $ExpectType void
playwright.grabTextFrom(str_pl); // $ExpectType Promise<string>
playwright.grabTextFromAll(str_pl); // $ExpectType Promise<string[]>
playwright.grabValueFrom(str_pl); // $ExpectType Promise<string>
playwright.grabValueFromAll(str_pl); // $ExpectType Promise<string[]>
playwright.grabHTMLFrom(str_pl); // $ExpectType Promise<string>
playwright.grabHTMLFromAll(str_pl); // $ExpectType Promise<string[]>
playwright.grabCssPropertyFrom(str_pl, str_pl); // $ExpectType Promise<string>
playwright.grabCssPropertyFromAll(str_pl, str_pl); // $ExpectType Promise<string[]>
playwright.seeCssPropertiesOnElements(str_pl, str_pl); // $ExpectType void
playwright.seeAttributesOnElements(str_pl, str_pl); // $ExpectType void
playwright.dragSlider(str_pl, num_pl); // $ExpectType void
playwright.grabAttributeFrom(str_pl, str_pl); // $ExpectType Promise<string>
playwright.grabAttributeFromAll(str_pl, str_pl); // $ExpectType Promise<string[]>
playwright.saveElementScreenshot(str_pl, str_pl); // $ExpectType void
playwright.saveScreenshot(str_pl); // $ExpectType void
playwright.makeApiRequest(str_pl, str_pl, str_pl); // $ExpectType Promise<object>
playwright.wait(num_pl); // $ExpectType void
playwright.waitForEnabled(str_pl); // $ExpectType void
playwright.waitForValue(str_pl, str_pl); // $ExpectType void
playwright.waitNumberOfVisibleElements(str_pl, num_pl); // $ExpectType void
playwright.waitForClickable(str_pl); // $ExpectType void
playwright.waitForElement(str_pl); // $ExpectType void
playwright.waitForVisible(str_pl); // $ExpectType void
playwright.waitForInvisible(str_pl); // $ExpectType void
playwright.waitToHide(str_pl); // $ExpectType void
playwright.waitInUrl(str_pl); // $ExpectType void
playwright.waitUrlEquals(str_pl); // $ExpectType void
playwright.waitForText(str_pl); // $ExpectType void
playwright.waitForRequest(str_pl); // $ExpectType void
playwright.waitForResponse(str_pl); // $ExpectType void
playwright.switchTo(); // $ExpectType void
playwright.waitForFunction(() => { }); // $ExpectType void
playwright.waitForNavigation(str_pl); // $ExpectType void
playwright.waitForDetached(str_pl); // $ExpectType void
playwright.grabDataFromPerformanceTiming(); // $ExpectType Promise<any>
playwright.grabElementBoundingRect(str_pl); // $ExpectType Promise<number> | Promise<DOMRect>
playwright.mockRoute(str_pl); // $ExpectType void
playwright.stopMockingRoute(str_pl); // $ExpectType void
