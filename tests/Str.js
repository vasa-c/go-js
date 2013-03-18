/**
 * Тестирование модуля go.Str
 *
 * @package    go.js
 * @subpackage Str
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global go, tests, ok, equal, deepEqual, throws, $ */
"use strict";

tests.module("Str");

tests.test("trim, ltrim, rtrim", function () {
    var s1 = "one two three",
        s2 = "русский",
        s3 = "  \t  one two  \t\n",
        s4 = "   рус   ";
    equal(go.Str.trim(s1), "one two three");
    equal(go.Str.trimLeft(s1), "one two three");
    equal(go.Str.trimRight(s1), "one two three");

    equal(go.Str.trim(s2), "русский");
    equal(go.Str.trimLeft(s2), "русский");
    equal(go.Str.trimRight(s2), "русский");

    equal(go.Str.trim(s3), "one two");
    equal(go.Str.trimLeft(s3), "one two  \t\n");
    equal(go.Str.trimRight(s3), "  \t  one two");

    equal(go.Str.trim(s4), "рус");
    equal(go.Str.trimLeft(s4), "рус   ");
    equal(go.Str.trimRight(s4), "   рус");
});

tests.test("isNumeric", function () {
    ok(go.Str.isNumeric("10"));
    ok(!go.Str.isNumeric("10.2"));
    ok(go.Str.isNumeric("10.2", true));
    ok(!go.Str.isNumeric("-10.2", true));
    ok(go.Str.isNumeric("-10.2", true, true));
    ok(!go.Str.isNumeric("-10.2", false, true));
    ok(go.Str.isNumeric("-10", false, true));
    ok(!go.Str.isNumeric("-10"));
    ok(!go.Str.isNumeric("string"));
    ok(!go.Str.isNumeric("123x"));

    ok(!go.Str.isNumeric(Number['NaN']));
    ok(!go.Str.isNumeric(Number.POSITIVE_INFINITY));
    ok(!go.Str.isNumeric(Number.NEGATIVE_INFINITY));
    ok(!go.Str.isNumeric(Number.NEGATIVE_INFINITY, false, true));
    ok(go.Str.isNumeric(10));
    ok(!go.Str.isNumeric(10.2));
    ok(go.Str.isNumeric(10.2, true));
    ok(!go.Str.isNumeric(-10.2, true));
    ok(go.Str.isNumeric(-10.2, true, true));
    ok(!go.Str.isNumeric(-10.2, false, true));
    ok(go.Str.isNumeric(-10, false, true));

    ok(!go.Str.isNumeric(null));
    ok(!go.Str.isNumeric(undefined));
    ok(!go.Str.isNumeric({}));
});