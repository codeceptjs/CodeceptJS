(function() {
    var self = this;
    var parser, xpathBuilder, Expression, parse, convertToXpath;
    parser = require("bo-selector").parser;
    xpathBuilder = require("xpath-builder").dsl();
    Expression = require("./expression");
    parser.yy.create = function(data) {
        var self = this;
        return new Expression(data);
    };
    parse = function(selector) {
        return parser.parse(selector).render(xpathBuilder, "descendant");
    };
    convertToXpath = function(selector) {
        return parse(selector).toXPath();
    };
    convertToXpath.parse = parse;
    convertToXpath.xPathBuilder = xpathBuilder;
    module.exports = convertToXpath;
}).call(this);