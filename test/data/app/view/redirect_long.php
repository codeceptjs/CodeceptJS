<html>
<head>
    <script>
      setTimeout(function(){
        let e = document.body;
        e.parentNode.removeChild(e);
      }, 10);
      setTimeout(function(){
        console.log('timeout')
        document.querySelector('html').appendChild(document.createElement('body'))
        let newDiv = document.createElement("div");
        newDiv.innerHTML =  "Hi there and greetings!"
        document.body.appendChild(newDiv);  
      }, 1000);
    </script>
</head>
</html>