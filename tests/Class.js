/**
 * Тестирование модуля go.Class
 *
 * @package    go.js
 * @subpackage Class
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual */
"use strict";

tests.module("Class");

tests.test("Create class and instance", function () {

    var TestClass, obj1, obj2;

    TestClass = go.Class({

        'setX': function (x) {
            this.x = x;
        },

        'getX': function () {
            return this.x;
        },

        'eoc': null
    });

    equal(typeof TestClass, "function");

    obj1 = new TestClass();
    obj2 = new TestClass();

    ok(obj1 instanceof TestClass);
    notEqual(obj1, obj2);

    obj1.setX(1);
    obj2.setX(2);

    equal(obj1.getX(), 1);
    equal(obj2.getX(), 2);
});