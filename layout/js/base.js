
/* Highlight */
$( document ).ready(function() {
  var js = hljs.getLanguage('javascript');
  console.log(js);
  js.k.keyword += ' Scenario Feature Before After yield'; 
  js.k.built_in += ' I'; 
  hljs.registerLanguage('javascript', function() {
    return js;
  });  
  hljs.initHighlightingOnLoad();
  $('table').addClass('table table-striped table-hover');
});


$('body').scrollspy({
    target: '.bs-sidebar',
});


/* Prevent disabled links from causing a page reload */
$("li.disabled a").click(function() {
    event.preventDefault();
});
