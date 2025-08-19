#language: pt

@i18n
Funcionalidade: Teste de Cenário e Esquema do Cenário

  Cenário: Cenário simples
    Dado que inicio meu teste
    Quando faço algo
    Então acontece alguma coisa

  @i18n
  Esquema do Cenário: Cenário com exemplos
    Dado que estou com o usuário "<usuário>"
    Quando faço algo com o usuário
    Então acontece alguma coisa
    Exemplos:
      | usuário |
      | Um      |
      | Dois    |
