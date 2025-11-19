/// <reference types='codeceptjs' />
type CustomHelper = InstanceType<typeof import('./custom_helper.js').default>;

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any }
  interface Methods extends FileSystem, CustomHelper {}
  interface I extends WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
