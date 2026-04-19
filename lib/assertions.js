import Assertion from './assert.js'
import { equals, urlEquals, fileEquals } from './assert/equal.js'
import { includes, fileIncludes } from './assert/include.js'
import { empty } from './assert/empty.js'
import { truth } from './assert/truth.js'

export { Assertion, equals, urlEquals, fileEquals, includes, fileIncludes, empty, truth }

export default {
  Assertion,
  equals,
  urlEquals,
  fileEquals,
  includes,
  fileIncludes,
  empty,
  truth,
}
