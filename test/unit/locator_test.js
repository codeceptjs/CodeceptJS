let expect
import('chai').then((chai) => {
    expect = chai.expect
})
const { DOMParser } = require('@xmldom/xmldom')
const xpath = require('xpath')

const Locator = require('../../lib/locator')

let doc
const xml = `<body>
  <span>Hey boy</span>
  <p>
    <span></span>
    <div></div>
    <div id="user" data-element="name">davert</div>
  </p>
  <div class="form-wrapper" id="buttons-wrapper">
  <fieldset id="fieldset-buttons">
    <table>
      <tr>
        <td>List</td>
        <td>Edit</td>
        <td>Delete</td>
      </tr>
      <tr>
        <td>Show</td>
        <td>Also Edit</td>
        <td>Also Delete</td>
      </tr>
    </table>
    <div id="submit-wrapper" class="form-wrapper">
      <div id="submit-label" class="form-label"> </div>
      <div id="submit-element" class="form-element">
        <button name="submit" id="submit" type="submit" tabindex="3">Sign In</button>
      </div>
    </div>
    <div id="remember-wrapper" class="form-wrapper">
      <div class="form-label" id="remember-label"> </div>
      <div id="remember-element" class="form-element">
        <input type="hidden" name="session" value="1" />
        <input type="hidden" name="remember" value="please_do" />
        <input type="hidden" name="agree" value="no" />
        <input type="checkbox" data-value="yes" id="remember" value="1" tabindex="4" />
        <label for="remember" class="optional">Remember Me</label>
      </div>
    </div>
    <div class="form-field">
      <input name="name0" label="Выберите услугу" type="text" value=""/>
    </div>
    <div class="form-field">
      <input name="name1" label="Выберите услугу" type="text" value=""/>
    </div>
  </fieldset>
  <label class="n-1">Hello<a href="#">Please click</a></label>
  <label class="n1">Hello no hyphen<a href="#">Please click</a></label>
  </div>
  <input type="hidden" name="return_url" value="" id="return_url" />

  <ul class="css-ewdv3l">
    <li class="ps-menuitem-root css-dq4uaz">
        <a
            aria-current="page"
            class="ps-menu-button active"
            data-testid="ps-menu-button-test-id"
            tabindex="0"
            title="aaa"
            href="/"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon home lg outline"></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span></a
        >
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="Dashboard"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i
                    aria-hidden="true"
                    class="icon tachometer alternate"
                ></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="aaa"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon books"></i></span
            ><span class="ps-menu-label css-12w9als">Authoring</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="aaa"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon ballot check"></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="aaa"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon book reader"></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="aaa"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon school"></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="aaa"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon user"></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="aaa"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon cog"></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="aaa"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon tablet alternate"></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
    <li class="ps-menuitem-root ps-submenu-root css-x7nyah">
        <a
            class="ps-menu-button"
            data-testid="ps-menu-button-test-id"
            title="aaa"
            tabindex="0"
            ><span class="ps-menu-icon css-2wa2k3"
                ><i aria-hidden="true" class="icon tools"></i></span
            ><span class="ps-menu-label css-12w9als">aaa</span
            ><span class="ps-submenu-expand-icon css-1cuxlhl"
                ><span class="css-honxw6"></span></span
        ></a>
    </li>
  </ul>

</body>`

