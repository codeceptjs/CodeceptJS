<html>
<body>

<div id="ready">loaded</div>
<a href="/">Home</a>

<script>
  // Simulates a real-world page that keeps its V8 isolate synchronously busy for a while right
  // after `load` (hydration, analytics, etc.). Confirmed directly via a raw CDP probe that any
  // `Runtime.evaluate` issued while such a block is running queues behind it until the isolate
  // frees up — a chain of short, `setTimeout`-yielding chunks does not reproduce this, since the
  // event loop gets a gap between chunks to service queued CDP commands; one continuous
  // synchronous block does. This is a regression guard, not a demonstration that the fix is a net
  // win here specifically: unlike a real remote page's post-load JS (which has natural gaps),
  // scheduling this block to start exactly at `load` measurably delays even the push-based
  // `Page.lifecycleEvent` notification on Obscura, so amOnPage pays the full 1.5s either way —
  // the regression this guards against is any additional latency piling on *top* of that, e.g. the
  // double-timeout or accumulating-registration bugs found and fixed during this work.
  window.addEventListener('load', function () {
    setTimeout(function () {
      var end = Date.now() + 1500;
      while (Date.now() < end) { /* spin */ }
    }, 0);
  });
</script>
</body>
</html>
