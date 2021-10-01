const I = actor();

I.retry();
I.retry(1);
I.retry({ retries: 3, minTimeout: 100 });
I.retry(1, 2); // $ExpectError
