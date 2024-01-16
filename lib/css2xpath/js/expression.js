(function() {
    var self = this;
    var Renderer, Expression, extend;
    Renderer = require("./renderer");
    Expression = function(data) {
        extend(this, data);
        return this;
    };
    Expression.prototype.render = function(xpath, combinator) {
        var self = this;
        return new Renderer().render(self, xpath, combinator);
    };
    extend = function(o, d) {
        var k;
        for (k in d) {
            (function(k) {
                o[k] = d[k];
            })(k);
        }
        return void 0;
    };
    module.exports = Expression;
}).call(this);