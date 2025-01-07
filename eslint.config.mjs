import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: ['test/data/output', 'lib/css2xpath/*'],
  },
  ...compat.extends('airbnb-base'),
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },

      ecmaVersion: 2020,
      sourceType: 'commonjs',
    },

    rules: {
      'func-names': 0,
      'no-use-before-define': 0,
      'no-unused-vars': 0,
      'no-underscore-dangle': 0,
      'no-undef': 0,
      'prefer-destructuring': 0,
      'no-param-reassign': 0,
      'max-len': 0,
      camelcase: 0,
      'no-shadow': 0,
      'consistent-return': 0,
      'no-console': 0,
      'global-require': 0,
      'class-methods-use-this': 0,
      'no-plusplus': 0,
      'no-return-assign': 0,
      'prefer-rest-params': 0,
      'no-useless-escape': 0,
      'no-restricted-syntax': 0,
      'no-unused-expressions': 0,
      'guard-for-in': 0,
      'no-multi-assign': 0,
      'require-yield': 0,
      'prefer-spread': 0,
      'import/no-dynamic-require': 0,
      'no-continue': 0,
      'no-mixed-operators': 0,
      'default-case': 0,
      'import/no-extraneous-dependencies': 0,
      'no-cond-assign': 0,
      'import/no-unresolved': 0,
      'no-await-in-loop': 0,
      'arrow-body-style': 0,
      'no-loop-func': 0,
      'arrow-parens': 0,
      'default-param-last': 0,
      semi: 0,
      'operator-linebreak': 0,
      'nonblock-statement-body-position': 0,
      curly: 0,
      'implicit-arrow-linebreak': 0,
      indent: 0,
      'object-curly-newline': 0,
      'semi-style': 0,
      'function-paren-newline': 0,
      'prefer-template': 0,
      'newline-per-chained-call': 0,
      'prefer-arrow-callback': 0,
      'no-bitwise': 0,
      'prefer-const': 0,
      'no-extra-semi': 0,
      'max-classes-per-file': 0,
      'no-return-await': 0,
    },
  },
]
