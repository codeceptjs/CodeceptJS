<!doctype html>
<html>
  <head>
    <title>Labelled containers around fields</title>
  </head>
  <body>
    <h1>Labelled containers</h1>

    <form action="/form/complex" method="POST">
      <label id="volume-label">Volume</label>
      <div role="group" aria-labelledby="volume-label" class="slider-root">
        <input type="range" name="vol" min="0" max="100" value="30" aria-labelledby="volume-label" />
      </div>

      <label id="nickname-label">Nickname</label>
      <div role="textbox" contenteditable="true" aria-labelledby="nickname-label" id="nickname">Bob</div>

      <input type="submit" value="Submit" />
    </form>

    <ul role="tablist" aria-label="Settings tabs">
      <li role="tab" aria-selected="true">Profile</li>
      <li role="tab" aria-selected="false">Password</li>
    </ul>
  </body>
</html>
