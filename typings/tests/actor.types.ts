// @ts-ignore
const I = actor();

// I.retry() and I.limitTime() were removed in 4.x.
// Use step.retry() / step.timeout() as the last step argument instead.
// `I` resolves to `any` in this typing test, so the removal cannot be
// asserted at the type level here.
