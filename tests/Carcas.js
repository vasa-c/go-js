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

        'setEventsListeners': function () {

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

tests.test("Create parent module (controller)", function () {

    var carcas, logs = [], expected;

    carcas = new go.Carcas();
    carcas.setEventsListeners = go.Lang.f.empty;
    carcas.init({});

    carcas.module("one.two.three", function (carcas) {
        logs.push("init mo:one.two.three");
        return {
            'test': function () {
                logs.push('mo:one.two.three');
            }
        };
    });

    carcas.module("one.two", function (carcas) {
        logs.push("init mo:one.two");
        return {
            'test': function () {
                logs.push('mo:one.two');
                this.three.test();
            }
        };
    });

    carcas.controller("a.b.c", {
        'oncreate': function () {
            logs.push("oncreate c:a.b.c");
        },
        'test': function () {
            logs.push("c:a.b.c");
        }
    });

    carcas.controller("a.b", {
        'oncreate': function () {
            logs.push("oncreate c:a.b");
            this.carcas.controllersList.a.b.c.test();
            this.carcas.mo.one.two.test();
        }
    });

    expected = [
        "init mo:one.two.three",
        "init mo:one.two",
        "oncreate c:a.b.c",
        "oncreate c:a.b",
        "c:a.b.c",
        "mo:one.two",
        "mo:one.two.three"
    ];

    deepEqual(logs, expected);
});

tests.test("Events", function () {

    var carcas, events = {}, expected = {};

    carcas = new go.Carcas();
    carcas.setEventsListeners = go.Lang.f.empty;
    carcas.init({});

    deepEqual(events, expected);

    carcas.controller("one", {
        'oncreate': function () {
            events.one_oncreate = true;
        },
        'init': function () {
            events.one_init = true;
        },
        'onload': function () {
            events.one_onload = true;
        },
        'onunload': function () {
            events.one_onunload = true;
        },
        'done': function () {
            events.one_done = true;
        }
    });

    expected.one_oncreate = true;
    deepEqual(events, expected);

    carcas.ondomload();
    expected.one_init = true;
    deepEqual(events, expected);

    carcas.controller("two", {
        'oncreate': function () {
            events.two_oncreate = true;
        },
        'init': function () {
            events.two_init = true;
        },
        'onload': function () {
            events.two_onload = true;
        },
        'onunload': function () {
            events.two_onunload = true;
        },
        'done': function () {
            events.two_done = true;
        }
    });

    expected.two_oncreate = true;
    expected.two_init = true;
    deepEqual(events, expected);

    carcas.onload();
    expected.one_onload = true;
    expected.two_onload = true;
    deepEqual(events, expected);

    carcas.controller("three", {
        'oncreate': function () {
            events.three_oncreate = true;
        },
        'init': function () {
            events.three_init = true;
        },
        'onload': function () {
            events.three_onload = true;
        },
        'onunload': function () {
            events.three_onunload = true;
        },
        'done': function () {
            events.three_done = true;
        }
    });

    expected.three_oncreate = true;
    expected.three_init = true;
    expected.three_onload = true;
    deepEqual(events, expected);

    carcas.onunload();
    expected.one_onunload = true;
    expected.two_onunload = true;
    expected.three_onunload = true;
    expected.one_done = true;
    expected.two_done = true;
    expected.three_done = true;
    deepEqual(events, expected);
});