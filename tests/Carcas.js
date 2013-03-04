/**
 * Тестирование модуля go.Carcas
 *
 * @package    go.js
 * @subpackage Carcas
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual, throws */
"use strict";

tests.module("Carcas");

tests.test("Carcas.getInstance()", function () {
    var instance = go.Carcas.getInstance();
    ok(instance instanceof go.Carcas);
    equal(instance, go.Carcas.getInstance());
});

tests.test("Carcas.Helpers.normalizDeps()", function () {

    var normalize = go.Carcas.Helpers.normalizeDeps,
        deps, expected;

    deps = ["c:page1", "mo:one.two", "mo:three.four", "layout.default", "l:fancybox"];
    expected = ["c:page1", "mo:one.two", "mo:three.four", "c:layout.default", "l:fancybox"];
    deepEqual(normalize(deps, "c"), expected, "deps as Array (and default prefix)");

    deps = "c:page1, mo:one.two, mo:three.four, layout.default, l:fancybox";
    deepEqual(normalize(deps, "c"), expected, "deps as String");

    deps = {
        'controllers' : ["page1", "layout.default"],
        'modules'     : ["one.two", "three.four"],
        'go'          : ["Cookie"]
    };
    expected = ["c:page1", "c:layout.default", "mo:one.two", "mo:three.four", "go:Cookie"];
    deepEqual(normalize(deps), expected, "deps as Dict");

    deps = {
        'controllers' : ["page1", "layout.default"],
        'libs'        : ["fancybox"]
    };
    expected = ["c:page1", "c:layout.default", "l:fancybox"];
    deepEqual(normalize(deps), expected, "deps as Dict (and empty nodes)");
});

tests.test("Init and loading", function () {

    var TestCarcas, carcas, registry, otherLibsLoader, files, requests, controllersCreate = [];

    files = {

        '/carcas/controllers/page1.js' : function () {
            carcas.controller("page1", "layouts.default, mo:one.Two", {
                'oncreate': function () {
                    controllersCreate.push("page1");
                }
            });
        },

        '/carcas/controllers/search.js' : function () {
            carcas.controller("search", {

                'oncreate': function () {
                    controllersCreate.push("search");
                },

                'getCarcas': function () {
                    return this.carcas;
                },

                'getRegistryA': function () {
                    return this.carcas.registry.a;
                }

            });
        },

        '/carcas/controllers/layouts/default.js': function () {
            carcas.controller("layouts.default", "mo:one.Two", {
                'oncreate': function () {
                    controllersCreate.push("default");
                }
            });
        },

        '/carcas/modules/one/Two.js': function () {
            carcas.module("one.Two", {
                'modules' : ["one.Three", "Four"],
                'libs'    : ["fancybox"]
            }, function (carcas) {
                return {

                };
            })
        },

        '/carcas/modules/one/Three.js': function () {
            carcas.module("one.Three", function (carcas) {
                return {
                   'getCarcasFromModule': function () {
                       return carcas;
                   }
                };
            });
        },

        '/carcas/modules/Four.js': function () {
            carcas.module("Four", "go:Cookie", function (carcas) {
                return {

                };
            });
        },

        'include': function (path) {
            this[path]();
        }

    };

    TestCarcas = go.Class(go.Carcas, {

        'requestJSFile': function (filename) {
            requests.push(filename);
        },

        'requestGoModule': function (name) { // все нужные go.модули уже подгружены
            this.loader.loaded("go:" + name, [], true);
        },

        'eoc': null
    });

    registry = {
        'a' : 5,
        'b' : 6
    };

    otherLibsLoader = function (libs, handler) {
        if (!otherLibsLoader.requests) {
            otherLibsLoader.requests = [];
        }
        otherLibsLoader.requests.push([libs, handler]);
    };

    /**
     * @type {go.Carcas}
     */
    carcas = new TestCarcas();

    requests = [];
    carcas.init({
        'baseDir'     : "/carcas",
        'registry'    : registry,
        'controllers' : ["page1", "search"],
        'otherLibsLoader': otherLibsLoader
    });
    deepEqual(
        requests,
        ["/carcas/controllers/page1.js", "/carcas/controllers/search.js"],
        "Запросы контроллеров после инициализации"
    );

    requests = [];
    files.include("/carcas/controllers/page1.js");
    files.include("/carcas/controllers/search.js");
    deepEqual(
        requests,
        ["/carcas/controllers/layouts/default.js", "/carcas/modules/one/Two.js"],
        "page1 тянет за собой default и модуль"
    );
    ok(!carcas.controllersList.page1, "page1 ждёт зависимости и ещё не загрузился");

    ok(carcas.controllersList.search, "search загрузился сразу же");
    ok(carcas.controllersList.search instanceof go.Carcas.Controller, "search - контроллер");
    ok(carcas.controllersList.search.getCarcas, "search имеет свой метод");
    equal(carcas.controllersList.search.getCarcas(), carcas, "carcas из контроллера ссылается на центральный объект");
    equal(carcas.controllersList.search.getRegistryA(), 5, "Правильно установлен carcas.registry");

    requests = [];
    files.include("/carcas/controllers/layouts/default.js");
    ok(!carcas.controllersList.layout, "default ждёт one.Two");
    deepEqual(requests, [], "Но запрос к one.Two уже послан");

    files.include("/carcas/modules/one/Two.js");
    ok(!carcas.mo.one, "one.Two ждёт one.Three, Four и fancybox");
    deepEqual(
        requests,
        ["/carcas/modules/one/Three.js", "/carcas/modules/Four.js"],
        "one.Two послал два запроса к библиотеке (fancybox отдельно)"
    );
    deepEqual(otherLibsLoader.requests[0][0], ["fancybox"], "facybox запрошен через пользовательский загрузчик");

    requests = [];
    files.include("/carcas/modules/one/Three.js");
    ok(carcas.mo.one.Three, "one.Three ничего не ждёт");
    files.include("/carcas/modules/Four.js");
    ok(carcas.mo.Four, "Four создан, так как go.Cookie уже загружен");
    deepEqual(requests, [], "Никаких дополнительных запросов ещё не было");

    ok(carcas.mo.one.Three.getCarcasFromModule, "Правильно ли создан модуль");
    ok(carcas.mo.one.Three.getCarcasFromModule(), carcas, "carcas из модуля ссылается на центральный объект");

    ok(!carcas.controllersList.page1, "Все остальные ждут fancybox");
    ok(!carcas.mo.one.Two, "Все остальные ждут fancybox");

    otherLibsLoader.requests[0][1](); // обработчик загрузки fancybox
    ok(carcas.controllersList.page1);
    ok(carcas.controllersList.layouts.default);
    ok(carcas.mo.one.Two);

    deepEqual(
        controllersCreate,
        ["search", "default", "page1"],
        "Правильный порядок создания контроллеров и вызов oncreate"
    );

});