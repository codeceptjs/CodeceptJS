'use strict';
let REST = require('../../lib/helper/REST');
let should = require('chai').should();
let api_url = 'http://127.0.0.1:8010';
let assert = require('assert');
let path = require('path');
let fs = require('fs');
let fileExists = require('../../lib/utils').fileExists;
let AssertionFailedError = require('../../lib/assert/error');
let expectError = require('../../lib/utils').test.expectError;
let I;
require('co-mocha')(require('mocha'));

describe('REST', function () {

  before(function() {
    global.codecept_dir = path.join(__dirname, '/../data');
    I = new REST({
      endpoint: api_url + '/rest'
    });
  });

  describe('basic requests', function() {
    it('should send GET requests', () => {
      return I.sendGetRequest('/user').then((response) => {
        JSON.parse(response.body).name.should.eql('davert');
      });
    });

    it('should send POST requests', () => {
      return I.sendPostRequest('/user', { name: 'john' }).then((response) => {
        JSON.parse(response.body).name.should.eql('john');
      });
    });



  });

});