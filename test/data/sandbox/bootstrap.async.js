module.exports = function(done) {
  var i = 0;
  setTimeout(function() {
    i++;
    console.log(`Go: ${i}`);
    done();
  }, 0);
  console.log(`Ready: ${i}`);
}