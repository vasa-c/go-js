/**
 * Тестирование ядра библиотеки
 *
 * @package go.js
 * @author  Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global go, tests, ok, deepEqual */
"use strict";


tests.module("core");

tests.test("go.VERSION", function () {
    ok(go && go.VERSION);
});

tests.test("Loader", function () {

    var loader, modules = {}, reqs, l123, l34;

    loader = new go.__Loader({

        'requestModule': function (name) {
            reqs[name] = true;
        },

        'createModule': function (name, fmodule) {
            modules[name] = fmodule();
        }

    });

    reqs = {};
    loader.include(["One", "Two", "Three"], function () {
        l123 = true;
    });
    deepEqual(reqs, {
        'One'   : true,
        'Two'   : true,
        'Three' : true
    }, "requests of all modules");
    deepEqual(modules, {}, "yet none, wait");

    reqs = {};
    loader.include(["Three", "Four"], function () {
        l34 = true;
    });
    deepEqual(reqs, {
        'Four' : true
    }, "request of only new module");
    reqs = {};

    deepEqual(modules, {});
    loader.appendModule("One", null, function () {
        return "MOne";
    });
    deepEqual(modules, {
        'One': "MOne"
    }, "One is loaded");

    loader.appendModule("Two", ["Four", "Five"], function () {
        return "MTwo";
    });
    deepEqual(modules, {
        'One': "MOne"
    }, "Two is not created, because Five is not loaded");
    deepEqual(reqs, {
        'Five': true
    }, "request of only five");
    reqs = {};

    loader.appendModule("Three", ["One"], function () {
        return "MThree";
    });
    deepEqual(modules, {
        'One'   : "MOne",
        'Three' : "MThree"
    }, "Three is created, because One is already created");

    ok(!l34, "listener on 3-4 is not exec");
    loader.appendModule("Four", null, function () {
        return "MFour";
    });
    deepEqual(modules, {
        'One'   : "MOne",
        'Three' : "MThree",
        'Four'  : "MFour"
    }, "Four is created");
    ok(l34, "Four created - exec listener 3-4");

    ok(!l123, "listener on 1-2-3 is not exec");
    loader.appendModule("Five", null, function () {
        return "MFive";
    });
    deepEqual(modules, {
        'One'   : "MOne",
        'Two'   : "MTwo",
        'Three' : "MThree",
        'Four'  : "MFour",
        'Five'  : "MFive"
    }, "Five is created, and therefore Two too");
    ok(l123, "Two created - exec listener");

    deepEqual(reqs, {}, "new requests was not");
});
