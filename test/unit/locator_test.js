const assert = require('assert');
const chai = require('chai');
const Locator = require('../../lib/locator');
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;

const expect = chai.expect;

let doc;
const xml = `<body>
  <span>Hey</span>
  <p>
    <span></span>
    <div></div>
    <div id="user">davert</div>
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
  <label>Hello<a href="#">Please click</a></label>
  </div>
  <input type="hidden" name="return_url" value="" id="return_url" />
</body>`;

describe('Locator', () => {
  beforeEach(() => {
    doc = new Dom().parseFromString(xml);
  });

  it('should transform CSS to xpath', () => {
    const l = new Locator('p > #user', 'css');
    const nodes = xpath.select(l.toXPath(), doc);
    expect(nodes).to.have.length(1);
    expect(nodes[0].firstChild.data).to.eql('davert');
  });

  it('should build locator to match element by attr', () => {
    const l = Locator.build('input').withAttr({ 'data-value': 'yes' });
    const nodes = xpath.select(l.toXPath(), doc);
    expect(nodes).to.have.length(1);
  });

  it('should build locator to match element by text', () => {
    const l = Locator.build('span').withText('Hey');
    const nodes = xpath.select(l.toXPath(), doc);
    expect(nodes).to.have.length(1);
  });

  it('should build locator to match element by position', () => {
    const l = Locator.build('#fieldset-buttons')
      .find('//tr')
      .first()
      .find('td')
      .at(2);
    const nodes = xpath.select(l.toXPath(), doc);
    expect(nodes).to.have.length(1, l.toXPath());
    expect(nodes[0].firstChild.data).to.eql('Edit');
  });

  it('should build complex locator', () => {
    const l = Locator.build('#fieldset-buttons')
      .find('tr')
      .last()
      .find('td')
      .first();
    const nodes = xpath.select(l.toXPath(), doc);
    expect(nodes).to.have.length(1);
    expect(nodes[0].firstChild.data).to.eql('Show');
  });

  it('should select a by label', () => {
    const l = Locator.build('a')
      .withAttr({ href: '#' })
      .inside(Locator.build('label').withText('Hello'));

    const nodes = xpath.select(l.toXPath(), doc);
    expect(nodes).to.have.length(1, l.toXPath());
    expect(nodes[0].firstChild.data).to.eql('Please click', l.toXPath());
  });


  it('should select child element by name', () => {
    const l = Locator.build('.form-field')
      .withChild(Locator.build('//input[@name="name1"]'));
    const nodes = xpath.select(l.toXPath(), doc);

    expect(nodes).to.have.length(1, l.toXPath());
  });

  it('should select element by siblings', () => {
    const l = Locator.build('//table')
      .withChild('td')
      .withText('Also Edit')
      .first();
    const nodes = xpath.select(l.toXPath(), doc);
    expect(nodes).to.have.length(1, l.toXPath());
  });

  it('should select element by siblings', () => {
    const l = Locator.build('//table')
      .find('td')
      .after(Locator.build('td').withText('Also Edit'))
      .first();

    const nodes = xpath.select(l.toXPath(), doc);
    expect(nodes).to.have.length(1, l.toXPath());
    expect(nodes[0].firstChild.data).to.eql('Also Delete', l.toXPath());
  });

  it('should translate locator to string', () => {
    const l = Locator.build('//table')
      .find('td')
      .as('cell');
    expect(l.toString()).to.eql('cell');
  });
});
