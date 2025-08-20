/// <reference types='codeceptjs' />
type steps_file = typeof import('../../support/custom_steps.js')
type MyPage = typeof import('../../support/my_page.js')
type SecondPage = typeof import('../../support/second_page.js')
type CurrentPage = typeof import('./po/custom_steps.js')

declare namespace CodeceptJS {
  interface SupportObject {
    I: I
    current: any
    MyPage: MyPage
    SecondPage: SecondPage
    CurrentPage: CurrentPage
  }
  interface Methods extends FileSystem {}
  interface I extends ReturnType<steps_file>, WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
