/**
 * Тестирование модуля go.Carcas
 *
 * @package    go.js
 * @subpackage Carcas
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual, raises */
"use strict";

tests.module("Carcas");

tests.test("Carcas.getInstance()", function () {
    var instance = go.Carcas.getInstance();
    ok(instance instanceof go.Carcas);
    equal(instance, go.Carcas.getInstance());
});
