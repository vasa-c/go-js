/**
 * Тестирование ядра библиотеки
 *
 * @package go.js
 * @author  Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global go, tests, ok */
"use strict";


tests.module("core");

tests.test("go.VERSION", function () {
    ok(go && go.VERSION);
});