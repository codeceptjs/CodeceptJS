/// <reference types='codeceptjs' />
type MyHelper = import('./myhelper_helper.js');

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any }
  interface Methods extends FileSystem, MyHelper {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
