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
        loader;

    /**
     * Вызов go(), как функции - загрузка модуля
     *
     * @param {String} name
     *        имя модуля
     * @param {Array<String>} [reqs]
     *        список зависимостей
     * @param {Function} fmodule
     *        функция-конструктор модуля
     * @return {Function}
     */
    function go(name, reqs, fmodule) {
        if (name) {
            go.appendModule(name, reqs, fmodule);
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
     * @param {Array<String>} [reqs]
     *        список зависимостей
     * @param {Function} fmodule
     *        функция-конструктор модуля
     */
    go.appendModule = function (name, reqs, fmodule) {
        if (!fmodule) {
            fmodule = reqs;
            reqs = [];
        }
        loader.appendModule(name, reqs, fmodule);
    };

    /**
     * Класс загрузчиков модулей
     *
     * @class go.__Loader
     */
    go.__Loader = (function () {

        var LoaderPrototype, LoaderConstructor;

        LoaderPrototype = {

            /**
             * Контейнер в который записываются загруженные модули
             * (может быть переопределён у конкретного объекта)
             *
             * @name go.__Loader#container
             * @type {Object}
             * @private
             */
            'container': go,

            /**
             * Имя модуля => был ли запрос на его загрузку
             *
             * @name go.__Loader#reqs
             * @type {Object.<String, Boolean>}
             * @private
             */
            'reqs': null,

            /**
             * Имя модуля => был ли он создан и помещён в пространство имён
             *
             * @name go.__Loaders#loaded
             * @type {Object.<String, Boolead>}
             * @private
             */
            'created': null,

            /**
             * Имя модуля => список слушателей его загрузки
             *
             * Поля слушателя:
             * fn {Function} обработчик
             * l {Number} количество модулей, оставшихся на ожидании
             *
             * @name go.__Loaders#listeners
             * @type {Object.<String, Object>}
             * @private
             */
            'listeners': null,

            /**
             * @constructs
             * @name go.__Loaders#
             * @param {Object} [params]
             *        параметры могут перекрывать существующие свойства и метода объекта
             */
            '__construct': function (params) {
                var k;
                if (params) {
                    for (k in params) {
                        if (params.hasOwnProperty(k)) {
                            this[k] = params[k];
                        }
                    }
                }
                this.reqs = {};
                this.created = {};
                this.listeners = {};
            },

            /**
             * Подключить список модулей
             *
             * @name go.__Loader#include
             * @public
             * @param {(String|Array.<String>)} names
             *        имя модуля или список имён
             * @param {Function} [listener]
             *        обработчик загрузки всех модулей
             */
            'include': function (names, listener) {
                var i, len, name;
                if (typeof names === "string") {
                    names = [names];
                }
                for (i = 0, len = names.length; i < len; i += 1) {
                    name = names[i];
                    if (!this.reqs[name]) {
                        this.reqs[name] = true;
                        this.requestModule(name);
                    }
                }
                if (listener) {
                    this.addListener(names, listener);
                }
            },

            /**
             * Добавить слушатель на загрузку блока модулей
             *
             * @name go.__Loader#addListener
             * @public
             * @param {Array.<String>} names
             *        список имён модулей
             * @param {Function} listener
             *        обработчик, вызываемый после загрузки всех модулей из блока
             */
            'addListener': function (names, listener) {
                var L = {'l' : 0, 'fn' : listener},
                    name,
                    i,
                    len;
                for (i = 0, len = names.length; i < len; i += 1) {
                    name = names[i];
                    if (!this.created[name]) {
                        if (!this.listeners[name]) {
                            this.listeners[name] = [];
                        }
                        L.l += 1;
                        this.listeners[name].push(L);
                    }
                }
                if (L.l === 0) {
                    listener();
                }
            },

            /**
             * Добавить модуль в пространство имён
             *
             * @name go.__Loader#appendModule
             * @public
             * @param {String} name
             *        имя модуля
             * @param {Array.<String>} reqs
             *        список зависимостей
             * @param {Function} fmodule
             *        конструктор объекта модуля
             */
            'appendModule': function (name, reqs, fmodule) {
                var lreqs = [], i, len, _this = this, f;
                this.reqs[name] = true;
                if (reqs) {
                    for (i = 0, len = reqs.length; i < len; i += 1) {
                        if (!this.created[reqs[i]]) {
                            lreqs.push(reqs[i]);
                        }
                    }
                }
                f = function () {
                    _this.createModule(name, fmodule);
                    _this.onload(name);
                };
                if (lreqs.length > 0) {
                    this.include(lreqs, f);
                } else {
                    f();
                }
            },

            /**
             * Запрос на загрузку модуля
             *
             * @name go.__Loader#requestModule
             * @protected
             * @param {String} name
             */
            'requestModule': function (name) {
                var src = GO_DIR + name + ".js" + this._anticache;
                doc.write('<script type="text/javascript" src="' + src + '"></script>');
            },

            /**
             * Создать объект модуля в заданном пространстве имён
             *
             * @name go.__Loader#createModule
             * @protected
             * @param {String} name
             *        имя модуля
             * @param {Function} fmodule
             *        конструктор модуля
             */
            'createModule': function (name, fmodule) {
                this.container[name] = fmodule(go, global);
            },

            /**
             * Обработка события подключения модуля
             *
             * @name go.__Loader#onload
             * @private
             * @param {String} name
             */
            'onload': function (name) {
                var listeners = this.listeners[name], i, len, listener;
                this.created[name] = true;
                if (listeners) {
                    for (i = 0, len = listeners.length; i < len; i += 1) {
                        listener = listeners[i];
                        listener.l -= 1;
                        if (listener.l <= 0) {
                            listener.fn.call(global);
                        }
                    }
                }
            }
        };
        LoaderConstructor = function () {
            this.__construct.apply(this, arguments);
        };
        LoaderConstructor.prototype = LoaderPrototype;

        return LoaderConstructor;
    }());
    loader = new go.__Loader();

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

        loader._anticache = matches[2] || "";

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
        'bind': function (func, thisArg, args) {
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
        'getType': function (value) {
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
        'isArray': function (value, strict) {
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
        'isDict': function (value) {
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
        'each': function (iter, fn, thisArg, deep) {

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
        'copy': function (source) {
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
        'extend': function (destination, source, deep) {
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
        'merge': function (destination, source) {
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
         * Каррирование функции
         *
         * @name go.Lang.curry
         * @param {Function} fn
         *        исходная функция
         * @params {mixed} [arg1] ...
         *         запоминаемые аргументы
         * @return {Function}
         *         каррированная функция
         */
        'curry': function (fn) {
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
        'inArray': function (needle, haystack) {
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
        'tryDo': function (funcs) {
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
        'parseQuery': function (query, sep) {
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
        'buildQuery': function (vars, sep) {
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
         * Создание собственных "классов" исключений
         *
         * @name go.Lang.Exception
         * @type {Function}
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
             * Базовый "класс" исключений внутри библиотеки
             *
             * @name go.Lang.Exception.Base
             * @type {Function}
             */
            Base = create("go.Exception");

            Base.create = create;
            Base.Base   = Base;

            return Base;
        }()),

        'eoc': null
    };

    return Lang;
});
