(function() {
    var self = this;
    var xpathBuilder, Renderer;
    xpathBuilder = require("xpath-builder").dsl();
    Renderer = function() {
        return this;
    };
    Renderer.prototype = {
        render: function(node, xpath, combinator) {
            var self = this;
            var fn;
            fn = self[node.type];
            if (!fn) {
                throw new Error("No renderer for '" + node.type + "'");
            }
            return fn.call(self, node, xpath, combinator);
        },
        selector_list: function(node, xpath, combinator) {
            var self = this;
            var x, i;
            x = self.render(node.selectors[0], xpath, combinator);
            for (i = 1; i < node.selectors.length; ++i) {
                x = x.union(self.render(node.selectors[i], xpath, combinator));
            }
            return x;
        },
        constraint_list: function(node, xpath, combinator) {
            var self = this;
            return self.element(node, xpath, combinator);
        },
        element: function(node, xpath, combinator) {
            var self = this;
            return self.applyConstraints(node, xpath[combinator].call(xpath, node.name || "*"));
        },
        combinator_selector: function(node, xpath, combinator) {
            var self = this;
            var left;
            left = self.render(node.left, xpath, combinator);
            return self.render(node.right, left, node.combinator);
        },
        immediate_child: function(node, xpath) {
            var self = this;
            return self.render(node.child, xpath, "child");
        },
        pseudo_func: function(node, xpath) {
            var self = this;
            var fn;
            fn = self[node.func.name.replace(/-/g, "_")];
            if (fn) {
                return fn.call(self, node, xpath);
            } else {
                throw new Error("Unsupported pseudo function :" + node.func.name + "()");
            }
        },
        pseudo_class: function(node, xpath) {
            var self = this;
            var fn;
            fn = self[node.name.replace(/-/g, "_")];
            if (fn) {
                return fn.call(self, node, xpath);
            } else {
                throw new Error("Unsupported pseudo class :" + node.name);
            }
        },
        has: function(node, xpath) {
            var self = this;
            return self.render(node.func.args, xpathBuilder, "descendant");
        },
        not: function(node, xpath) {
            var self = this;
            var firstChild, childType;
            firstChild = node.func.args.selectors[0];
            childType = firstChild.type;
            if (childType === "constraint_list") {
                return self.combineConstraints(firstChild, xpath).inverse();
            } else {
                return self.matchesSelectorList(node.func.args, xpath).inverse();
            }
        },
        nth_child: function(node, xpath) {
            var self = this;
            return xpath.nthChild(Number(node.func.args));
        },
        first_child: function(node, xpath) {
            var self = this;
            return xpath.firstChild();
        },
        last_child: function(node, xpath) {
            var self = this;
            return xpath.lastChild();
        },
        nth_last_child: function(node, xpath) {
            var self = this;
            return xpath.nthLastChild(Number(node.func.args));
        },
        only_child: function(node, xpath) {
            var self = this;
            return xpath.onlyChild();
        },
        only_of_type: function(node, xpath) {
            var self = this;
            return xpath.onlyOfType();
        },
        nth_of_type: function(node, xpath) {
            var self = this;
            var type;
            type = node.func.args.type;
            if (type === "odd") {
                return xpath.nthOfTypeOdd();
            } else if (type === "even") {
                return xpath.nthOfTypeEven();
            } else if (type === "an") {
                return xpath.nthOfTypeMod(Number(node.func.args.a));
            } else if (type === "n_plus_b") {
                return xpath.nthOfTypeMod(1, Number(node.func.args.b));
            } else if (type === "an_plus_b") {
                return xpath.nthOfTypeMod(Number(node.func.args.a), Number(node.func.args.b));
            } else {
                return xpath.nthOfType(Number(node.func.args));
            }
        },
        nth_last_of_type: function(node, xpath) {
            var self = this;
            var type;
            type = node.func.args.type;
            if (type === "odd") {
                return xpath.nthLastOfTypeOdd();
            } else if (type === "even") {
                return xpath.nthLastOfTypeEven();
            } else if (type === "an") {
                return xpath.nthLastOfTypeMod(Number(node.func.args.a));
            } else if (type === "n_plus_b") {
                return xpath.nthLastOfTypeMod(1, Number(node.func.args.b));
            } else if (type === "an_plus_b") {
                return xpath.nthLastOfTypeMod(Number(node.func.args.a), Number(node.func.args.b));
            } else {
                return xpath.nthLastOfType(Number(node.func.args));
            }
        },
        last_of_type: function(node, xpath) {
            var self = this;
            return xpath.lastOfType();
        },
        empty: function(node, xpath) {
            var self = this;
            return xpath.empty();
        },
        has_attribute: function(node, xpath) {
            var self = this;
            return xpathBuilder.attr(node.name);
        },
        attribute_equals: function(node, xpath) {
            var self = this;
            return xpathBuilder.attr(node.name).equals(node.value);
        },
        attribute_contains: function(node, xpath) {
            var self = this;
            return xpathBuilder.attr(node.name).contains(node.value);
        },
        attribute_contains_word: function(node, xpath) {
            var self = this;
            return xpath.concat(" ", xpathBuilder.attr(node.name).normalize(), " ").contains(" " + node.value + " ");
        },
        attribute_contains_prefix: function(node) {
            var self = this;
            return xpathBuilder.attr(node.name).startsWith(node.value).or(xpathBuilder.attr(node.name).startsWith(node.value + "-"));
        },
        attribute_starts_with: function(node, xpath) {
            var self = this;
            return xpathBuilder.attr(node.name).startsWith(node.value);
        },
        attribute_ends_with: function(node) {
            var self = this;
            return xpathBuilder.attr(node.name).endsWith(node.value);
        },
        "class": function(node) {
            var self = this;
            return self.attribute_contains_word({
                name: "class",
                value: node.name
            }, xpathBuilder);
        },
        id: function(node) {
            var self = this;
            return xpathBuilder.attr("id").equals(node.name);
        },
        previous_sibling: function(node, xpath, combinator) {
            var self = this;
            var left;
            left = self.render(node.left, xpath, combinator);
            return self.applyConstraints(node.right, left.axis("following-sibling", node.right.name));
        },
        adjacent_sibling: function(node, xpath, combinator) {
            var self = this;
            var left;
            left = self.render(node.left, xpath, combinator);
            return self.applyConstraints(node.right, left.axis("following-sibling::*[1]/self", node.right.name));
        },
        first_of_type: function(node, xpath) {
            var self = this;
            return xpath.firstOfType();
        },
        matchesSelectorList: function(node, xpath) {
            var self = this;
            var condition, i;
            if (node.selectors.length > 0) {
                condition = self.matchesSelector(node.selectors[0], xpathBuilder);
                for (i = 1; i < node.selectors.length; ++i) {
                    condition = condition.or(self.matchesSelector(node.selectors[i], xpathBuilder));
                }
                return condition;
            } else {
                return xpath;
            }
        },
        matchesSelector: function(node, xpath) {
            var self = this;
            return xpath.name().equals(node.name);
        },
        combineConstraints: function(node, xpath) {
            var self = this;
            var condition, i;
            condition = self.render(node.constraints[0], xpath);
            for (i = 1; i < node.constraints.length; ++i) {
                condition = condition.and(self.render(node.constraints[i], condition));
            }
            return condition;
        },
        applyConstraints: function(node, xpath) {
            var self = this;
            if (node.constraints.length > 0) {
                return xpath.where(self.combineConstraints(node, xpath));
            } else {
                return xpath;
            }
        }
    };
    module.exports = Renderer;
}).call(this);