describe('Locator', () => {
    beforeEach(() => {
        doc = new DOMParser().parseFromString(xml, 'application/xhtml+xml')
    })

    describe('constructor', () => {
        describe('with string argument', () => {
            it('should create css locator', () => {
                const l = new Locator('#foo')
                expect(l.type).to.equal('css')
                expect(l.value).to.equal('#foo')
                expect(l.toString()).to.equal('#foo')
            })

            it('should create xpath locator', () => {
                const l = new Locator('//foo[@bar="baz"]/*')
                expect(l.type).to.equal('xpath')
                expect(l.value).to.equal('//foo[@bar="baz"]/*')
                expect(l.toString()).to.equal('//foo[@bar="baz"]/*')
            })

            it('should create fuzzy locator', () => {
                const l = new Locator('foo')
                expect(l.type).to.equal('fuzzy')
                expect(l.value).to.equal('foo')
                expect(l.toString()).to.equal('foo')
            })

            it('should create custom locator', () => {
                const l = new Locator({ custom: 'foo' })
                expect(l.type).to.equal('custom')
                expect(l.value).to.equal('foo')
                expect(l.toString()).to.equal('{custom: foo}')
            })

            it('should create shadow locator', () => {
                const l = new Locator({ shadow: ['my-app', 'recipe-hello-binding', 'ui-input', 'input.input'] })
                expect(l.type).to.equal('shadow')
                expect(l.value).to.deep.equal(['my-app', 'recipe-hello-binding', 'ui-input', 'input.input'])
                expect(l.toString()).to.equal('{shadow: my-app,recipe-hello-binding,ui-input,input.input}')
            })

            it('should create described custom default type locator', () => {
                const l = new Locator('foo', 'defaultLocator')
                expect(l.type).to.equal('defaultLocator')
                expect(l.value).to.equal('foo')
                expect(l.toString()).to.equal('foo')
            })

            it('should create playwright locator - _react', () => {
                const l = new Locator({ pw: '_react=button' })
                expect(l.type).to.equal('pw')
                expect(l.value).to.equal('_react=button')
                expect(l.toString()).to.equal('{pw: _react=button}')
            })

            it('should create playwright locator - _vue', () => {
                const l = new Locator({ pw: '_vue=button' })
                expect(l.type).to.equal('pw')
                expect(l.value).to.equal('_vue=button')
                expect(l.toString()).to.equal('{pw: _vue=button}')
            })

            it('should create playwright locator - data-testid', () => {
                const l = new Locator({ pw: '[data-testid="directions"]' })
                expect(l.type).to.equal('pw')
                expect(l.value).to.equal('[data-testid="directions"]')
                expect(l.toString()).to.equal('{pw: [data-testid="directions"]}')
            })
        })

        describe('with object argument', () => {
            it('should create id locator', () => {
                const l = new Locator({ id: 'foo' })
                expect(l.type).to.equal('id')
                expect(l.value).to.equal('foo')
                expect(l.toString()).to.equal('{id: foo}')
            })

            it('should create described custom locator', () => {
                const l = new Locator({ customLocator: '=foo' })
                expect(l.type).to.equal('customLocator')
                expect(l.value).to.equal('=foo')
                expect(l.toString()).to.equal('{customLocator: =foo}')
            })
        })

        describe('with Locator object argument', () => {
            it('should create id locator', () => {
                const l = new Locator(new Locator({ id: 'foo' }))
                expect(l).to.eql(new Locator({ id: 'foo' }))
                expect(l.type).to.equal('id')
                expect(l.value).to.equal('foo')
                expect(l.toString()).to.equal('{id: foo}')
            })
        })
    })

    it('should transform CSS to xpath', () => {
        const l = new Locator('p > #user', 'css')
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1)
        expect(nodes[0].firstChild.data).to.eql('davert')
    })

    it('should build locator to match element by attr', () => {
        const l = Locator.build('input').withAttr({ 'data-value': 'yes' })
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1)
    })

    it('should build locator to match element by class', () => {
        const l = Locator.build('div').withClassAttr('form-')
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(9)
    })

    it('should build locator to match element containing a text', () => {
        const l = Locator.build('span').withText('Hey')
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1)
    })

    it('should build locator to match element by exact text', () => {
        const l = Locator.build('span').withTextEquals('Hey boy')
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1)
    })

    it('should build locator to match element by position', () => {
        const l = Locator.build('#fieldset-buttons').find('//tr').first().find('td').at(2)
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1, l.toXPath())
        expect(nodes[0].firstChild.data).to.eql('Edit')
    })

    it('should build complex locator', () => {
        const l = Locator.build('#fieldset-buttons').find('tr').last().find('td').first()
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1, l.toXPath())
        expect(nodes[0].firstChild.data).to.eql('Show')
    })

    it('should select a by label', () => {
        const l = Locator.build('a').withAttr({ href: '#' }).inside(Locator.build('label').withText('Hello'))

        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(2, l.toXPath())
        expect(nodes[0].firstChild.data).to.eql('Please click', l.toXPath())
    })

    it('should select child element by name', () => {
        const l = Locator.build('.form-field').withDescendant(Locator.build('//input[@name="name1"]'))
        const nodes = xpath.select(l.toXPath(), doc)

        expect(nodes).to.have.length(1, l.toXPath())
    })

    it('should select element by siblings', () => {
        const l = Locator.build('//table').withChild(Locator.build('tr').withChild('td').withText('Also Edit'))
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1, l.toXPath())
    })

    it('should throw an error when xpath with round brackets is nested', () => {
        expect(() => {
            Locator.build('tr').find('(./td)[@id="id"]')
        }).to.throw('round brackets')
    })

    it('should find element with class name contains hyphen', () => {
        const l = Locator.build('').find('.n-1').first()
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1, l.toXPath())
    })

    it('should throw an error when locator with specific position is nested', () => {
        expect(() => {
            Locator.build('tr').withChild(Locator.build('td').first())
        }).to.throw('round brackets')
    })

    it('should not select element by deep nested siblings', () => {
        const l = Locator.build('//table').withChild('td')
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(0, l.toXPath())
    })

    it('should select element by siblings', () => {
        const l = Locator.build('//table').find('td').after(Locator.build('td').withText('Also Edit')).first()

        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1, l.toXPath())
        expect(nodes[0].firstChild.data).to.eql('Also Delete', l.toXPath())
    })

    it('should translate locator to string', () => {
        const l = Locator.build('//table').find('td').as('cell')
        expect(l.toString()).to.eql('cell')
    })

    it('should be able to add custom locator strategy', () => {
        Locator.addFilter((selector, locator) => {
            if (selector.data) {
                locator.type = 'css'
                locator.value = `[data-element=${locator.value}]`
            }
        })
        const l = Locator.build({ data: 'name' })
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1, l.toXPath())
        expect(nodes[0].firstChild.data).to.eql('davert', l.toXPath())
        Locator.filters = []
    })

    it('should be able to add custom locator strategy', () => {
        Locator.addFilter((providedLocator, locator) => {
            if (typeof providedLocator === 'string') {
                // this is a string
                if (providedLocator[0] === '=') {
                    locator.value = `.//*[text()='${providedLocator.substring(1)}']`
                    locator.type = 'xpath'
                }
            }
        })
        const l = Locator.build('=Sign In')
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1, l.toXPath())
        expect(nodes[0].firstChild.data).to.eql('Sign In', l.toXPath())
        Locator.filters = []
    })

    it('should be able to locate complicated locator', () => {
        const l = Locator.build('.ps-menu-button').withText('Authoring').inside('.ps-submenu-root:nth-child(3)')

        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(1, l.toXPath())
        expect(nodes[0].firstChild.nextSibling.firstChild.data).to.eql('Authoring', l.toXPath())
    })

    it('should find element with last of type with text', () => {
        const l = Locator.build('.p-confirm-popup:last-of-type button').withText('delete')
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(0, l.toXPath())
    })

    it('should find element with last of type without text', () => {
        const l = Locator.build('.p-confirm-popup:last-of-type button')
        const nodes = xpath.select(l.toXPath(), doc)
        expect(nodes).to.have.length(0, l.toXPath())
    })
})
