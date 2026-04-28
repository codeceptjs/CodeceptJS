---
permalink: /translation
title: Translation
---

# Translation 

*Unique feature of CodeceptJS: write tests in your language!*

🇩🇪🇯🇵🇫🇷🇹🇼🇨🇳🇵🇱🇧🇷🇮🇹

Test output and the way tests are written can be localized. This way scenarios can be written in almost native language using UTF support of JavaScript.

If you have non-English team and you work on non-English project consider enabling translation
by setting translation to [one of available languages](https://github.com/codeceptjs/CodeceptJS/blob/3.x/translations) or writing vocabulary for your language.

## How it works

CodceptJS provides a high-level domain specific language (DSL) for writing end-to-end tests. 
As CodeceptJS API is designed to provide a minimal set of methods to write test cases of any kind of complexity.

It is possible to add aliases for all CodeceptJS keywords and methods. So if all keywords and methods are translated to a specific language it is possible to write tests in that language. Sure, this is not perfect, as CSS/XPath locators as well as REST API speific words are used as is. However, writing tests in your native language may improve the team's understanding of the test behavior.

You can enable translation if your team is not from English-speaking country developing non-English product.

> ⚠️ It's important to note that default translations are far from being complete. So there are still lots of methods and keywords not translated to your language yet. We recommend to [extend a vocabulary](#extending-vocabulary) to add aliases for non-translated methods and submit a pull request with improvements to a [corresponding language file](https://github.com/codeceptjs/CodeceptJS/blob/3.x/translations).

To enable translition create a new project with 

```
npx codeceptjs init
```

And select a language of your choice from a list:

```
? Do you want localization for tests? (See https://codecept.io/translation/)
❯ English (no localization) 
  de-DE 
  it-IT 
  fr-FR 
  ja-JP 
  pl-PL 
  pt-BR 
(Move up and down to reveal more choices)
```
> 💡 If you don't see your language in the list but still want to use localized tests, select 'English (no localization)' and create [custom translation](#custom-translation).


## Languages

### Portuguese 🇧🇷

To write your tests in portuguese you can enable the portuguese translation in config file like:

```js
  translation: "pt-BR"
```

Now you can write test like this:

```js
Cenário('Efetuar login', ({ Eu }) => {
    Eu.estouNaPagina('http://minhaAplicacao.com.br');
    Eu.preenchoOCampo("login", "usuario@minhaAplicacao.com.br");
    Eu.preenchoOCampo("senha", "123456");
    Eu.clico("Entrar");
    Eu.vejo("Seja bem vindo usuário!");
});
```

### French 🇫🇷

To write your tests in French you can enable the French translation by adding to config:

```js
  translation: "fr-FR"
```

Now you can write tests like this:

```js
Scenario('Se connecter sur GitHub', (Je) => {
    Je.suisSurLaPage('https://github.com/login');
    Je.remplisLeChamp("Username or email address", "jean-dupond");
    Je.remplisLeChamp("Password", "*********");
    Je.cliqueSur("Sign in");
    Je.vois("Learn Git and GitHub without any code!");
});
```

### Italian 🇮🇹

Add to `codeceptjs.conf.js` or `codeceptjs.conf.ts` config file:

```js
  translation: "it-IT"
```

Now you can write test like this:

```js
Caratteristica('Effettuare il Login su GitHub', (io) => {
    io.sono_sulla_pagina('https://github.com/login');
    io.compilo_il_campo("Username or email address", "giuseppe-santoro");
    io.compilo_il_campo("Password", "*********");
    io.faccio_click_su("Sign in");
    io.vedo("Learn Git and GitHub without any code!");
});
```

### Polish 🇵🇱

Add to `codeceptjs.conf.js` or `codeceptjs.conf.ts` config file:

```js
  translation: "pl-PL"
```

Now you can write test like this:

```js
Scenario('Zakładanie konta free trial na stronie głównej GetResponse', ({ Ja }) => {
    Ja.jestem_na_stronie('https://getresponse.com');
    Ja.wypełniam_pole("Email address", "sjakubowski@getresponse.com");
    Ja.wypełniam_pole("Password", "digital-marketing-systems");
    Ja.klikam('Sign up');
    Ja.czekam(1);
    Ja.widzę_w_adresie_url('/account_free_created.html');
});
```

### Chinese 🇹🇼🇨🇳

Add to `codeceptjs.conf.js` or `codeceptjs.conf.ts` config: file:

```JS
  translation: "zh-CN"
```
or
```JS
  translation: "zh-TW"
```

This way tests can be written in Chinese language while it is still JavaScript:

```JavaScript
Feature('CodeceptJS 演示');

Scenario('成功提交表单', ({ 我 }) => {
    我.在页面('/documentation')
    我.填写字段('电邮', 'hello@world.com')
    我.填写字段('密码', '123456')
    我.勾选选项('激活')
    我.勾选选项('男');
    我.单击('创建用户')
    我.看到('用户名可用')
    我.在当前网址中看不到('/documentation')
});
```
or

```JavaScript
Feature('CodeceptJS 演示');

Scenario('成功提交表單', ({ 我 }) => {
    我.在頁面('/documentation')
    我.填寫欄位('電郵', 'hello@world.com')
    我.填寫欄位('密碼', '123456')
    我.勾選選項('活化')
    我.勾選選項('男');
    我.單擊('建立用戶')
    我.看到('用戶名可用')
    我.在當前網址中看不到('/documentation')
});
```

### Japanese 🇯🇵

Add to `codeceptjs.conf.js` or `codeceptjs.conf.ts` config file:

```js
  translation: "ja-JP"
```

Now you can write test like this:

```js
Scenario('ログインできる', ({ 私は }) => {
    私は.ページを移動する('/login');
    私は.フィールドに入力する("Eメール", "foo@example.com");
    私は.フィールドに入力する("パスワード", "p@ssword");
    私は.クリックする('ログイン');
    私は.待つ(1);
    私は.URLに含まれるか確認する('/home');
});
```

## Extending Vocabulary

To add localized aliases to more actions create a new JSON or JavaScript file returning an object with following fields:

```js
export default {
  actions: {
    // add action aliases, translating method name to your language
    rightClick: 'Rechtsklick'
  }
}
```

Then enable this vocabulary file in codecept conf:

```js
// inside codecept.conf.js or codecept.conf.ts
// ...
  translation: 'de_DE',
  vocabularies: ['my_translation_file.js'],
```

### Custom Translation

Create translation file like this:

```js
export default {
  I: 'Ya',
  contexts: {
    Feature: 'Feature',
    Scenario: 'Szenario',
    Before: 'Vor',
    After: 'Nach',
    BeforeSuite: 'vor_der_suite',
    AfterSuite: 'nach_der_suite',
  },
  actions: {
    click: 'Klicken',
    wait: 'Wartenn',
  }
```

And add the file path to your config

```js
  translation: "MyLang",
  vocabularies: ["./relative/path/to/your/translation.js"]
```
