/// <reference types='codeceptjs' />
type steps_file = (typeof import('../../support/custom_steps.js'))['default']
type MyPage = (typeof import('../../support/my_page.js'))['default']
type SecondPage = (typeof import('../../support/second_page.js'))['default']
type CurrentPage = (typeof import('./po/custom_steps.js'))['default']

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
