
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
    see: (text, context) => any; 
    dontSee: (text, context) => any; 
    selectOption: (select, option) => any; 
    fillField: (field, value) => any; 
    pressKey: (key) => any; 
    attachFile: (locator, pathToFile) => any; 
    seeInField: (field, value) => any; 
    dontSeeInField: (field, value) => any; 
    appendField: (field, value) => any; 
    checkOption: (field, context) => any; 
    seeCheckboxIsChecked: (field) => any; 
    dontSeeCheckboxIsChecked: (field) => any; 
    grabTextFrom: (locator) => any; 
    grabValueFrom: (locator) => any; 
    grabAttributeFrom: (locator, attr) => any; 
    seeInTitle: (text) => any; 
    dontSeeInTitle: (text) => any; 
    grabTitle: () => any; 
    seeElement: (locator) => any; 
    dontSeeElement: (locator) => any; 
    seeElementInDOM: (locator) => any; 
    dontSeeElementInDOM: (locator) => any; 
    seeInSource: (text) => any; 
    dontSeeInSource: (text) => any; 
    executeScript: (fn) => any; 
    executeAsyncScript: (fn) => any; 
    seeInCurrentUrl: (url) => any; 
    dontSeeInCurrentUrl: (url) => any; 
    seeCurrentUrlEquals: (url) => any; 
    dontSeeCurrentUrlEquals: (url) => any; 
    saveScreenshot: (fileName) => any; 
    setCookie: (cookie) => any; 
    clearCookie: (cookie) => any; 
    seeCookie: (name) => any; 
    dontSeeCookie: (name) => any; 
    grabCookie: (name) => any; 
    resizeWindow: (width, height) => any; 
    wait: (sec) => any; 
    waitForElement: (locator, sec) => any; 
    waitForVisible: (locator, sec) => any; 
    waitForText: (text, sec, context) => any; 
    construtor: (config) => any; 
    debug: (msg) => any; 
    debugSection: (section, msg) => any; 

  }
}

declare module "codeceptjs" {
    export = CodeceptJS;
}
