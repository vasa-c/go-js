/**
 * go.js: библиотека для упрощения некоторых вещей в JavaScript
 *
 * В данном файле определяется только ядро библиотеки и модуль go.Lang.
 * Остальные модули располагаются в других файлах.
 *
 * @package go.js
 * @author  Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @version 1.0-beta
 * @license MIT (http://www.opensource.org/licenses/mit-license.php)
 * @link    https://github.com/vasa-c/go-js
 */
/*jslint node: true, nomen: true */
/*global window */
"use strict";

/**
 * @namespace go
 */
var go = (function (global) {

    var VERSIONS = "1.0-beta",

        /**
         * Http-адрес каталога в котором находится go.js и модули
         *
         * @type {String}
         */
        GO_DIR,

        /**
         * @type {Document}
         */
        doc = global.document,

        /**
         * Загрузчик модулей
         *
         * @type {go.__Loader}
         */
        loader,

        /**
         * Антикэш при подключении модулей
         *
         * @return {String}
         */
        anticache;

    /**
     * Вызов go(), как функции - загрузка модуля
     *
     * @param {String} name
     *        имя модуля
     * @param {Array.<String>} [deps]
     *        список зависимостей
     * @param {Function} fmodule
     *        функция-конструктор модуля
     * @return {Function}
     */
    function go(name, deps, fmodule) {
        if (name) {
            go.appendModule(name, deps, fmodule);
        }
        return go;
    }

    /**
     * Текущая версия библиотеки
     *
     * @constant
     * @name go.VERSION
     * @type {String}
     */
    go.VERSION = VERSIONS;

    /**
     * go.include(): инициирование загрузки нужных модулей
     * (только на этапе загрузки страницы)
     *
     * @name go.include
     *
     * @param {(String|Array<String>)} names
     *        имя нужного модуля или список из нескольких имён
     * @param {Function} [listener]
     *        обработчик загрузки всех указанных модулей
     */
    go.include = function (names, listener) {
        loader.include(names, listener);
    };

    /**
     * go.appendModule(): добавление модуля в пространство имён
     * (вызывается при определении модуля в соответствующем файле)
     *
     * @name go.appendModule
     * @param {String} name
     *        имя модуля
     * @param {Array<String>} [deps]
     *        список зависимостей
     * @param {Function} fmodule
     *        функция-конструктор модуля
     */
    go.appendModule = function (name, deps, fmodule) {
        if (!fmodule) {
            fmodule = deps;
            deps = [];
        }
        loader.loaded(name, deps, fmodule);
    };

    /**
     * @class go.__Loader
     *        загрузчик модулей
     */
    go.__Loader = (function () {

        function Loader(includer, creator) {
            this.__construct(includer, creator);
        }
        Loader.prototype = {

            /**
             * @lends go.__Loader.prototype
             */

            /**
             * @constructs
             * @public
             * @param {Function(string)} includer
             *        внешняя функция, инициирующая запрос на загрузку модуля (получает аргументом название)
             * @param {Function(string, *)} creator
             *        внешнаяя функция, создающая модуль (получает имя и данные)
             */
            '__construct': function (includer, creator) {
                this.includer = includer;
                this.creator  = creator;
                this.modules  = {};
            },

            /**
             * Запрос на подключения модулей
             *
             * @name go.__Loader#include
             * @public
             * @param {(String|Array.<String>)} names
             *        имя модуля или список имён
             * @param {Function} [listener]
             *        слушатель окончания загрузки всех модулей из списка
             */
            'include': function (names, listener) {
                var len,
                    i,
                    name,
                    module,
                    includer = this.includer,
                    counter,
                    Listeners = go.__Loader.Listeners;
                if (typeof names === "string") {
                    names = [names];
                }
                if (listener) {
                    counter = Listeners.createCounter(null, listener);
                }
                for (i = 0, len = names.length; i < len; i += 1) {
                    name = names[i];
                    module = this.modules[name];
                    if (!module) {
                        module = {};
                        this.modules[name] = module;
                        includer(name);
                    }
                    if ((!module.created) && counter) {
                        counter.inc();
                        if (module.listener) {
                            module.listener.append(counter);
                        } else {
                            module.listener = Listeners.create(counter);
                        }
                    }
                }
                if (counter) {
                    counter.filled();
                }
            },

            /**
             * Информирование о загрузке данных модуля
             *
             * @name go.__Loader#loaded
             * @public
             * @param {String} name
             *        название
             * @param {Array.<String>} deps
             *        список зависимостей
             * @param {*} data
             *        данные модуля
             */
            'loaded': function (name, deps, data) {
                var module = this.modules[name],
                    listener,
                    loader = this;
                if (!module) {
                    module = {};
                    this.modules[name] = module;
                } else if (module.created || module.data) {
                    return;
                }
                listener = function () {
                    loader.creator.call(this, name, data);
                    module.created = true;
                    if (module.listener) {
                        module.listener.call(null);
                    }
                };
                deps = deps || [];
                this.include(deps, listener);
            },

            /**
             * См. конструктор
             * @name go.__Loader#includer
             * @private
             * @type {Function(string)}
             */
            'includer': null,

            /**
             * См. конструктор
             * @name go.__Loader#creator
             * @private
             * @type {Function(string, *)}
             */
            'creator': null,

            /**
             * Статусы и параметры модулей
             * имя => параметры
             *
             * Есть запись - запрос на загрузку уже послан
             * поле "created"  - модуль создан
             * поле "listener" - слушатель на создание этого модуля
             *
             * @name go.__Loader#reqs
             * @private
             * @type {Object.<String, Object>}
             */
            'modules': null
        };
        return Loader;
    }());

    go.__Loader.Listeners = {

        /**
         * @name go.Lang.Listeners.create
         * @param {(Function|Array.<Function>)} f
         * @return {go.Lang.Listeners.Listener}
         */
        'create': (function () {

            var ping, append, remove;

            /**
             * @name go.Lang.Listeners.Listener#ping
             * @public
             * @return void
             */
            ping = function ping() {
                this.apply(null, arguments);
            };

            /**
             * @name go.Lang.Listeners.Listener#append
             * @public
             * @param {Function} f
             * @param {Boolean} [check]
             * @return {Number}
             */
            append = function append(f, check) {
                var list = this.list,
                    len,
                    i;
                if (check) {
                    for (i = 0, len = list.length; i < len; i += 1) {
                        if (list[i] === f) {
                            return i;
                        }
                    }
                }
                list.push(f);
                return list.length - 1;
            };

            /**
             * @name go.Lang.Listeners.Listener#ping
             * @public
             * @param {(Function|Number)} f
             * @return {Boolean}
             */
            remove = function remove(f) {
                var list = this.list, len, i;
                if (typeof f !== "function") {
                    if (list[f]) {
                        list[f] = null;
                        return true;
                    } else {
                        return false;
                    }
                }
                for (i = 0, len = list.length; i < len; i += 1) {
                    if (list[i] === f) {
                        list[i] = null;
                        return true;
                    }
                }
                return false;
            };

            function create(list) {
                var listener;

                if (typeof list === "function") {
                    list = [list];
                } else if (Object.prototype.toString.call(list) !== '[object Array]') {
                    list = [];
                }

                listener = function () {
                    var current,
                        len = list.length,
                        i;
                    for (i = 0; i < len; i += 1) {
                        current = list[i];
                        if (current) {
                            current.apply(null, arguments);
                        }
                    }
                };

                listener.list = list;
                listener.ping = ping;
                listener.append = append;
                listener.remove = remove;

                return listener;
            }

            return create;
        }()),

        /**
         * @name go.Lang.Listeners.createCounter
         * @param {Number} count
         * @param {Function} listener
         * @return {(Function|go.Lang.Listeners.Counter)}
         */
        'createCounter': (function () {

            var inc, filled;

            /**
             * @name go.Lang.Listeners.Counter#inc
             * @param {Number} [i=1]
             */
            inc = function inc(i) {
                if (this.count !== 0) {
                    this.count += (i || 1);
                }
            };

            /**
             * @name go.Lang.Listeners.Counter#filled
             * @return {Boolean}
             */
            filled = function filled() {
                if (!this.count) {
                    this.count = 0;
                    this.listener.apply(null);
                    return true;
                }
                return false;
            };

            function createCounter(count, listener) {
                if (count === 0) {
                    listener();
                }
                function Counter() {
                    if (Counter.count > 0) {
                        Counter.count -= 1;
                        if (Counter.count === 0) {
                            Counter.listener.apply(null);
                        }
                    }
                }
                Counter.count = count;
                Counter.listener = listener;
                Counter.inc = inc;
                Counter.filled = filled;
                return Counter;
            }

            return createCounter;
        }())
    };

    /**
     * @name go.__Loader.includeJSFile
     * @param {String} src
     */
    go.__Loader.includeJSFile = function (src) {
        doc.write('<script type="text/javascript" src="' + src + '"></script>');
    };

    loader = (function () {
        function includer(name) {
            go.__Loader.includeJSFile(GO_DIR + name + ".js" + anticache);
        }
        function creator(name, data) {
            go[name] = data(go, global);
        }
        return new go.__Loader(includer, creator);
    }());

    go.log = function () {
        var console = global.console;
        if (console && console.log) {
            console.log.apply(console, arguments);
        }
    };

    /**
     * Инициализация библиотеки
     * - вычисление каталога с go.js
     * - подключение модулей заданных в параметрах URL
     *
     * @todo оптимизировать и протестировать для различных вариантов URL
     */
    (function () {

        var SRC_PATTERN = new RegExp("^(.*\\/)?go\\.js(\\?[^#]*)?(#(.*?))?$"),
            matches;

        if (doc.currentScript) {
            matches = SRC_PATTERN.exec(doc.currentScript.getAttribute("src"));
        }
        if (!matches) {
            matches = (function () {
                var scripts = doc.getElementsByTagName("script"),
                    i,
                    src,
                    matches;
                for (i = scripts.length; i > 0; i -= 1) {
                    src = scripts[i - 1].getAttribute("src");
                    matches = SRC_PATTERN.exec(src);
                    if (matches) {
                        return matches;
                    }
                }
                return null;
            }());
        }
        if (!matches) {
            throw new Error("go.js is not found in DOM");
        }

        GO_DIR = matches[1];

        anticache = matches[2] || "";

        if (matches[4]) {
            go.include(matches[4].split(","));
        }

    }());

    return go;
}(window));

