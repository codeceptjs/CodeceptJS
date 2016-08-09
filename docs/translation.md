# Translation

Test output and the way tests are written can be localized.

CodeceptJS provides built in translations to:

* `ru-RU`
* `pt-BR`

They can be enabled in config file like:

```json
  "translation": "ru-RU"
```

By enabling this feature and running with `--steps` option steps will be translated:

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

For write your steps in portuguese you can enable the portuguese translation in config file like:

```json
  "translation": "pt-BR"
```

Your test will be like this:

```js
Scenario('Efetuar login', (Eu) => {
    Eu.estouNaPagina('http://minhaAplicacao.com.br');
    Eu.preenchoOCampo("login", "usuario@minhaAplicacao.com.br");
    Eu.preenchoOCampo("senha", "123456");
    Eu.clico("Entrar");
    Eu.vejo("Seja bem vindo usuário!");
});
```


To get autocompletion for localized method names generate definitions by running

```
codeceptjs def
```
