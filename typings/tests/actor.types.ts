import { expectError } from 'tsd';

// @ts-ignore
const I = actor();

I.retry();
I.retry(1);
I.retry({ retries: 3, minTimeout: 100 });
expectError(I.retry(1, 2));
