declare namespace CodeceptJS {
  interface SupportObject { I: CodeceptJS.I }
  interface Methods extends CodeceptJS.WebDriver {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
