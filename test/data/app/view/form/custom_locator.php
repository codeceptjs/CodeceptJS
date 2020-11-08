<html>
<head>
    <style>
        .invisible_button { display: none; }
    </style>
</head>

<body>

<div data-test-id="step_1" class="invisible_button">Step One Button</div>
<div data-test-id="step_2" class="invisible_button">Step Two Button</div>
<div data-test-id="step_3" class="invisible_button">Step Three Button</div>
<div data-test-id="step_4" class="invisible_button">Steps Complete!</div>

<script>
  /**
   * Utility Functions
   */

  function _prepareStepButtons() {
    ['step_1', 'step_2', 'step_3'].forEach( function( id, index ) {
      var num = index + 2,
        nextIDNum = num.toString();

        getByAttribute( id ).addEventListener( 'click', function( event ) {
        var nextID = 'step_' + nextIDNum;
        removeClass( getByAttribute( nextID ), 'invisible_button' );
      });
    });
  }

  function getByAttribute( id ) {
    return document.querySelector( `[data-test-id="${id}"]` );
  }

  function removeClass( el, cls ) {
    el.classList.remove( cls );
    return el;
  }


  /**
   * Do Stuff
   */

  _prepareStepButtons();

  setTimeout(function () {
    removeClass( getByAttribute('step_1'), 'invisible_button' );
  }, 1000);


</script>

</body>
</html>
