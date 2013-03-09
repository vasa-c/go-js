/**
 * go.js: библиотека для упрощения некоторых вещей в JavaScript
 *
 * В данном файле определяется только ядро библиотеки и модуль go.Lang.
 * Остальные модули располагаются в других файлах.
 *
 * @package go.js
 * @author  Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @version 2.0-beta
 * @license MIT (http://www.opensource.org/licenses/mit-license.php)
 * @link    https://github.com/vasa-c/go-js
 */
/*jslint nomen: true, es5: true, todo: true */
/*global window */

/**
 * @namespace go
 */
var go = (function (global) {
    "use strict";

    var VERSION = "2.0-beta",

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
         * @type {String}
         */
        anticache;

    /**
     * Вызов go(), как функции - загрузка модуля
     *
     * @param {String} name
     *        имя модуля
     * @param {(Array.<String>|String)} [deps]
     *        список зависимостей
     * @param {Function} CModule
     *        функция-конструктор модуля
     * @return {Function}
     */
    function go(name, deps, CModule) {
        if (name) {
            go.appendModule(name, deps, CModule);
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
    go.VERSION = VERSION;

    /**
     * Инициирование загрузки нужных модулей
     * (только на этапе загрузки страницы)
     *
     * @name go.include
     * @public
     * @param {(String|Array.<String>)} names
     *        имя нужного модуля или список из нескольких имён
     * @param {Function} [listener]
     *        обработчик загрузки всех указанных модулей
     */
    go.include = function (names, listener) {
        loader.include(names, listener);
    };

    /**
     * Добавление модуля в пространство имён
     * (вызывается при определении модуля в соответствующем файле)
     *
     * @name go.appendModule
     * @public
     * @param {String} name
     *        имя модуля
     * @param {(Array.<String>|String)} [deps]
     *        список зависимостей
     * @param {Function} CModule
     *        функция-конструктор модуля
     */
    go.appendModule = function (name, deps, CModule) {
        if (!CModule) {
            CModule = deps;
            deps = [];
        }
        loader.loaded(name, deps, CModule);
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
             * @param {Function(String)} includer
             *        внешняя функция, инициирующая запрос на загрузку модуля (получает аргументом название)
             * @param {Function(String, *)} creator
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
             * @type {Function(String)}
             */
            'includer': null,

            /**
             * См. конструктор
             * @name go.__Loader#creator
             * @private
             * @type {Function(String, *)}
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
             * @name go.__Loader#modules
             * @private
             * @type {Object.<String, Object>}
             */
            'modules': null
        };
        return Loader;
    }());

    go.__Loader.Listeners = {

        /**
         * Создание простого слушателя
         *
         * @name go.Lang.Listeners.create
         * @public
         * @param {(Function|Array.<Function>)} [handlers]
         *        привязанный к слушателю обработчики или список обработчиков
         * @return {go.Lang.Listeners.Listener}
         *         объект слушателя
         */
        'create': (function () {

            var ping, append, remove;

            /**
             * Вызов слушателя
             *
             * @name go.Lang.Listeners.Listener#ping
             * @public
             * @return void
             */
            ping = function ping() {
                this.apply(null, arguments);
            };

            /**
             * Добавить обработчик к слушателю
             *
             * @name go.Lang.Listeners.Listener#append
             * @public
             * @param {Function} handler
             *        обработчик
             * @param {Boolean} [check]
             *        проверять на наличие
             * @return {Number}
             *         ID установленного обработчика
             */
            append = function append(handler, check) {
                var handlers = this._handlers,
                    len,
                    i;
                if (check) {
                    for (i = 0, len = handlers.length; i < len; i += 1) {
                        if (handlers[i] === handler) {
                            return i;
                        }
                    }
                }
                handlers.push(handler);
                return handlers.length - 1;
            };

            /**
             * Удалить обработчик из слушателя
             *
             * @name go.Lang.Listeners.Listener#remove
             * @public
             * @param {(Function|Number)} handler
             *        функция-обработчик или её ID
             * @param {Boolean} [all]
             *        удалять все одинаковые функции (по умолчанию, только первую найденную)
             * @return {Boolean}
             *         был ли обработчик найден и удалён
             */
            remove = function remove(handler, all) {
                var handlers = this._handlers,
                    len,
                    i,
                    removed = false;
                if (typeof handler === "function") {
                    for (i = 0, len = handlers.length; i < len; i += 1) {
                        if (handlers[i] === handler) {
                            handlers[i] = null;
                            removed = true;
                            if (!all) {
                                break;
                            }
                        }
                    }
                } else {
                    if (handlers[handler]) {
                        handlers[handler] = null;
                        removed = true;
                    }
                }
                return removed;
            };

            /**
             * @alias go.Lang.Listeners.create
             */
            function create(handlers) {
                var listener;

                if (typeof handlers === "function") {
                    handlers = [handlers];
                } else if (!handlers) {
                    handlers = [];
                }

                listener = function () {
                    var handler,
                        len = handlers.length,
                        i;
                    for (i = 0; i < len; i += 1) {
                        handler = handlers[i];
                        if (handler) {
                            handler.apply(null, arguments);
                        }
                    }
                };

                listener._handlers = handlers;
                listener.ping = ping;
                listener.append = append;
                listener.remove = remove;

                return listener;
            }

            return create;
        }()),

        /**
         * Создать слушатель-счётчик
         *
         * @name go.Lang.Listeners.createCounter
         * @public
         * @param {Number} count
         * @param {Function} handler
         * @return {(Function|go.Lang.Listeners.Counter)}
         */
        'createCounter': (function () {

            var inc, filled;

            /**
             * Увеличить счётчик
             *
             * @name go.Lang.Listeners.Counter#inc
             * @public
             * @param {Number} [i=1]
             * @return {Number}
             */
            inc = function inc(i) {
                if (this._count !== 0) {
                    this._count += (i || 1);
                }
                return this.count;
            };

            /**
             * Обозначить счётчик заполненным
             *
             * @name go.Lang.Listeners.Counter#filled
             * @public
             * @return {Boolean}
             *         сработал счётчик или нет
             */
            filled = function filled() {
                if (typeof this._count !== "number") {
                    this._count = 0;
                    this._handler.apply(null);
                    return true;
                }
                return false;
            };

            /**
             * @alias go.Lang.Listeners.createCounter
             */
            function createCounter(count, handler) {
                if (typeof count === "string") {
                    count = parseInt(count, 10) || 0;
                }
                if (count === 0) {
                    handler();
                }
                function Counter() {
                    if (Counter._count > 0) {
                        Counter._count -= 1;
                        if (Counter._count === 0) {
                            Counter._handler.apply(null);
                        }
                    }
                }
                Counter._count = count;
                Counter._handler = handler;
                Counter.inc = inc;
                Counter.filled = filled;
                return Counter;
            }

            return createCounter;
        }())
    };

    /**
     * Запрос на подключение JS-файла
     *
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

    /**
     * Вывод отладочной информации, если есть куда
     *
     * @name go.log
     * @public
     */
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
go("Lang", function (go, global, undefined) {
    "use strict";
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
         * @public
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
            if (typeof func.bind === "function") {
                if (args) {
                    args = [thisArg].concat(args);
                } else {
                    args = [thisArg];
                }
                result = func.bind.apply(func, args);
            } else if (args) {
                result = function binded() {
                    return func.apply(thisArg, args.concat(Array.prototype.slice.call(arguments, 0)));
                };
            } else {
                result = function binded() {
                    return func.apply(thisArg, arguments);
                };
            }
            return result;
        },

        /**
         * Получение расширенного типа значения
         *
         * @name go.Lang.getType
         * @public
         * @param {*} value
         *        проверяемое значение
         * @return {String}
         *         название типа
         */
        'getType': function getType(value) {
            var type, w;

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

            if (!getType._str) {
                getType._str = {
                    '[object Function]' : "function",
                    '[object Array]'    : "array",
                    '[object RegExp]'   : "regexp",
                    '[object Error]'    : "error",
                    '[object Date]'     : "date",
                    '[object HTMLCollection]' : "collection",
                    '[object NodeList]' : "collection",
                    '[object Text]'     : "textnode",
                    '[object Arguments]': "arguments",
                    '[object Number]'   : "number",
                    '[object String]'   : "string",
                    '[object Boolean]'  : "boolean"
                };
            }

            type = Object.prototype.toString.call(value);
            type = getType._str[type];
            if (type) {
                return type;
            }

            if (value.constructor) {
                w = global;
                if (value instanceof Array) {
                    return "array";
                }
                if (global.HTMLElement) {
                    if (value instanceof w.HTMLElement) {
                        return "element";
                    }
                } else {
                    if (value.nodeType === 1) {
                        return "element";
                    }
                }
                if (w.Text && (value instanceof w.Text)) {
                    return "textnode";
                }
                if (w.HTMLCollection && (value instanceof w.HTMLCollection)) {
                    return "collection";
                }
                if (w.NodeList && (value instanceof w.NodeList)) {
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
         * @public
         * @param {mixed} value
         *        проверяемое значение
         * @param {Boolean} [strict=false]
         *        точная проверка - именно массивом
         *        по умолчанию - любая коллекция с порядковым доступом
         * @return {Boolean}
         *         является ли значение массивом
         */
        'isArray': function isArray(value, strict) {
            if (Array.isArray) {
                if (Array.isArray(value)) {
                    return true;
                }
                if (strict) {
                    return false;
                }
            }
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
         * То есть любым объектом, не имеющим более специфического типа.
         *
         * @name go.Lang.isDict
         * @public
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
         * @public
         * @param {(Object|Array)} iter
         *        итерируемый объект (или порядковый массив)
         * @param {Function(value, key, iter)} fn
         *        тело цикла
         * @param {Object} [thisArg=global]
         *        контект, в котором следует выполнять тело цикла
         * @param {Boolean} [deep=false]
         *        обходить ли прототипы
         * @return {(Object|Array)}
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
         * @public
         * @param {(Object|Array)} source
         *        исходный объект
         * @return {(Object|Array)}
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
         * @public
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
         * @public
         * @param {Object} destination
         *        исходный объект (изменяется)
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
         * @public
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
         * @public
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
         * @public
         * @param {Function} fn
         *        исходная функция
         * @param {* ...} [args]
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
         * @public
         * @param {mixed} needle
         *        значение
         * @param {Array} haystack
         *        порядковый массив
         * @return {Boolean}
         *         находится ли значение в массиве
         */
        'inArray': function inArray(needle, haystack) {
            var i, len;
            if (Array.prototype.indexOf) {
                return (Array.prototype.indexOf.call(haystack, needle) !== -1);
            }
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
         * @public
         * @param {Array.<Function>} funcs
         *        список функций
         * @return {*}
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
         * @public
         * @param {String} [query=window.location]
         *        строка запроса
         * @param {String} [sep="&"]
         *        разделитель переменных
         * @return {Object}
         *         переменные из запроса
         */
        'parseQuery': function parseQuery(query, sep) {
            var result = {}, i, len, v;
            if (query === undefined) {
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
         * @public
         * @param {(Object|String)} vars
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
             * @public
             * @return void
             */
            'empty': function () {
            },

            /**
             * Функция, просто возвращающая FALSE
             *
             * @name go.Lang.f.ffalse
             * @public
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
