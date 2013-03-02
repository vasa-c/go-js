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

tests.test("go.__Loader", function () {

    /* ten -> eight -> six -> five -> four -> two
     *        eight -> seven -> three
     *                        five -> three
     * nine
     */

    var loader,
        includer,
        creator,
        modules = {},
        listvar = 0;

    includer = function (name) {
        includer.L.push(name);
    };

    creator = function (name, data) {
        creator.L.push(name);
        modules[name] = data;
    };

    includer.L = [];
    creator.L = [];

    loader = new go.__L(includer, creator);

    loader.include(["eight", "nine"], function () {listvar = 1;});
    deepEqual(includer.L, ["eight", "nine"]);
    includer.L = [];

    loader.include("ten");
    deepEqual(includer.L, ["ten"]);
    includer.L = [];

    loader.loaded("ten", ["eight"], 10);
    deepEqual(includer.L, []);

    loader.loaded("eight", ["six", "seven"], 8);
    deepEqual(includer.L, ["six", "seven"]);
    includer.L = [];
    deepEqual(creator.L, []);

    loader.loaded("nine", null, 9);
    deepEqual(includer.L, []);
    deepEqual(creator.L, ["nine"]);
    equal(modules.nine, 9);
    ok(!modules.eight);

    equal(listvar, 0);
    loader.include("nine", function () {listvar = 2;});
    equal(listvar, 2);
    listvar = 0;

    loader.include("six");
    deepEqual(includer.L, []);

    loader.loaded("six", ["five"], 6);
    loader.loaded("seven", ["three"], 7);
    deepEqual(includer.L, ["five", "three"]);

    creator.L = [];
    includer.L = [];
    loader.loaded("three", [], 3);
    deepEqual(includer.L, []);
    deepEqual(creator.L, ["three", "seven"]);
    equal(modules.three, 3);
    equal(modules.seven, 7);
    ok(!modules.five);

    creator.L = [];
    includer.L = [];
    loader.loaded("five", ["three", "four"], 5);
    deepEqual(includer.L, ["four"]);
    deepEqual(creator.L, []);

    includer.L = [];
    loader.loaded("four", ["two"], 4);
    deepEqual(includer.L, ["two"]);
    deepEqual(creator.L, []);
    ok(!modules.five);

    includer.L = [];
    equal(listvar, 0);
    loader.loaded("two", null, 2);
    deepEqual(includer.L, []);
    deepEqual(creator.L, ["two", "four", "five", "six", "eight", "ten"]);
    equal(modules.five, 5);
    equal(modules.eight, 8);
    equal(listvar, 1);
});

tests.test("Loader", function () {

    var loader, modules = {}, reqs, l123, l34, l67;

    loader = new go.__Loader({

        'container': modules,

        'requestModule': function (name) {
            reqs[name] = true;
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

    l67 = false;
    loader.addListener(["Six", "Seven"], function () {
        l67 = true;
    });
    ok(!l67);
    loader.appendModule("Six", null, function () {
        return "MSix";
    });
    loader.appendModule("Seven", null, function () {
        return "MSeven";
    });
    ok(l67);

    l67 = true;
    loader.addListener(["Six", "Seven"], function () {
        l67 = true;
    });
    ok(l67, "listener call immediately");
});
