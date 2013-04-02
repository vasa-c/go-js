/**
 * Тестирование модуля go.LangExt
 *
 * @package    go.js
 * @subpackage Lang
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual, raises, $ */
"use strict";

tests.module("LangExt");

tests.test("parseQuery", function () {
    deepEqual(go.Lang.parseQuery(""), {});
    deepEqual(go.Lang.parseQuery("x=1&y=2"), {'x': "1", 'y': "2"});
    deepEqual(go.Lang.parseQuery("x=one%3Atwo&y=2"), {'x': "one:two", 'y': "2"});
    deepEqual(go.Lang.parseQuery("12345&x=5"), {'': "12345", 'x': "5"});
    deepEqual(go.Lang.parseQuery({'x': "5"}), {'x': "5"});
});

tests.test("buildQuery", function () {
    var
        vars = {
            'one': 1,
            'two': "two:three",
            'A': {
                'x': 5,
                'y': [1, 2, 3]
            }
        },
        expected = "one=1&two=two%3Athree&A[x]=5&A[y][0]=1&A[y][1]=2&A[y][2]=3";
    equal(go.Lang.buildQuery(vars), expected);
    equal(go.Lang.buildQuery(expected), expected);
});

tests.test("getByPath", function () {

    var context = {
        'one': 1,
        'two': {
            'three': 3,
            'four': {
                'five': "five"
            },
            'six': null
        }
    };

    equal(go.Lang.getByPath(context, "one"), 1);
    deepEqual(go.Lang.getByPath(context, "two"), context.two);
    equal(typeof go.Lang.getByPath(context, "three"), "undefined");
    equal(go.Lang.getByPath(context, "three", 11), 11, "by default");

    equal(go.Lang.getByPath(context, "two.four.five"), "five");
    equal(go.Lang.getByPath(context, ["two", "four", "five"]), "five");

    equal(typeof go.Lang.getByPath(context, "two.six.seven"), "undefined");
    equal(typeof go.Lang.getByPath(context, "two.four.five.toString"), "undefined", "prototype");
});

tests.test("setByPath", function () {

    var context = {
        'one': 1,
        'two': {
            'three': 3,
            'four': {
                'five': "five"
            },
            'six': null
        }
    };

    go.Lang.setByPath(context, "one", 2);
    equal(context.one, 2);
    go.Lang.setByPath(context, "two.three", 4);
    equal(context.two.three, 4);
    go.Lang.setByPath(context, ["two", "four"], 5);
    equal(context.two.four, 5);
    go.Lang.setByPath(context, "two.x.y.z", "xyz");
    equal(typeof context.two.x, "object");
    equal(typeof context.two.x.y, "object");
    equal(context.two.x.y.z, "xyz");

});

tests.test("curry", function () {

    var cur, cur2;

    function f(a, b, c, d) {
        return [a, b, c, d].join(", ");
    }

    cur = go.Lang.curry(f, 1, 2);
    equal(cur(3, 4), "1, 2, 3, 4");

    cur2 = go.Lang.curry(cur, 5);
    equal(cur2(6), "1, 2, 5, 6");
});

tests.test("tryDo", function () {

    var one, two, undef, funcs;

    function err() {
        var x = 5;
        return x(6);
    }

    function fone() {
        if (!one) {
            throw new Error();
        }
        return "one";
    }

    function ftwo() {
        if (!two) {
            throw new Error();
        }
        return "two";
    }

    funcs = [err, fone, ftwo];

    one = true;
    two = true;
    equal(go.Lang.tryDo(funcs), "one");

    one = false;
    equal(go.Lang.tryDo(funcs), "two");

    two = false;
    equal(go.Lang.tryDo(funcs), undef);
});

