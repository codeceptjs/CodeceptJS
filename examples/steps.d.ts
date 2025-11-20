/// <reference types='codeceptjs' />
type steps_file = typeof import('./custom_steps.js')['default'];
type Smth = typeof import('./pages/Smth.js')['default'];
type loginPage = typeof import('./pages/Login.js')['default'];
type signinFragment = typeof import('./fragments/Signin.js')['default'];
type User = InstanceType<typeof import('./user_helper.js').default>;

declare namespace CodeceptJS {
  interface SupportObject { I: I, current: any, Smth: Smth, loginPage: loginPage, signinFragment: signinFragment }
  interface Methods extends Playwright, REST, User {}
  interface I extends ReturnType<steps_file>, WithTranslation<Methods> {}
  namespace Translation {
    interface Actions {}
  }
}
