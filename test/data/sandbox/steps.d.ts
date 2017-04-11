
type ICodeceptCallback = (i: CodeceptJS.I) => void;

declare const actor: () => CodeceptJS.I;
declare const Feature: (string: string) => void;
declare const Scenario: (string: string, callback: ICodeceptCallback) => void;
declare const Before: (callback: ICodeceptCallback) => void;
declare const After: (callback: ICodeceptCallback) => void;
declare const within: (selector: string, callback: Function) => void;

declare namespace CodeceptJS {
  export interface I {
    amInPath: (openPath) => any; 
    writeToFile: (name, text) => any; 
    seeFile: (name) => any; 
    seeInThisFile: (text, encoding) => any; 
    dontSeeInThisFile: (text, encoding) => any; 
    seeFileContentsEqual: (text, encoding) => any; 
    dontSeeFileContentsEqual: (text, encoding) => any; 
    debug: (msg) => any; 
    debugSection: (section, msg) => any; 
    say: (msg) => any; 

  }
}

declare module "codeceptjs" {
    export = CodeceptJS;
}
