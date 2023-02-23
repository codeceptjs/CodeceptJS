module.exports = () => {
  console.log('Allure plugin was moved to @codeceptjs/allure-legacy. Please install it and update your config');
  console.log();
  console.log('npm install @codeceptjs/allure-legacy --save-dev');
  console.log();
  console.log('Then update your config to use it:');
  console.log();
  console.log('plugins: {');
  console.log('  allure: {');
  console.log('    enabled: true,');
  console.log('    require: \'@codeceptjs/allure-legacy\',');
  console.log('  }');
  console.log('}');
  console.log();
};
