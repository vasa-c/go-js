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

tests.test("Parse deps", function () {

    var depsString = "c:page1, mo:one, mo:one.two.Three, go:Cookies, l:fancybox, page2, layout.default, mo:four.Five",
        depsDict = {
            'controllers' : ["page1", "page2", "layout.default"],
            'modules'     : ["one", "one.two.Three", "four.Five"],
            'go'          : ["Cookies"],
            'otherLibs'   : ["fancybox"]
        };

    deepEqual(go.Carcas.Helpers.parseDeps(depsString, "c"), depsDict);

    throws(
        function () {
            go.Carcas.Helpers.parseDeps(depsString);
        },
        go.Carcas.Exceptions.ErrorDependence,
        "undefined prefix"
    );

    throws(
        function () {
            var depsString = "mo:one, x:two, c:three";
            go.Carcas.Helpers.parseDeps(depsString, "c");
        },
        go.Carcas.Exceptions.ErrorDependence,
        "unknown prefix"
    );

    throws(
        function () {
            var depsString = "mo:one, mo:one:two";
            go.Carcas.Helpers.parseDeps(depsString, "c");
        },
        go.Carcas.Exceptions.ErrorDependence,
        "error format"
    );
});

tests.test("Init and loading", function () {

    var TestCarcas, carcas, registry, otherLibsLoader, files, requests, controllersCreate = [];

    files = {

        '/carcas/controllers/page1.js' : function () {
            carcas.controller("page1", "layout.default, mo:one.Two", {
                'oncreate': function () {
                    controllersCreate.push("page1");
                }
            });
        },

        '/carcas/controllers/search.js' : function () {
            carcas.controller("page1", {

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

        'carcas/controllers/layouts/default.js': function () {
            carcas.controller("layouts.default", "mo:one.Two", {
                'oncreate': function () {
                    controllersCreate.push("default");
                }
            });
        },

        'carcas/modules/one/Two.js': function () {
            carcas.module("one.Two", {
                'modules': ["one.Three", "Four"],
                'otherLibs': "fancybox"
            }, function (carcas) {
                return {

                };
            })
        },

        'carcas/modules/one/Three.js': function () {
            carcas.module("one.Three", function (carcas) {
                return {
                   'getCarcasFromModule': function () {
                       return carcas;
                   }
                };
            });
        },

        'carcas/modules/Four.js': function () {
            carcas.module("Four", "go.Cookie", function (carcas) {
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

        'requestGoModules': function (names, handler) { // все нужные go.модули уже подгружены
            handler();
        },

        'eoc': null
    });

    registry = {
        'a' : 5,
        'b' : 6
    };

    otherLibsLoader = function (libs, handler) {
        var callee = arguments.callee;
        if (!callee.requests) {
            callee.requests = [];
        }
        callee.requests.push([libs, handler]);
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
        ["/carcas/controllers/layout/default.js", "/carcas/modules/one/Two.js"],
        "page1 тянет за собой default и модуль"
    );
    ok(!carcas.controllersList.page1, "page1 ждёт зависимости и ещё не загрузился");

    ok(carcas.controllersList.search, "search загрузился сразу же");
    ok(carcas.controllersList.search instanceof go.Carcas.Controller, "search - контроллер");
    ok(carcas.controllersList.search.getCarcas, "search имеет свой метод");
    equal(carcas.controllersList.search.getCarcas(), carcas, "carcas из контроллера ссылается на центральный объект");
    equal(carcas.controllersList.search.getRegistryA(), 5, "Правильно установлен carcas.registry");

    requests = [];
    files.include("/carcas/controllers/layout/default.js");
    ok(!carcas.controllersList.layout, "default ждёт one.Two");
    deepEqual(request, [], "Но запрос к one.Two уже послан");

    files.include("/carcas/modules/one/Two.js");
    ok(!carcas.mo.one, "one.Two ждёт one.Three, Four и fancybox");
    deepEqual(
        requests,
        ["/carcas/modules/one/Theree.js", "/carcas/modules/Four.js"],
        "one.Two послал два запроса к библиотеке (fancybox отдельно)"
    );
    deepEqual(otherLibsLoader.requests[0][0], ["fancybox"], "facybox запрошен через пользовательский загрузчик");

    requests = [];
    files.include("/carcas/modules/one/Three.js");
    ok(carcas.mo.one.Three, "one.Three ничего не ждёт");
    files.include("/carcas/modules/one/Four.js");
    ok(carcas.mo.Four, "Four создан, так как go.Cookie уже загружен");
    deepEqual(request, [], "Никаких дополнительных запросов ещё не было");

    ok(carcas.mo.one.Three.getCarcasFromModule, "Правильно ли создан модуль");
    ok(carcas.mo.one.Three.getCarcasFromModule(), carcas, "carcas из модуля ссылается на центральный объект");

    ok(!carcas.controllersList.page1, "Все остальные ждут fancybox");
    ok(!carcas.modules.one.Two, "Все остальные ждут fancybox");

    otherLibsLoader.requests[0][1](); // обработчик загрузки fancybox
    ok(carcas.controllersList.page1);
    ok(carcas.controllersList.layouts.default);
    ok(carcas.controllersList.one.Two);

    deepEqual(
        controllersCreate,
        ["search", "default", "page1"],
        "Правильный порядок создания контроллеров и вызов oncreate"
    );

});