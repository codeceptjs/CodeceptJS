<!-- Example based oncode from https://www.w3schools.com/howto/howto_js_rangeslider.asp -->

<div id="slidecontainer">
  <input
    type="range"
    min="1"
    max="100"
    value="50"
    class="slider"
    id="mySlider"
  />
</div>
<div><span>Value:</span> <span id="demo"></span></div>

<script>
  var slider = document.getElementById("mySlider");
  var output = document.getElementById("demo");
  output.innerHTML = slider.value;

  slider.oninput = function() {
    output.innerHTML = this.value;
  };
</script>

<style>
  #slidecontainer {
    width: 100%;
  }
  .slider {
    width: 100%;
    height: 25px;
    background: #d3d3d3;
    outline: none;
  }
</style>
