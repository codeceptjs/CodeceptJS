# Translation

Test output and the way tests are written can be localized.
This way scenarios can be written in almost native language using UTF support of JavaScript.
If you have non-English team and you work on non-English project consider enabling translation
by setting translation to [one of available languages](https://github.com/Codeception/CodeceptJS/blob/master/translations).

Please refer to translated steps inside translation files and send Pull Requests to add missing.

To get autocompletion for localized method names generate definitions by running

```
codeceptjs def
```

## Russian

Add to config:

```json
  "translation": "ru-RU"
```

when running with `--steps` option steps output will be translated:

![](http://codecept.io/images/translate-ru1.png)

This also enables localized method names for actor object.

This way tests can be written in native language while it is still JavaScript:

```js
Scenario('пробую написать реферат', (Я) => {
    Я.на_странице('http://yandex.ru/referats');
    Я.вижу("Написать реферат по");
    Я.выбираю_опцию('Психологии');
    Я.кликаю("Написать реферат");
    Я.вижу("Реферат по психологии");
});
```

## Portuguese

To write your tests in portuguese you can enable the portuguese translation in config file like:

```json
  "translation": "pt-BR"
```

Now you can write test like this:

```js
Scenario('Efetuar login', (Eu) => {
    Eu.estouNaPagina('http://minhaAplicacao.com.br');
    Eu.preenchoOCampo("login", "usuario@minhaAplicacao.com.br");
    Eu.preenchoOCampo("senha", "123456");
    Eu.clico("Entrar");
    Eu.vejo("Seja bem vindo usuário!");
});
```

## Italian

Add to config

```json
  "translation": "it-IT"
```

Now you can write test like this:

```js
Scenario('Effettuare il Login su GitHub', (io) => {
    io.sono_sulla_pagina('https://github.com/login');
    io.compilo_il_campo("Username or email address", "giuseppe-santoro");
    io.compilo_il_campo("Password", "*********");
    io.faccio_click_su("Sign in");
    io.vedo("Learn Git and GitHub without any code!");
});
```