/*jslint unparam: true */
/**
 * @namespace go.Lang
 */
go("Lang", function (go, global) {
    /*jslint unparam: false */

    var Lang = {

        /**
         * @lends go.Lang
         */

        /**
         * Связывание функции с контекстом и аргументами
         * Поведение аналогично Function.prototype.bind()
         * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
         *
         * Если для функции определён свой метод bind(), то используется он
         *
         * @name go.Lang.bind
         * @param {Function} func
         *        функция
         * @param {Object} [thisArg]
         *        контекст в котором функция должна выполняться (по умолчанию - global)
         * @param {Array} [args]
         *        аргументы, вставляемые в начало вызова функции
         * @return {Function}
         *         связанная с контекстом функция
         */
        'bind': function bind(func, thisArg, args) {
            var result;
            thisArg = thisArg || global;
            if (func.bind) {
                if (args) {
                    args = [thisArg].concat(args);
                } else {
                    args = [thisArg];
                }
                result = func.bind.apply(func, args);
            } else if (args) {
                result = function () {
                    return func.apply(thisArg, args.concat(Array.prototype.slice.call(arguments, 0)));
                };
            } else {
                result = function () {
                    return func.apply(thisArg, arguments);
                };
            }
            return result;
        },

        /**
         * Получение расширенного типа значения
         *
         * @name go.Lang.getType
         * @param {mixed} value
         *        проверяемое значение
         * @return {String}
         *         название типа
         */
        'getType': function getType(value) {
            var type;

            if (value && (typeof value.go$type === "string")) {
                return value.go$type;
            }

            type = typeof value;
            if ((type !== "object") && (type !== "function")) {
                return type;
            }
            if (value === null) {
                return "null";
            }

            switch (Object.prototype.toString.call(value)) {
            case "[object Function]":
                return "function";
            case "[object Array]":
                return "array";
            case "[object RegExp]":
                return "regexp";
            case "[object Error]":
                return "error";
            case "[object Date]":
                return "date";
            case "[object HTMLCollection]":
            case "[object NodeList]":
                return "collection";
            case "[object Text]":
                return "textnode";
            case "[object Arguments]":
                return "arguments";
            case "[object Number]":
                return "number";
            case "[object String]":
                return "string";
            case "[object Boolean]":
                return "boolean";
            }

            if (value.constructor) {
                if (value instanceof Array) {
                    return "array";
                }
                if (window.HTMLElement) {
                    if (value instanceof window.HTMLElement) {
                        return "element";
                    }
                } else {
                    if (value.nodeType === 1) {
                        return "element";
                    }
                }
                if (window.Text && (value instanceof window.Text)) {
                    return "textnode";
                }
                if (window.HTMLCollection && (value instanceof window.HTMLCollection)) {
                    return "collection";
                }
                if (window.NodeList && (value instanceof window.NodeList)) {
                    return "collection";
                }
                if ((typeof value.length === "number") && (!value.slice)) {
                    return "arguments";
                }
            } else {
                if (value.nodeType === 1) {
                    return "element";
                }
                if (value.nodeType === 3) {
                    return "textnode";
                }
                if (typeof value.length === "number") {
                    return "collection";
                }
                /* Идентификация host-функции в старых IE (typeof === "object") по строковому представлению
                 * Также у них нет toString(), так что складываем со строкой.
                 * Сложение с пустой строкой не нравится JSLint
                 */
                if ((value + ":").indexOf("function") !== -1) {
                    return "function";
                }
            }

            return "object";
        },

        /**
         * Является ли значение массивом
         *
         * @name go.Lang.isArray
         * @param {mixed} value
         *        проверяемое значение
         * @param {Boolean} [strict=false]
         *        точная проверка - именно массивом
         *        по умолчанию - любая коллекция с порядковым доступом
         * @return {Boolean}
         *         является ли значение массивом
         */
        'isArray': function isArray(value, strict) {
            switch (Lang.getType(value)) {
            case "array":
                return true;
            case "collection":
            case "arguments":
                return (!strict);
            default:
                return false;
            }
        },

        /**
         * Является ли объект простым словарём.
         * То есть любым объектом, не имеющий более специфического типа.
         *
         * @name go.Lang.isDict
         * @param {Object} value
         *        проверяемое значение
         * @return {Boolean}
         *         является ли значение простым словарём
         */
        'isDict': function isDict(value) {
            return (value && (value.constructor === Object));
        },

        /**
         * Обход элементов объекта
         *
         * @name go.Lang.each
         * @param {Object|Array} iter
         *        итерируемый объект (или порядковый массив)
         * @param {Function} fn
         *        тело цикла
         * @param {Object} [thisArg=global]
         *        контект, в котором следует выполнять тело цикла
         * @param {Boolean} [deep=false]
         *        обходить ли прототипы
         * @return {Object|Array}
         *         результаты выполнения функции для всех элементов
         */
        'each': function each(iter, fn, thisArg, deep) {

            var result, i, len;
            thisArg = thisArg || global;

            if (Lang.isArray(iter)) {
                result = [];
                for (i = 0, len = iter.length; i < len; i += 1) {
                    result.push(fn.call(thisArg, iter[i], i, iter));
                }
            } else {
                result = {};
                /*jslint forin: true */
                for (i in iter) {
                    if (iter.hasOwnProperty(i) || deep) {
                        result[i] = fn.call(thisArg, iter[i], i, iter);
                    }
                }
                /*jslint forin: false */
            }

            return result;
        },

        /**
         * Копирование объекта или массива
         *
         * @name go.Lang.copy
         * @param {Object|Array} source
         *        исходный объект
         * @return {Object|Array}
         *         копия исходного объекта
         */
        'copy': function copy(source) {
            var result, i, len;
            if (Lang.isArray(source)) {
                result = [];
                for (i = 0, len = source.length; i < len; i += 1) {
                    result.push(source[i]);
                }
            } else {
                result = {};
                for (i in source) {
                    if (source.hasOwnProperty(i)) {
                        result[i] = source[i];
                    }
                }
            }
            return result;
        },

        /**
         * Расширение объекта свойствами другого
         *
         * @name go.Lang.extend
         * @param {Object} destination
         *        исходный объект (расширяется на месте)
         * @param {Object} source
         *        источник новых свойств
         * @param {Boolean} [deep=false]
         *        обходить прототипы source
         * @return {Object}
         *         расширенный destination
         */
        'extend': function extend(destination, source, deep) {
            var k;
            /*jslint forin: true */
            for (k in source) {
                if (deep || source.hasOwnProperty(k)) {
                    destination[k] = source[k];
                }
            }
            /*jslint forin: false */
            return destination;
        },

        /**
         * Рекурсивное слияние двух объектов на месте
         *
         * @name go.Lang.merge
         * @param {Object} destination
         *        исходных объект (изменяется)
         * @param {Object} source
         *        источник новых свойств
         * @return {Object}
         *         расширенный destination
         */
        'merge': function merge(destination, source) {
            var k, value;
            for (k in source) {
                if (source.hasOwnProperty(k)) {
                    value = source[k];
                    if (Lang.isDict(value) && Lang.isDict(destination[k])) {
                        destination[k] = Lang.merge(destination[k], value);
                    } else {
                        destination[k] = value;
                    }
                }
            }
            return destination;
        },

        /**
         * Получить значение по пути внутри объекта
         *
         * @name go.Lang.getByPath
         * @param {Object} context
         *        объект, в котором производится поиск (не указан - глобальный)
         * @param {(String|Array.<String>)} path
         *        путь - массив компонентов или строка вида "one.two.three"
         * @param [bydefault]
         *        значение по умолчанию, если путь не найден
         * @return {*}
         */
        'getByPath': function getByPath(context, path, bydefault) {
            var len, i, p;
            context = context || global;
            if (typeof path !== "object") {
                path = path.split(".");
            }
            for (i = 0, len = path.length; i < len; i += 1) {
                p = path[i];
                if (!(context && context.hasOwnProperty(p))) {
                    return bydefault;
                }
                context = context[p];
            }
            return context;
        },

        /**
         * Установить значение по пути внутри объекта
         *
         * @name go.Lang.getByPath
         * @param {Object} context
         *        целевой объект
         * @param {(String|Array.<String>)} path
         *        путь - массив компонентов или строка вида "one.two.three"
         * @param {*} value
         *        значение
         */
        'setByPath': function setByPath(context, path, value) {
            var len, i, p;
            context = context || global;
            if (typeof path !== "object") {
                path = path.split(".");
            }
            for (i = 0, len = path.length - 1; i < len; i += 1) {
                p = path[i];
                if (!context.hasOwnProperty(p)) {
                    context[p] = {};
                }
                context = context[p];
            }
            context[path[path.length - 1]] = value;
        },

        /**
         * Каррирование функции
         *
         * @name go.Lang.curry
         * @param {Function} fn
         *        исходная функция
         * @params {*...} [arg1]
         *         запоминаемые аргументы
         * @return {Function}
         *         каррированная функция
         */
        'curry': function curry(fn) {
            var slice = Array.prototype.slice,
                cargs = slice.call(arguments, 1);
            return function () {
                var args = cargs.concat(slice.call(arguments));
                return fn.apply(global, args);
            };
        },

        /**
         * Присутствует ли значение в массиве
         * (строгая проверка)
         *
         * @name go.Lang.inArray
         * @param {mixed} needle
         *        значение
         * @param {Array} haystack
         *        порядковый массив
         * @return {Boolean}
         *         находится ли значение в массиве
         */
        'inArray': function inArray(needle, haystack) {
            var i, len;
            for (i = 0, len = haystack.length; i < len; i += 1) {
                if (haystack[i] === needle) {
                    return true;
                }
            }
            return false;
        },

        /**
         * Выполнить первую корректную функцию
         *
         * @name go.Lang.tryDo
         * @param {Function[]} funcs
         *        список функций
         * @return {mixed}
         *         результат первой корректно завершившейся
         *         ни одна не сработала - undefined
         */
        'tryDo': function tryDo(funcs) {
            var i, len, result;
            for (i = 0, len = funcs.length; i < len; i += 1) {
                try {
                    return funcs[i]();
                } catch (e) {
                }
            }
            return result;
        },

        /**
         * Разбор GET или POST запроса
         *
         * @name go.Lang.parseQuery
         * @param {String} [query=window.location]
         *        строка запроса
         * @param {String} [sep="&"]
         *        разделитель переменных
         * @return {Object}
         *         переменные из запроса
         */
        'parseQuery': function parseQuery(query, sep) {
            var result = {}, i, len, v;
            if (typeof query === "undefined") {
                query = global.location.toString().split("#", 2)[0].split("?", 2)[1];
            } else if (typeof query !== "string") {
                return query;
            }
            if (!query) {
                return result;
            }
            query = query.split(sep || "&");
            for (i = 0, len = query.length; i < len; i += 1) {
                v = query[i].split("=", 2);
                if (v.length === 2) {
                    result[decodeURIComponent(v[0])] = decodeURIComponent(v[1]);
                } else {
                    result[''] = decodeURIComponent(v[0]);
                }
            }
            return result;
        },

        /**
         * Сформировать строку запроса на основе набора переменных
         *
         * @name go.Lang.buildQuery
         * @param {Object|String} vars
         *        набор переменных (или сразу строка)
         * @param {String} [sep="&"]
         *        разделитель
         * @return {String}
         *         строка запроса
         */
        'buildQuery': function buildQuery(vars, sep) {
            var query = [], buildValue, buildArray, buildDict;
            if (typeof vars === "string") {
                return vars;
            }
            buildValue = function (name, value) {
                if (Lang.isDict(value)) {
                    buildDict(value, name);
                } else if (Lang.isArray(value)) {
                    buildArray(value, name);
                } else {
                    query.push(name + "=" + encodeURIComponent(value));
                }
            };
            buildArray = function (vars, prefix) {
                var i, len, name;
                for (i = 0, len = vars.length; i < len; i += 1) {
                    name = prefix ? prefix + "[" + i + "]" : i;
                    buildValue(name, vars[i]);
                }
            };
            buildDict = function (vars, prefix) {
                var k, name;
                for (k in vars) {
                    if (vars.hasOwnProperty(k)) {
                        name = prefix ? prefix + "[" + k + "]" : k;
                        buildValue(name, vars[k]);
                    }
                }
            };
            buildDict(vars, "");
            return query.join(sep || "&");
        },

        /**
         * Вспомогательные функции-заготовки
         *
         * @namespace go.Lang.f
         */
        'f': {
            /**
             * Функция, не делающая ничего
             *
             * @name go.Lang.f.empty
             * @return void
             */
            'empty': function () {
            },

            /**
             * Функция, просто возвращающая FALSE
             *
             * @name go.Lang.f.ffalse
             * @return {Boolean}
             */
            'ffalse': function () {
                return false;
            }
        },

        /**
         * @class go.Lang.Exception
         *        пользовательские "классы" исключений
         * @alias go.Lang.Exception.Base
         * @augments Error
         */
        'Exception': (function () {

            var Base, create;

            /**
             * Создание "класса" исключения
             *
             * @name go.Lang.Exception.create
             * @param {String} name
             *        название класса
             * @param {Function} [parent=Error]
             *        родительский класс (конструктор), по умолчанию - Error
             * @param {String} [defmessage]
             *        сообщение по умолчанию
             * @return {Function}
             */
            create = function (name, parent, defmessage) {
                var Exc, Fake;
                if ((!parent) && (typeof global.Error === "function")) {
                    parent = global.Error;
                }
                defmessage = defmessage || "";
                Exc = function Exc(message) {
                    this.name    = name;
                    this.message = message || defmessage;
                    this.stack = (new Error()).stack;
                    if (this.stack) {
                        /*jslint regexp: true */
                        this.stack = this.stack.replace(/^[^n]*\n/, ""); // @todo
                        /*jslint regexp: false */
                    }
                };
                if (parent) {
                    Fake = function () {};
                    Fake.prototype = parent.prototype;
                    Exc.prototype  = new Fake();
                    Exc.prototype.constructor = Exc;
                }
                return Exc;
            };

            /**
             * @class go.Lang.Exception.Base
             *        базовый "класс" исключений внутри библиотеки
             * @augments Error
             */
            Base = create("go.Exception");

            Base.create = create;
            Base.Base   = Base;

            return Base;
        }()),

        'Listeners': go.__Loader.Listeners,

        'eoc': null
    };

    return Lang;
});
