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