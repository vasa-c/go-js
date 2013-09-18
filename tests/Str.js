/**
 * Testing the module go.Str
 *
 * @package    go.js
 * @subpackage Str
 * @author     Grigoriev Oleg aka vasa_c <go.vasac@gmail.com>
 */
/*jslint node: true, nomen: true */
/*global go, tests, ok, equal, deepEqual, throws, $ */
"use strict";

tests.module("Str");

tests.test("trim, trimLeft, rtrimRight", function () {
    var s1 = "one two three",
        s2 = "русский",
        s3 = "  \t  one two  \t\n",
        s4 = "   рус   ";
    equal(go.Str.trim(s1), "one two three", "trim (empty)");
    equal(go.Str.trimLeft(s1), "one two three", "trimLeft (empty)");
    equal(go.Str.trimRight(s1), "one two three", "trimRight (empty)");

    equal(go.Str.trim(s2), "русский", "trim (cyrillic empty)");
    equal(go.Str.trimLeft(s2), "русский", "trimLeft (cyrillic empty)");
    equal(go.Str.trimRight(s2), "русский", "trimRight (cyrillic empty)");

    equal(go.Str.trim(s3), "one two", "trim");
    equal(go.Str.trimLeft(s3), "one two  \t\n", "trimLeft");
    equal(go.Str.trimRight(s3), "  \t  one two", "trimRight");

    equal(go.Str.trim(s4), "рус", "trim (cyrillic)");
    equal(go.Str.trimLeft(s4), "рус   ", "trimLeft (cyrillic)");
    equal(go.Str.trimRight(s4), "   рус", "trimRight (cyrillic)");
});

tests.test("isNumeric", function () {
    ok(go.Str.isNumeric("10"), "10 is integer and positive");
    ok(!go.Str.isNumeric("10.2"), "10.2 is not integer");
    ok(go.Str.isNumeric("10.2", true), "10.2 is float");
    ok(!go.Str.isNumeric("-10.2", true), "-10.2 is not positive");
    ok(go.Str.isNumeric("-10.2", true, true), "-10.2 is numeric (float and negative allow)");
    ok(!go.Str.isNumeric("-10.2", false, true), "-10.2 is not integer (negative allow)");
    ok(go.Str.isNumeric("-10", false, true), "-10 is integer and negative");
    ok(!go.Str.isNumeric("-10"), "-10 is not positive");
    ok(!go.Str.isNumeric("string"), '"string" is not numeric');
    ok(!go.Str.isNumeric("123x"), '"123x" is not numeric');

    ok(!go.Str.isNumeric(Number['NaN']), "NaN is not numeric");
    ok(!go.Str.isNumeric(Number.POSITIVE_INFINITY), "POSITIVE_INFINITY is not numeric");
    ok(!go.Str.isNumeric(Number.NEGATIVE_INFINITY), "NEGATIVE_INFINITY is not numeric");
    ok(!go.Str.isNumeric(Number.NEGATIVE_INFINITY, false, true), "NEGATIVE_INFINITY is not numeric (negative allow)");
    ok(go.Str.isNumeric(10), "Number is numeric");
    ok(!go.Str.isNumeric(10.2), "Float is not integer");
    ok(go.Str.isNumeric(10.2, true), "Float is float");
    ok(!go.Str.isNumeric(-10.2, true), "Negative float is not positive");
    ok(go.Str.isNumeric(-10.2, true, true), "Negative float is negative float");
    ok(!go.Str.isNumeric(-10.2, false, true), "Negative float is not integer");
    ok(go.Str.isNumeric(-10, false, true), "Negative integer is negative");

    ok(!go.Str.isNumeric(null), "Null is not numeric");
    ok(!go.Str.isNumeric(undefined), "Undefined is not numeric");
    ok(!go.Str.isNumeric({}), "Object is not numeric");
});

tests.test("repeat", function () {
    equal(go.Str.repeat("1", 10), "1111111111", "Repeat character");
    equal(go.Str.repeat("x-", 3), "x-x-x-", "Repeat string");
    equal(go.Str.repeat("x-", 0), "", "Empty repeat");
});

tests.test("align", function () {
    equal(go.Str.align("String", 10), "String    ", "Align left");
    equal(go.Str.align("String", 3), "String", "Align left (overflow)");
    equal(go.Str.align("String", 10, "left"), "String    ", "Align left (explicit argument)");
    equal(go.Str.align("String", 10, "right"), "    String", "Align right");
    equal(go.Str.align("String", 10, "center"), "  String  ", "Align center");
    equal(go.Str.align("String", 11, "center").length, 11, "Align center (asymmetrical)");
    equal(go.Str.align("String", 10, "center", "-"), "--String--", "Filler is not space");
});

tests.test("numberFormat", function () {
    equal(go.Str.numberFormat(10), "10", "10");
    equal(go.Str.numberFormat(1000000), "1,000,000", "1,000,000");
    equal(go.Str.numberFormat(12345678), "12,345,678", "12,345,678");
    equal(go.Str.numberFormat(123456789), "123,456,789", "123,456,789");
    equal(go.Str.numberFormat(1234567890), "1,234,567,890", "1,234,567,890");
    equal(go.Str.numberFormat(1000000, 2), "1,000,000.00", "1,000,000.00 (2 decimals)");
    equal(go.Str.numberFormat(1000000, 2, ",", " "), "1 000 000,00", "1 000 000,00 (user separator and dec point)");
});

tests.test("html/htmlDecode", function () {
    var plain = 'This is <div class="div">tag\' & quot</div>',
        html  = 'This is &lt;div class=&quot;div&quot;&gt;tag&#039; &amp; quot&lt;/div&gt;';

    equal(go.Str.html(plain), html, "escape html");
    equal(go.Str.htmlDecode(html), plain, "decode html");
    equal(go.Str.htmlDecode(""), "", "empty");
    equal(go.Str.htmlDecode("<hr />"), "", "decode <hr /> is empty (invalid character)");

});

tests.test("tpl", function () {

    var template, vars, expected, compile;

    vars = {
        'num': 10,
        'str': "String",
        'none': null,
        'dict': {
            'x': {
                'y': 0
            },
            'obj': {
                'toString': function () {return "OBJ!"; }
            }
        }
    };

    template = "N: {{ num }}, str: {{ str }}, none: {{ none }}, dict.x.y: {{  dict.x.y  }}, ({{ dict.a.b.c }});obj: {{dict.obj}}; {{num}}";
    expected = "N: 10, str: String, none: , dict.x.y: 0, ();obj: OBJ!; 10";
    equal(go.Str.tpl(template, vars), expected, "template");

    compile = go.Str.tpl.compile(template);
    equal(go.Str.tpl(compile, vars), expected, "compile");

    template = "N: {{ num }}, str: [str];";
    expected = "N: {{ num }}, str: String;";
    equal(go.Str.tpl(template, vars, "[", "]"), expected, "user tags");
});