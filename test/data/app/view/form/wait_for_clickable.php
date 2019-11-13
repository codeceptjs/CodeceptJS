<html>
<body>
<style>
#notInViewportTop {
  margin-top: -9999999px
}
#notInViewportBottom {
  margin-bottom: -9999999px
}
#notInViewportLeft {
  margin-left: -9999999px
}
#notInViewportRight {
  margin-right: -9999999px
}
</style>
<input id="text" type="text" name="test" value="some text">

<button id="button" type="button" name="button1" disabled value="first">A Button</button>

<div id="notInViewportTop">Div not in viewport by top</div>
<div id="notInViewportBottom">Div not in viewport by bottom</div>
<div id="notInViewportLeft">Div not in viewport by left</div>
<div id="notInViewportRight">Div not in viewport by right</div>

<div id="div1" style="position:absolute; top:100; left:0;">
  <button id="div1_button" type="button" name="button1" value="first">First Button</button>
</div>
<div id="div2" style="position:absolute; top:100; left:0;">
  <button id="div2_button" type="button" name="button1" value="first">Second Button</button>
</div>

</body>
</html>
