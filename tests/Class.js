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

tests.test("constructor can be called without new", function () {

    var TestClass, obj;

    TestClass = go.Class({
        'f': function () {
            return "f";
        }
    });

    obj = TestClass();
    ok(obj instanceof TestClass);
    equal(obj.f(), "f");
});

tests.test("go.Class.Root is root class", function () {

    var TestClass, obj;

    TestClass = go.Class({});
    obj = new TestClass();
    ok(obj instanceof TestClass);
    ok(obj instanceof go.Class.Root);
});

tests.test("constructor/destructor", function () {

    var TestClass, obj1, obj2, destrCount = 0;

    TestClass = go.Class({

        '__construct': function (value) {
            this.value = value;
        },

        '__destruct': function () {
            destrCount += 1;
        },

        'getValue': function () {
            return this.value;
        },

        'eoc': null
    });

    obj1 = new TestClass(1);
    obj2 = new TestClass(2);

    equal(obj1.getValue(), 1);
    equal(obj2.getValue(), 2);

    equal(destrCount, 0);
    obj1.destroy();
    equal(destrCount, 1);
    obj2.destroy();
    equal(destrCount, 2);
});
