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

var go = (function (global) {

    var VERSION = "1.0-beta",

        /**
         * http-адрес каталога в котором находится go.js и модули
         *
         * @var string
         */
        GO_DIR,

        doc = global.document,

        /**
         * Загрузчик модулей
         *
         * @var go.__Loader
         */
        loader;

    function go(name, reqs, fmodule) {
        if (name) {
            go.appendModule(name, reqs, fmodule);
        }
        return go;
    }
    go.VERSION = VERSION;

    /**
     * go.include(): инициирование загрузки нужных модулей
     * (только на этапе загрузки страницы)
     *
     * @param string[] names
     *        имя нужного модуля или список из нескольких имён
     * @param function listener [optional]
     *        обработчик загрузки всех указанных модулей
     */
    go.include = function (names, listener) {
        loader.include(names, listener);
    };

    /**
     * go.appendModule(): добавление модуля в пространство имён
     * (вызывается при определении модуля в соответствующем файле)
     *
     * @param string name
     *        имя модуля
     * @param list reqs [optional]
     * @param function fmodule
     *        функция-конструктор модуля
     */
    go.appendModule = function (name, reqs, fmodule) {
        if (!fmodule) {
            fmodule = reqs;
            reqs = [];
        }
        loader.appendModule(name, reqs, fmodule);
    };

    go.__Loader = (function () {

        var LoaderPrototype, LoaderConstructor;

        LoaderPrototype = {

            '__construct': function (params) {
                var k;
                if (params) {
                    for (k in params) {
                        if (params.hasOwnProperty(k)) {
                            this[k] = params[k];
                        }
                    }
                }
                this.reqs      = {};
                this.loaded    = {};
                this.created   = {};
                this.listeners = {};
            },

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

            'addListener': function (names, listener) {
                var L = {'l': 0, 'fn': listener},
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

            'appendModule': function (name, reqs, fmodule) {
                var lreqs = [], i, len, _this = this, f;
                this.reqs[name] = true;
                if (!reqs) {
                    reqs = [];
                }
                for (i = 0, len = reqs.length; i < len; i += 1) {
                    if (!this.created[reqs[i]]) {
                        lreqs.push(reqs[i]);
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

            'requestModule': function (name) {
                var src = GO_DIR + name + ".js";
                doc.write('<script type="text/javascript" src="' + src + '"></script>');
            },

            'createModule': function (name, fmodule) {
                go[name] = fmodule(go, global);
            },

            'onload': function (name) {
                var listeners = this.listeners[name], i, len, listener;
                this.created[name] = true;
                if (!listeners) {
                    return;
                }
                for (i = 0, len = listeners.length; i < len; i += 1) {
                    listener = listeners[i];
                    listener.l -= 1;
                    if (listener.l <= 0) {
                        listener.fn.call(global);
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

        var SRC_PATTERN = new RegExp("^(.*\\/)?go\\.js(#(.*?))?$"),
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
            }());
        }

        if (!matches) {
            throw new Error("go.js is not found in DOM");
        }

        GO_DIR = matches[1];

        if (matches[3]) {
            go.include(matches[3].split(","));
        }

    }());

    return go;
}(window));

/**
 * @subpackage Lang
 * @namespace go.Lang
 */
go("Lang", function (go, global) {

    var Lang = {

        /**
         * Связывание функции с контекстом и аргументами
         * Поведение аналогично Function.prototype.bind()
         * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
         *
         * Если для функции определён свой метод bind(), то используется он
         *
         * @namespace go.Lang
         * @method bind
         * @param function func
         *        функция
         * @param object thisArg [optional]
         *        контекст в котором функция должна выполняться
         *        по умолчанию - global
         * @param list args [optional]
         *        аргументы, вставляемые в начало вызова функции
         * @return function
         *         связанная с контекстом функция
         * @todo протестировать в IE
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
                return func.bind.apply(func, args);
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
         * Получение типа значения
         *
         * @param mixed value
         *        проверяемое значение
         * @return string
         *         название типа
         * @todo протестировать лучше
         */
        'getType': function (value) {
            var type = typeof value;
            if (type !== "object") {
                if ((type === "function") && value.go$type) {
                    return value.go$type;
                }
                return type;
            } else if (value === null) {
                return "null";
            } else if (value.go$type) {
                return value.go$type;
            } else if (value instanceof Array) {
                return "array";
            } else if (value.nodeType === 1) {
                return "element";
            } else if (value.nodeType === 3) {
                return "textnode";
            } else if (typeof value.length === "number") {
                if ('callee' in value) { // @todo
                    return "arguments";
                } else {
                    return "collection";
                }
            }
            return "object";
        },

        /**
         * Является ли значение массивом
         *
         * @param mixed value
         *        проверяемое значение
         * @param bool strict [optional]
         *        точная проверка - именно массивом
         *        по умолчанию - любая коллекция с порядковым доступом
         * @return bool
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
         * Является ли объект простым хэшем
         * Под хэшем здесь подразумевается любой объект, не имеющий более специфического типа
         *
         * @param object value
         * @return bool
         */
        'isHash': function (value) {
            return (value && (value.constructor === Object));
        },

        /**
         * Итерация объекта
         *
         * @param object iter
         *        итерируемый объект (или порядковый массив)
         * @param function(value, key, iter) fn
         *        тело цикла
         * @param object thisArg [optional]
         *        контект, в котором следует выполнять тело цикла
         * @param bool deep [optional]
         *        обходить ли прототипы
         * @return mixed
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
         * @param mixed source
         * @return mixed
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
         * @param object destination
         *        исходный объект (расширяется на месте)
         * @param object source
         *        источник новых свойств
         * @param bool deep [optional]
         *        обходить прототипы source
         * @return object
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
         * @param hash destination
         *        исходных объект (изменяется)
         * @param hash source
         *        источник новых свойств
         * @return hash
         *         расширенный destination
         */
        'merge': function (destination, source) {
            var k, value;
            for (k in source) {
                if (source.hasOwnProperty(k)) {
                    value = source[k];
                    if (Lang.isHash(value) && Lang.isHash(destination[k])) {
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
         * @param function fn
         *        исходная функция
         * @params mixed args ...
         *         запоминаемые аргументы
         * @return function
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
         * @param mixed needle
         *        значение
         * @param list haystack
         *        порядковый массив
         * @return bool
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
         * @param list funcs
         *        список функций
         * @return mixed
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
         * @param string query [optional]
         *        строка запроса (по умолчанию берётся из window.location)
         * @param string sep [optional]
         *        разделитель переменных (по умолчанию "&")
         * @return hash
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
         * @param hash vars
         *        набор переменных (или сразу строка)
         * @param string sep [optional]
         *        разделитель (по умолчанию "&")
         * @return string
         *         строка запроса
         */
        'buildQuery': function (vars, sep) {

            var query = [], buildValue, buildArray, buildHash;
            if (typeof vars === "string") {
                return vars;
            }
            buildValue = function (name, value) {
                if (Lang.isHash(value)) {
                    buildHash(value, name);
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
            buildHash = function (vars, prefix) {
                var k, name;
                for (k in vars) {
                    if (vars.hasOwnProperty(k)) {
                        name = prefix ? prefix + "[" + k + "]" : k;
                        buildValue(name, vars[k]);
                    }
                }
            };
            buildHash(vars, "");
            return query.join(sep || "&");
        },

        /**
         * Вспомогательные функции-заготовки
         */
        'f': {
            /**
             * Функция, не делающая ничего
             */
            'empty': function () {
            },

            /**
             * Функция, просто возвращающая FALSE
             */
            'ffalse': function () {
                return false;
            }
        },

        /**
         * Создание собственных "классов исключений"
         */
        'Exception': (function () {

            var Base, create;

            create = function (name, parent) {
                var Exc, Fake;
                if ((!parent) && (typeof global.Error === "function")) {
                    parent = global.Error;
                }
                Exc = function Exc(message) {
                    this.name    = name;
                    this.message = message;
                    this.stack = (new Error()).stack;
                    if (this.stack) {
                        this.stack = this.stack.replace(/^.*?\n/, ""); // @todo
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
            Base = create("go.Exception");

            Base.create = create;
            Base.Base   = Base;

            return Base;
        }()),

        'eoc': null
    };

    return Lang;
});
