export type ValueOf<T> = T[keyof T]
export type KeyValueTupleToObject<T extends [keyof any, any]> = {
  [K in T[0]]: Extract<T, [K, any]>[1]
}
export type Translate<T, M extends Record<string, string>> = KeyValueTupleToObject<ValueOf<{
  [K in keyof T]: [K extends keyof M ? M[K] : K, T[K]]
}>>
