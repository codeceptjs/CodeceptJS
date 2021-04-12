import * as Protractor from "protractor";

declare global {
  namespace NodeJS {
    interface Global {
      // Used by Protractor helper
      by: Protractor.ProtractorBy;
      By: Protractor.ProtractorBy;
      ExpectedConditions: Protractor.ProtractorExpectedConditions;
      element: typeof Protractor.element;
      $: typeof Protractor.$;
      $$: typeof Protractor.$$;
      browser: Protractor.ProtractorBrowser;
    }
  }
}
