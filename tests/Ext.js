/**
 * Тестирование модуля go.Ext
 *
 * @package    go.js
 * @subpackage Ext
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual, raises */
"use strict";

tests.module("Ext");

tests.test("Options class", function () {

    var OneClass, TwoClass, options, instance, expected;

    OneClass = go.Class([null, go.Ext.Options], {

        'options': {
            'one' : {
                'x' : 5,
                'y' : 6,
                'z' : 7
            },
            'two'   : 2,
            'three' : 3
        },

        '__construct': function (x, options) {
            this.x = x;
            this.constructOptions(options);
        }

    });

    TwoClass = go.Class(OneClass, {

        'options' : {
            'one' : {
                'x' : 8
            },
            'two'  : 4,
            'four' : 5
        }

    });

    options = {
        'one' : {
            'y' : 9
        },
        'five' : 6
    };

    instance = new TwoClass(1, options);

    expected = {
        'one' : {
            'x' : 8,
            'y' : 9,
            'z' : 7
        },
        'two'   : 4,
        'three' : 3,
        'four'  : 5,
        'five'  : 6
    };

    deepEqual(instance.getOptions(), expected, "getOptions()");
    deepEqual(instance.getOption("one.x"), expected.one.x, "getOptions(opt)");
    raises(function () {instance.getOption("two.x"); }, go.Ext.Options.Exceptions.NotFound, "getOption() error");

    instance.setOption("one.y", 11);
    expected.one.y = 11;
    deepEqual(instance.getOptions(), expected, "setOption()");

    raises(function () {instance.setOption("three.x"); }, go.Ext.Options.Exceptions.NotFound, "setOption() error");
    deepEqual(instance.getOptions(), expected);
});

tests.test("Options class and lazy copy", function () {

    var TestClass, one, two, three;

    TestClass = go.Class([null, go.Ext.Options], {
        'options' : {
            'x' : 1,
            'y' : 2
        },

        '__construct': function (options) {
            go.Ext.Options.__construct(this, options);
        }
    });

    one = new TestClass({'y': 3});
    two = new TestClass();
    three = new TestClass();

    equal(one.getOption("x"), 1);
    equal(two.getOption("x"), 1);
    equal(three.getOption("x"), 1);

    one.setOption("x", 2);
    equal(one.getOption("x"), 2);
    equal(two.getOption("x"), 1);
    equal(three.getOption("x"), 1);

    two.setOption("x", 3);
    equal(one.getOption("x"), 2);
    equal(two.getOption("x"), 3);
    equal(three.getOption("x"), 1);
});
