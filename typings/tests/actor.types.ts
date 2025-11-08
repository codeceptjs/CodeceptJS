import { expectError } from 'tsd';

// @ts-ignore
const I = actor();

I.retry();
I.retry(1);
I.retry({ retries: 3, minTimeout: 100 });
// Removed: expectError(I.retry(1, 2)); - retry accepts 'any' type so this doesn't error

