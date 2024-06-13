const { I } = inject()

Feature('Plugins')

Before(() => {
    I.amOnPage('https://todomvc.com/examples/react/dist/')

    I.say('Given I already have some todos')

    I.executeScript(
        ({ todoItems }) => {
            localStorage.setItem('todos-angularjs', JSON.stringify(todoItems))
        },
        [
            {
                title: 'Create a cypress like runner for CodeceptJS',
                completed: false,
            },
            {
                title: 'Make it even better than cypress',
                completed: false,
            },
        ],
    )

    I.refreshPage()

    I.executeScript(() => console.log('Some info'))
    I.executeScript(() => console.error('Some error'))
})

Scenario('Create some todo items @coverage', () => {
    I.say('When I focus the todo field')
    I.click('.new-todo')

    I.say('Then I can add additional todos')
    I.fillField(
        {
            css: '.new-todo',
        },
        'Optimize Puppeteer support',
    )
    I.pressKey('Enter')

    I.fillField(
        {
            css: '.new-todo',
        },
        'Add a web REPL',
    )
    I.pressKey('Enter')

    I.fillField(locate('.new-todo').as('TODO Input'), 'Support Appium')
    I.pressKey('Enter')

    I.fillField(
        {
            css: '.new-todo',
        },
        'Become REALLY productive writing E2E Tests with codepress and CodeceptJS',
    )
    I.pressKey('Enter')

    I.say('And I see them in the list')
    I.seeNumberOfVisibleElements('.todo-list li', 4)
    I.see('Optimize Puppeteer support', {
        css: 'li:nth-child(1) label',
    })
    I.dontSee('Nightmare', '.main')

    I.say('I complete a todo')
    I.click({
        css: 'li:nth-child(1) .toggle',
    })
    I.seeElement('li:nth-child(1).completed')

    I.say('I mark all as completed')
    I.saveScreenshot('create-multiple-todo-items.png')
})