tests.test("is*-functions", function () {

    var L = go.Lang,
        value,
        name;

    value = undefined;
    name = "undefined";
    ok(L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = null;
    name = "null";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = false;
    name = "Boolean";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = 0;
    name = "Number";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = "";
    name = "String";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = function () {};
    name = "user function";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = Math.floor;
    name = "native function";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = window.alert;
    name = "host function";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = new TypeError();
    name = "TypeError";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = go.Lang.Exception.create("test", go.Lang.Exception);
    /*jslint newcap: true */
    value = new value();
    /*jslint newcap: false */
    name = "go.Lang.Exception";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = new Date();
    name = "Date";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = document.createElement("div");
    name = "Element";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = document.createTextNode("text");
    name = "Textnode";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = document.getElementsByTagName("div");
    name = "Collection";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");

    value = arguments;
    name = "Arguments";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(L.isArguments(value), "isArguments(" + name + ")");

    value = [1, 2, 3];
    name = "Array";
    ok(!L.isUndefined(value), "isUndefined(" + name + ")");
    ok(!L.isNull(value), "isNull(" + name + ")");
    ok(!L.isBoolean(value), "isBoolean(" + name + ")");
    ok(!L.isNumber(value), "isNumber(" + name + ")");
    ok(!L.isString(value), "isString(" + name + ")");
    ok(!L.isFunction(value), "isFunction(" + name + ")");
    ok(!L.isError(value), "isError(" + name + ")");
    ok(!L.isDate(value), "isDate(" + name + ")");
    ok(!L.isElement(value), "isElement(" + name + ")");
    ok(!L.isTextnode(value), "isTextnode(" + name + ")");
    ok(!L.isCollection(value), "isCollection(" + name + ")");
    ok(!L.isArguments(value), "isArguments(" + name + ")");
});

tests.test("invoke", function () {

    var MyClass, list, dict;

    MyClass = function (x) {
        this.x = x;
    };
    MyClass.prototype.plus = function plus(y) {
        return this.x + (y || 0);
    };

    dict = {
        'one'   : new MyClass(1),
        'three' : new MyClass(3),
        'five'  : new MyClass(5)
    };
    deepEqual(go.Lang.invoke(dict, "plus", [2]), {
        'one'   : 3,
        'three' : 5,
        'five'  : 7
    }, "invoke for dict (and args)");

    list = [dict.one, dict.three, dict.five];
    deepEqual(go.Lang.invoke(list, "plus"), [1, 3, 5], "invoke for list (no args)");
});

tests.test("field", function () {
    var MyClass, list, dict;

    MyClass = function (x) {
        this.x = x;
    };

    dict = {
        'one'   : {'x': 1},
        'three' : {'x': 3},
        'five'  : {'x': 5},
        'und'   : {}
    };
    deepEqual(go.Lang.field(dict, "x"), {
        'one'   : 1,
        'three' : 3,
        'five'  : 5,
        'und'   : undefined
    }, "dict");

    list = [dict.one, dict.three, dict.und, dict.five];
    deepEqual(go.Lang.field(list, "x"), [1, 3, undefined, 5], "list");
});

tests.test("fieldByPath", function () {

    var dict, list;

    dict = {
        'norm': {
            'one': {
                'two': {
                    'three': 3
                }
            }
        },
        'none': {
            'one': {
                'three': 3
            }
        }
    };
    deepEqual(go.Lang.fieldByPath(dict, "one.two.three"), {
        'norm': 3,
        'none': undefined
    }, "dict");

    list = [dict.none, dict.norm];
    deepEqual(go.Lang.fieldByPath(list, "one.two.three"), [undefined, 3]);
    deepEqual(go.Lang.fieldByPath(list, "one.three"), [3, undefined]);
});

tests.test("filter", function () {

    var dict, list, context;

    context = {
        'crit': function (item) {
            return (item.x > this.inf);
        }
    };

    dict = {
        'none':  {'x': 0},
        'three': {'x': 3},
        'five':  {'x': 5}
    };
    deepEqual(go.Lang.filter(dict, 'x'), {
        'three': dict.three,
        'five': dict.five
    }, "dict filter by field");

    context.inf = 3;
    deepEqual(go.Lang.filter(dict, context.crit, context), {
        'five': dict.five
    }, "dict filter by iter");

    context.inf = 1;
    deepEqual(go.Lang.filter(dict, context.crit, context), {
        'three': dict.three,
        'five': dict.five
    }, "dict and context test");

    list = [dict.three, dict.none, dict.five];
    deepEqual(go.Lang.filter(list, 'x'), [dict.three, dict.five], "list filter by field");

    context.inf = 3;
    deepEqual(go.Lang.filter(list, context.crit, context), [dict.five], "list filter by iter");

    context.inf = -1;
    deepEqual(go.Lang.filter(list, context.crit, context), [dict.three, dict.none, dict.five], "list and context test");
});

tests.test("sortBy", function () {

    var obj1 = {'x': 1, 'y': 5},
        obj2 = {'x': 2, 'y': 2},
        obj3 = {'x': 3, 'y': 2},
        list,
        result;

    list = [obj2, obj3, obj1];
    result = go.Lang.sortBy(list, "x");
    deepEqual(result, [obj1, obj2, obj3], "sort by field");

    result = go.Lang.sortBy(list, "x", null, true);
    deepEqual(result, [obj3, obj2, obj1], "reverse sort by field");

    result = go.Lang.sortBy(list, function (item) {return item.x * item.y; });
    deepEqual(result, [obj2, obj1, obj3], "sort by func");

    result = go.Lang.sortBy(list, function (item) {return item.x * item.y; }, null, true);
    deepEqual(result, [obj3, obj1, obj2], "reverse sort by func");

    result = go.Lang.sortBy(list, function (item) {
        return Math.abs(this.x - item.x) + Math.abs(this.y - item.y); // точка, ближайшая к context
    }, {'x': 2, 'y': 2});
    deepEqual(result, [obj2, obj3, obj1], "context");

    result = go.Lang.sortBy(list, function (item) {
        return Math.abs(this.x - item.x) + Math.abs(this.y - item.y);
    }, {'x': 2, 'y': 2}, true);
    deepEqual(result, [obj1, obj3, obj2], "context and reverse");
});

tests.test("groupBy", function () {

    var obj12 = {'x': 1, 'y': 2},
        obj21 = {'x': 2, 'y': 1},
        obj23 = {'x': 2, 'y': 3},
        obj32 = {'x': 3, 'y': 2},
        items,
        result,
        expected;

    items = {
        '12': obj12,
        '21': obj21,
        '23': obj23,
        '32': obj32
    };
    result = go.Lang.groupBy(items, "x");
    expected = {
        '1': {
            '12': obj12
        },
        '2': {
            '21': obj21,
            '23': obj23
        },
        '3': {
            '32': obj32
        }
    };
    deepEqual(result, expected, "dict group by field");

    result = go.Lang.groupBy(items, "y");
    expected = {
        '1': {
            '21': obj21
        },
        '2': {
            '12': obj12,
            '32': obj32
        },
        '3': {
            '23': obj23
        }
    };
    deepEqual(result, expected, "dict group by field (other)");

    result = go.Lang.groupBy(items, function (item) {return this.d + item.x - item.y; }, {'d': 5});
    expected = {
        '4': {
            '12': obj12,
            '23': obj23
        },
        '6': {
            '21': obj21,
            '32': obj32
        }
    };
    deepEqual(result, expected, "dict group by callback");

    items = [obj12, obj21, obj23, obj32];
    result = go.Lang.groupBy(items, "x");
    expected = {
        '1': [obj12],
        '2': [obj21, obj23],
        '3': [obj32]
    };
    deepEqual(result, expected, "list group by field");

    result = go.Lang.groupBy(items, function (item) {return this.d + item.x - item.y; }, {'d': 4});
    expected = {
        '3': [obj12, obj23],
        '5': [obj21, obj32]
    };
    deepEqual(result, expected, "list group by callback");
});

tests.test("flip", function () {

    var list = [1, 2, 3, 4, 5, 2, 3],
        dict = {
            '1': "one",
            '2': "two",
            '3': "three"
        };

    deepEqual(go.Lang.flip(list), {
        '1': 0,
        '2': 5,
        '3': 6,
        '4': 3,
        '5': 4
    }, "flip list");

    deepEqual(go.Lang.flip(list, true), {
        '1': true,
        '2': true,
        '3': true,
        '4': true,
        '5': true
    }, "flip list and default value");

    deepEqual(go.Lang.flip(dict), {
        'one': "1",
        'two': "2",
        'three': "3"
    }, "flip dict");

    deepEqual(go.Lang.flip(dict, 1), {
        'one': 1,
        'two': 1,
        'three': 1
    }, "flip dict and default value");
});

tests.test("every", function () {

    var list = [11, 3, 15, 4, 7, 11],
        dict = {
            'a': {'x': 5},
            'b': {'x': 11},
            'c': {'x': 0},
            'd': {'x': 3}
        };

    ok(go.Lang.every(list), "no criterion - scalar");
    ok(go.Lang.every(dict), "no criterion - objects");
    ok(go.Lang.every(list, function (item) {return item > 0; }), "list and callback (true)");
    ok(!go.Lang.every(list, function (item) {return item > 10; }), "list and callback (false)");

    ok(!go.Lang.every(dict, "x"), "dict and field");
    ok(!go.Lang.every(dict, function (item) {return item.x !== this.d; }, {'d': 3}), "dict and callback and context (false)");
    ok(go.Lang.every(dict, function (item) {return item.x !== this.d; }, {'d': 33}), "dict and callback and context (true)");
});

tests.test("reduce", function () {

    var list,
        dict,
        callback,
        context,
        expected;

    list = [2, 4, 6, 8];
    callback = function (previous, current, index, array) {
        array[index] = current + 1;
        return String(previous) + ";" + current + "," + index;
    };
    expected = "2;4,1;6,2;8,3";
    equal(go.Lang.reduce(list, callback), expected, "array");
    deepEqual(list, [2, 5, 7, 9], "array arg");
    expected = "7;2,0;5,1;7,2;9,3";
    equal(go.Lang.reduce(list, callback, 7), expected, "initial value");

    list = [2, 4, 6, 8];
    context = {
        'A': [0, 1, 2, 3]
    };
    callback = function (previous, current, index) {
        return previous + current * this.A[index];
    };
    expected = 42; // 2 + 4 * 1 + 6 * 2 + 8 * 3
    equal(go.Lang.reduce(list, [callback, context]), expected, "context");

    dict = {
        'x': 1,
        'y': 2,
        'z': 3
    };
    callback = function (previous, current) {
        return previous + current;
    };
    expected = 6;
    equal(go.Lang.reduce(dict, callback), expected, "dict");
    context = {
        'x': 2,
        'y': 3,
        'z': 4
    };
    callback = function (previous, current, key, items) {
        if (items !== dict) {
            return 0;
        }
        return previous + current * this[key];
    };
    expected = 21; // 1 + 1 * 2 + 2 * 3 + 3 * 4
    equal(go.Lang.reduce(dict, [callback, context], 1), expected, "dict and initial value + context");

    raises(function () {
        go.Lang.reduce([], function () {});
    }, TypeError, "TypeError for empty array");
});