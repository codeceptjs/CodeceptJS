declare namespace CodeceptJS {
  interface SupportObject { I: I }
  interface Methods extends WebDriver {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
