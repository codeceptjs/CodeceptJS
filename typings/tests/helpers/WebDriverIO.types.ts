const wd = new CodeceptJS.WebDriver()

wd.grabAllWindowHandles() // $ExpectType string[]
wd.grabCurrentWindowHandle() // $ExpectType string
