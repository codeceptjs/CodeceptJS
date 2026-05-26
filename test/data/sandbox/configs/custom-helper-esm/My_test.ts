Feature("My");

const {I} = inject();

Scenario("test something", () => {
    I.openPage("http://codecept.io");
});
