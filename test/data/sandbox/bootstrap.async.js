module.exports = function (done) {
  let i = 0;
  setTimeout(() => {
    i++;
    console.log(`Go: ${i}`);
    done();
  }, 0);
  console.log(`Ready: ${i}`);
};
