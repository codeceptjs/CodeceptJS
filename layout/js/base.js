
/* Highlight */
$( document ).ready(function() {
  var js = hljs.getLanguage('javascript');
  js.k.keyword += ' Scenario Feature Before After yield'; 
  js.k.built_in += ' I'; 
  hljs.registerLanguage('javascript', function() {
    return js;
  });  
  hljs.initHighlightingOnLoad();
  $('table').addClass('table table-striped table-hover');

$(document).ready(function () {

$.ajax({
    type: 'GET',
    url: 'https://api.github.com/repos/Codeception/CodeceptJS/contributors',
    dataType: 'jsonp',
    success: function(data,status) {

      $.each(data.data, function (key, contributor) {      
        var image = "<img src=\"" + contributor.avatar_url + "\" width=\"48\" height=\"48\">";
        var link = $(document.createElement('a'));
        link.attr('href','https://github.com/'+contributor.login);
        link.attr('target', "_blank");
        link.attr('rel', 'tooltip');
        link.attr('title', contributor.login);
        link.html(image);
        $('#contributors').append(link);
      });
    }  
  });
});


});


$('body').scrollspy({
    target: '.bs-sidebar',
});


/* Prevent disabled links from causing a page reload */
$("li.disabled a").click(function() {
    event.preventDefault();
});
