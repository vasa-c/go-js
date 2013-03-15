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