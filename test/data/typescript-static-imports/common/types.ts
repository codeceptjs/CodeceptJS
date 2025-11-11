export const BaseUrlPrefixes = {
    apiUrl: "api/v2",
    apiVUrl: "api",
} as const;

export type BaseUrlPrefixesType = typeof BaseUrlPrefixes;

type RegexMatchedString<Pattern extends RegExp> = string & { __regexPattern: Pattern };

const customerRegex = /^U[A-Z0-9]{5}$/;

export type Customer = RegexMatchedString<typeof customerRegex>;
