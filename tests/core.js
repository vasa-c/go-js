/**
 * Тестирование ядра библиотеки
 *
 * @package go.js
 * @author  Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global go, tests, ok, equal, deepEqual */
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

    loader = new go.__Loader(includer, creator);

    loader.include(["eight", "nine"], function () {listvar = 1; });
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
    loader.include("nine", function () {listvar = 2; });
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
