import { expect } from 'chai'
import { DOMParser } from '@xmldom/xmldom'
import xpath from 'xpath'

import Locator from '../../lib/locator.js'

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
    doc = new DOMParser().parseFromString(xml, 'text/xml')
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

    describe('JSON string parsing', () => {
      it('should parse JSON string to css locator', () => {
        const jsonStr = '{"css": "#button"}'
        const l = new Locator(jsonStr)
        expect(l.type).to.equal('css')
        expect(l.value).to.equal('#button')
      })

      it('should parse JSON string to xpath locator', () => {
        const jsonStr = '{"xpath": "//div[@class=\\"test\\"]"}'
        const l = new Locator(jsonStr)
        expect(l.type).to.equal('xpath')
        expect(l.value).to.equal('//div[@class="test"]')
      })

      it('should parse JSON string to id locator', () => {
        const jsonStr = '{"id": "my-element"}'
        const l = new Locator(jsonStr)
        expect(l.type).to.equal('id')
        expect(l.value).to.equal('my-element')
      })

      it('should parse JSON string to custom locator', () => {
        const jsonStr = '{"byRole": "button"}'
        const l = new Locator(jsonStr)
        expect(l.type).to.equal('byRole')
        expect(l.value).to.equal('button')
      })

      it('should handle whitespace around JSON string', () => {
        const jsonStr = '  { "css": ".test" }  '
        const l = new Locator(jsonStr)
        expect(l.type).to.equal('css')
        expect(l.value).to.equal('.test')
      })

      it('should reject invalid JSON and treat as string', () => {
        const l = new Locator('{ invalid json')
        expect(l.type).to.equal('fuzzy')
        expect(l.value).to.equal('{ invalid json')
      })

      it('should handle aria-style locators with multiple properties', () => {
        const jsonStr = '{"role": "button", "text": "Save"}'
        const l = new Locator(jsonStr)
        expect(l.type).to.equal('role')
        expect(l.value).to.equal('button')
        expect(l.strict).to.equal(true)
      })

      it('should ignore non-object JSON', () => {
        const jsonStr = '"just a string"'
        const l = new Locator(jsonStr)
        expect(l.type).to.equal('fuzzy')
        expect(l.value).to.equal('"just a string"')
      })

      it('should work with array values for certain locators', () => {
        const jsonStr = '{"shadow": ["app", "component", "button"]}'
        const l = new Locator(jsonStr)
        expect(l.type).to.equal('shadow')
        expect(l.value).to.eql(['app', 'component', 'button'])
      })

      it('should mark parsed locators as strict', () => {
        const jsonStr = '{"css": "#test"}'
        const l = new Locator(jsonStr)
        expect(l.strict).to.equal(true)
      })

      it('should demonstrate equivalence between object and JSON string locators', () => {
        const objectLocator = new Locator({ css: '#main-button' })
        const jsonLocator = new Locator('{"css": "#main-button"}')

        expect(objectLocator.type).to.equal(jsonLocator.type)
        expect(objectLocator.value).to.equal(jsonLocator.value)
        expect(objectLocator.strict).to.equal(jsonLocator.strict)
      })

      it('should work with complex xpath in JSON', () => {
        const jsonStr = '{"xpath": "//div[contains(@class, \\"container\\")]//button"}'
        const l = new Locator(jsonStr)

        expect(l.type).to.equal('xpath')
        expect(l.value).to.equal('//div[contains(@class, "container")]//button')
        expect(l.simplify()).to.equal('//div[contains(@class, "container")]//button')
      })
    })
  })

  it('should transform CSS to xpath', () => {
    const l = new Locator('p > #user', 'css')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(1)
    expect(nodes[0].firstChild.data).to.eql('davert')
  })

  it('should transform CSS having has pseudo to xpath', () => {
    const l = new Locator('#submit-element:has(button)', 'css')
    const convertedXpath = l.toXPath()
    const nodes = xpath.select(l.toXPath(), doc)
    expect(convertedXpath).to.equal(".//*[(./@id = 'submit-element' and .//button)]")
    expect(nodes).to.have.length(1)
    expect(nodes[0].firstChild.data.trim()).to.eql('')
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

  it('withClass: single class (word-exact)', () => {
    const l = Locator.build('a').withClass('ps-menu-button')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(10, l.toXPath())
  })

  it('withClass: variadic ANDs class conditions', () => {
    const l = Locator.build('a').withClass('ps-menu-button', 'active')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(1, l.toXPath())
  })

  it('withClass: word-exact (does not match partial class)', () => {
    const l = Locator.build('div').withClass('form-')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(0, l.toXPath())
  })

  it('withoutClass: excludes elements carrying the class', () => {
    const l = Locator.build('a').withClass('ps-menu-button').withoutClass('active')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(9, l.toXPath())
  })

  it('withoutText: excludes elements containing text', () => {
    const l = Locator.build('span').withoutText('Hey')
    const nodes = xpath.select(l.toXPath(), doc)
    const matchesHey = nodes.find(n => n.firstChild && n.firstChild.data === 'Hey boy')
    expect(matchesHey).to.be.undefined
  })

  it('withoutAttr: excludes matching attribute value', () => {
    const l = Locator.build('input').withoutAttr({ type: 'hidden' })
    const nodes = xpath.select(l.toXPath(), doc)
    nodes.forEach(n => expect(n.getAttribute('type')).to.not.equal('hidden'))
  })

  it('withoutDescendant: excludes elements with a descendant match', () => {
    const l = Locator.build('a').withClass('ps-menu-button').withoutDescendant('.ps-submenu-expand-icon')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(1, l.toXPath())
  })

  it('withoutChild: excludes elements with a direct child match', () => {
    const l = Locator.build('p').withoutChild('span')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(0, l.toXPath())
  })

  it('and: appends raw xpath predicate', () => {
    const l = Locator.build('input').and('@type="checkbox"')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(1, l.toXPath())
  })

  it('andNot: wraps raw xpath predicate in not()', () => {
    const l = Locator.build('a').withClass('ps-menu-button').andNot('.//span[contains(@class, "ps-submenu-expand-icon")]')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(1, l.toXPath())
  })

  describe('combined filters', () => {
    it('withClass + withoutClass: active vs inactive menu buttons', () => {
      const l = Locator.build('a').withClass('ps-menu-button').withoutClass('active')
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(9, l.toXPath())
    })

    it('withClass + withAttr + withDescendant: dashboard menu with expand icon', () => {
      const l = Locator.build('a')
        .withClass('ps-menu-button')
        .withAttr({ title: 'Dashboard' })
        .withDescendant('.ps-submenu-expand-icon')
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(1, l.toXPath())
    })

    it('withClass + withoutDescendant: single active menu without expand icon (user red-btn pattern)', () => {
      const l = Locator.build('a').withClass('ps-menu-button', 'active').withoutDescendant('.ps-submenu-expand-icon')
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(1, l.toXPath())
    })

    it('withText + withoutText: td with Edit but not Also Edit', () => {
      const l = Locator.build('td').withText('Edit').withoutText('Also')
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(1, l.toXPath())
      expect(nodes[0].firstChild.data).to.eql('Edit')
    })

    it('withClass + withDescendant(locate(...).withTextEquals(...)): Authoring menu item', () => {
      const l = Locator.build('a')
        .withClass('ps-menu-button')
        .withDescendant(Locator.build('span').withTextEquals('Authoring'))
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(1, l.toXPath())
    })

    it('withClass + withDescendant(nested withClass) + withoutDescendant', () => {
      // active home menu, reached via its icon
      const l = Locator.build('a')
        .withClass('ps-menu-button', 'active')
        .withDescendant(Locator.build('i').withClass('icon', 'home'))
        .withoutDescendant('.ps-submenu-expand-icon')
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(1, l.toXPath())
    })

    it('or: union of two distinct filtered locators', () => {
      const active = Locator.build('a').withClass('ps-menu-button', 'active')
      const dashboard = Locator.build('a').withAttr({ title: 'Dashboard' })
      const l = active.or(dashboard)
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(2, l.toXPath())
    })

    it('and: raw predicate combined with DSL filters', () => {
      const l = Locator.build('a').withClass('ps-menu-button').and('@title="Dashboard"')
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(1, l.toXPath())
    })

    it('andNot + withClass: class present but no matching descendant', () => {
      const l = Locator.build('li').withClass('ps-submenu-root').andNot('.//span[text()="Authoring"]')
      const nodes = xpath.select(l.toXPath(), doc)
      // 9 submenu-root items total, 1 contains "Authoring" → 8 remain
      expect(nodes).to.have.length(8, l.toXPath())
    })

    it('deep chain: find + withClass + first + find + withText', () => {
      const l = Locator.build('#fieldset-buttons').find('tr').first().find('td').withText('Edit').withoutText('Also')
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(1, l.toXPath())
      expect(nodes[0].firstChild.data).to.eql('Edit')
    })

    it('withClass + withoutChild: submenu-root li with no child named `i`', () => {
      const l = Locator.build('li').withClass('ps-submenu-root').withoutChild('i')
      const nodes = xpath.select(l.toXPath(), doc)
      // every submenu li has no direct `i` child (i is wrapped in a span) — all 9 match
      expect(nodes).to.have.length(9, l.toXPath())
    })

    it('user button example: multi-class + text + not-descendant (applied to menu fixture)', () => {
      // mirrors:
      //   locate('button').withClass('red-btn', 'btn-lg').withText('Save').withoutDescendant('svg')
      const l = Locator.build('a')
        .withClass('ps-menu-button', 'active')
        .withText('aaa')
        .withoutDescendant('.ps-submenu-expand-icon')
      const nodes = xpath.select(l.toXPath(), doc)
      expect(nodes).to.have.length(1, l.toXPath())
    })
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

  it('should find element with attribute value starts with text', () => {
    const l = Locator.build('a').withAttrStartsWith('class', 'ps-menu-button')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(10, l.toXPath())
  })

  it('should find element with attribute value ends with text', () => {
    const l = Locator.build('a').withAttrEndsWith('class', 'ps-menu-button')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(9, l.toXPath())
  })

  it('should find element with attribute value contains text', () => {
    const l = Locator.build('a').withAttrEndsWith('class', 'active')
    const nodes = xpath.select(l.toXPath(), doc)
    expect(nodes).to.have.length(1, l.toXPath())
  })

  describe('Locator.clickable.self', () => {
    it('picks deepest descendant, not a container whose string-value merely concatenates the literal (tablist regression)', () => {
      const tabsXml = `<root>
        <ul role="tablist" id="tabs">
          <li role="tab" data-tab="description"><span class="tab-text">Description</span></li>
          <li role="tab" data-tab="code"><span class="tab-text">Code template</span></li>
          <li role="tab" data-tab="attachments"><span class="tab-text">Attachments</span></li>
          <li role="tab" data-tab="runs"><span class="tab-text">Runs</span></li>
          <li role="tab" data-tab="history"><span class="tab-text">History</span></li>
        </ul>
      </root>`
      const tabsDoc = new DOMParser().parseFromString(tabsXml, 'text/xml')
      const ul = xpath.select1('//ul', tabsDoc)
      const xp = Locator.clickable.self("'Description'")
      const nodes = xpath.select(xp, ul)

      expect(nodes).to.have.length(1, xp)
      expect(nodes[0].tagName).to.eql('span')
      expect(nodes[0].textContent.trim()).to.eql('Description')
    })

    it('matches self when context element has the literal in direct text and no descendants contain it', () => {
      const leafXml = '<root><div id="btn">Submit</div></root>'
      const leafDoc = new DOMParser().parseFromString(leafXml, 'text/xml')
      const div = xpath.select1('//div', leafDoc)
      const xp = Locator.clickable.self("'Submit'")
      const nodes = xpath.select(xp, div)

      expect(nodes).to.have.length(1, xp)
      expect(nodes[0].getAttribute('id')).to.eql('btn')
    })

    it('matches self when @value attribute contains the literal', () => {
      const inputXml = '<root><input type="submit" value="Submit" id="inp"/></root>'
      const inputDoc = new DOMParser().parseFromString(inputXml, 'text/xml')
      const input = xpath.select1('//input', inputDoc)
      const xp = Locator.clickable.self("'Submit'")
      const nodes = xpath.select(xp, input)

      expect(nodes).to.have.length(1, xp)
      expect(nodes[0].getAttribute('id')).to.eql('inp')
    })
  })

  describe('Locator.clickable.wide', () => {
    it('matches an ARIA widget role (tab) by text within a container', () => {
      const tabsXml = `<root>
        <ul role="tablist" id="tabs">
          <li role="tab" data-tab="description"><span class="tab-text">Description</span></li>
          <li role="tab" data-tab="code"><span class="tab-text">Code template</span></li>
          <li role="tab" data-tab="attachments"><span class="tab-text">Attachments</span></li>
          <li role="tab" data-tab="runs"><span class="tab-text">Runs</span></li>
          <li role="tab" data-tab="history"><span class="tab-text">History</span></li>
        </ul>
      </root>`
      const tabsDoc = new DOMParser().parseFromString(tabsXml, 'text/xml')
      const ul = xpath.select1('//ul', tabsDoc)
      const xp = Locator.clickable.wide("'Description'")
      const nodes = xpath.select(xp, ul)

      const tabMatches = nodes.filter(n => n.getAttribute && n.getAttribute('role') === 'tab')
      expect(tabMatches).to.have.length(1, xp)
      expect(tabMatches[0].getAttribute('data-tab')).to.eql('description')
    })

    it('matches role="menuitem" by text', () => {
      const menuXml = `<root>
        <ul role="menu">
          <li role="menuitem" id="save">Save</li>
          <li role="menuitem" id="rename">Rename</li>
        </ul>
      </root>`
      const menuDoc = new DOMParser().parseFromString(menuXml, 'text/xml')
      const menu = xpath.select1('//ul', menuDoc)
      const nodes = xpath.select(Locator.clickable.wide("'Rename'"), menu)
      const items = nodes.filter(n => n.getAttribute && n.getAttribute('role') === 'menuitem')
      expect(items).to.have.length(1)
      expect(items[0].getAttribute('id')).to.eql('rename')
    })
  })
})
