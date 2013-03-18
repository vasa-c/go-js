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