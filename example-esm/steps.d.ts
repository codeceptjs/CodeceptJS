/// <reference types='codeceptjs' />
type CustomHelper = InstanceType<typeof import('./helpers/CustomHelper.js').default>;

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any }
  interface Methods extends CustomHelper, FileSystem, REST {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
