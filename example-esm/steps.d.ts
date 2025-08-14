/// <reference types='codeceptjs' />

declare namespace CodeceptJS {
  interface SupportObject {
    I: I
    current: any
  }

  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
