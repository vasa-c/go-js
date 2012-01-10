/**
 * Тестирование ядра библиотеки
 *
 * @package go.js
 * @author  Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
"use strict";

/*global go, tests, ok */

tests.module("core");

tests.test("go.VERSION", function () {
	ok(go && go.VERSION);
});