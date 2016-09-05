
type ICodeceptCallback = (i: CodeceptJS.I) => void;

declare const actor: () => CodeceptJS.I;
declare const Feature: (string: string) => void;
declare const Scenario: (string: string, callback: ICodeceptCallback) => void;
declare const Before: (callback: ICodeceptCallback) => void;
declare const After: (callback: ICodeceptCallback) => void;
declare const within: (selector: string, callback: Function) => void;

declare namespace CodeceptJS {
  export interface I {
    amOnPage: (url) => any; 
    click: (locator, context) => any; 
    doubleClick: (locator, context) => any; 
    rightClick: (locator) => any; 
    fillField: (field, value) => any; 
    appendField: (field, value) => any; 
    selectOption: (select, option) => any; 
    attachFile: (locator, pathToFile) => any; 
    checkOption: (field, context) => any; 
    grabTextFrom: (locator) => any; 
    grabHTMLFrom: (locator) => any; 
    grabValueFrom: (locator) => any; 
    grabAttributeFrom: (locator, attr) => any; 
    seeInTitle: (text) => any; 
    dontSeeInTitle: (text) => any; 
    grabTitle: () => any; 
    see: (text, context) => any; 
    dontSee: (text, context) => any; 
    seeInField: (field, value) => any; 
    dontSeeInField: (field, value) => any; 
    seeCheckboxIsChecked: (field) => any; 
    dontSeeCheckboxIsChecked: (field) => any; 
    seeElement: (locator) => any; 
    dontSeeElement: (locator) => any; 
    seeElementInDOM: (locator) => any; 
    dontSeeElementInDOM: (locator) => any; 
    seeInSource: (text) => any; 
    dontSeeInSource: (text) => any; 
    seeNumberOfElements: (selector, num) => any; 
    seeInCurrentUrl: (url) => any; 
    dontSeeInCurrentUrl: (url) => any; 
    seeCurrentUrlEquals: (url) => any; 
    dontSeeCurrentUrlEquals: (url) => any; 
    executeScript: (fn) => any; 
    executeAsyncScript: (fn) => any; 
    scrollTo: (locator, offsetX, offsetY) => any; 
    moveCursorTo: (locator, offsetX, offsetY) => any; 
    saveScreenshot: (fileName) => any; 
    setCookie: (cookie) => any; 
    clearCookie: (cookie) => any; 
    clearField: (locator) => any; 
    seeCookie: (name) => any; 
    dontSeeCookie: (name) => any; 
    grabCookie: (name) => any; 
    acceptPopup: () => any; 
    cancelPopup: () => any; 
    seeInPopup: (text) => any; 
    pressKey: (key) => any; 
    resizeWindow: (width, height) => any; 
    dragAndDrop: (srcElement, destElement) => any; 
    wait: (sec) => any; 
    waitForEnabled: (locator, sec) => any; 
    waitForElement: (locator, sec) => any; 
    waitForText: (text, sec, context) => any; 
    waitForVisible: (locator, sec) => any; 
    waitToHide: (locator, sec) => any; 
    waitUntil: (fn, sec) => any; 
    switchTo: (locator) => any; 
    construtor: (config) => any; 
    debug: (msg) => any; 
    debugSection: (section, msg) => any; 

  }
}

declare module "codeceptjs" {
    export = CodeceptJS;
}
