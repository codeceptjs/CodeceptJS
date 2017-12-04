module.exports = function (done) {
  let i = 0;
  setTimeout(() => {
    i += 1;
    console.log(`Go: ${i}`);
    done();
  }, 0);
  console.log(`Ready: ${i}`);
};
