Feature('within');

Scenario('within on form @WebDriverIO @protractor @nightmare', (I) => {
  I.amOnPage('/form/bug1467');
  I.see('TEST TEST');
  within({css: '[name=form2]'}, () => {
    I.checkOption('Yes');
    I.seeCheckboxIsChecked({css: "input[name=first_test_radio]"});
  });
  I.seeCheckboxIsChecked({css: "form[name=form2] input[name=first_test_radio]"});
  I.dontSeeCheckboxIsChecked({css: "form[name=form1] input[name=first_test_radio]"});
});

Scenario('within on iframe @WebDriverIO @Nightmare', (I) => {
  I.amOnPage('/iframe');
  within({frame: 'iframe'}, () => {
    I.fillField('rus', 'Updated');
    I.click('Sign in!');
    I.see('Email Address');
  });
  I.see('Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on nested iframe @WebDriverIO @nightmare', (I) => {
  I.amOnPage('/iframe');
  within({frame: ['[name=content]']}, () => {
    I.fillField('rus', 'Updated');
    I.click('Sign in!');
    I.see('Email Address');
  });
  I.see('Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on nested iframe with a depth of 2 @WebDriverIO @nightmare', (I) => {
  I.amOnPage('/iframe_nested');
  within({frame: ['[name=wrapper]', '[name=content]']}, () => {
    I.fillField('rus', 'Updated');
    I.click('Sign in!');
    I.see('Email Address');
  });
  I.see('Nested Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on nested iframe with a depth of 2 using ids @WebDriverIO @nightmare', (I) => {
  I.amOnPage('/iframe_nested');
  within({frame: ['#wrapperId', '[name=content]']}, () => {
    I.fillField('rus', 'Updated');
    I.click('Sign in!');
    I.see('Email Address');
  });
  I.see('Nested Iframe test');
  I.dontSee('Email Address');
});

Scenario('within on nested iframe with a depth of 2 using class @WebDriverIO @nightmare', (I) => {
  I.amOnPage('/iframe_nested');
  within({frame: ['.wrapperClass', '[name=content]']}, () => {
    I.fillField('rus', 'Updated');
    I.click('Sign in!');
    I.see('Email Address');
  });
  I.see('Nested Iframe test');
  I.dontSee('Email Address');
});