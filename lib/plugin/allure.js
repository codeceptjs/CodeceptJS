module.exports = () => {
  console.log('Allure plugin was moved to @codeceptjs/allure-plugin. Please install it and update your config');
  console.log();
  console.log('npm install @codeceptjs/allure-plugin --save-dev');
  console.log();
  console.log('Then update your config to use it:');
  console.log();
  console.log('plugins: {');
  console.log('  allure: {');
  console.log('    enabled: true,');
  console.log('    require: \'@codeceptjs/allure-plugin\',');
  console.log('  }');
  console.log('}');
  console.log();
};
