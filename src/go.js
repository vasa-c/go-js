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

/**
 * @namespace go
 */
var go = (function (global) {
    "use strict";

    var go = {
            'VERSION': "2.0-beta"
        },

        /**
         * Http-адрес каталога в котором находится go.js и модули
         *
         * @type {String}
         */
        ROOT_DIR,

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
    go.include = function include(names, listener) {
        loader.include(names, listener);
    };

    /**
     * Добавление модуля в пространство имён
     * (вызывается при определении модуля в соответствующем файле)
     *
     * @name go.module
     * @public
     * @param {String} name
     *        имя модуля
     * @param {(Array.<String>|String)} [deps]
     *        список зависимостей
     * @param {Function} CModule
     *        функция-конструктор модуля
     */
    go.module = function module(name, deps, CModule) {
        if (!CModule) {
            CModule = deps;
            deps = [];
        }
        loader.loaded(name, deps, CModule);
    };

    /**
     * Получить каталог в котором находится go.js
     *
     * @name go.getRootDir
     * @public
     * @return {String}
     */
    go.getRootDir = function getRootDir() {
        return ROOT_DIR;
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
             * @param {Function} includer
             *        внешняя функция, инициирующая запрос на загрузку модуля: Function(String name)
             * @param {Function} creator
             *        внешнаяя функция, создающая модуль: Function(String name, * data)
             */
            '__construct': function (includer, creator) {
                this.includer = includer;
                this.creator  = creator;
                this.modules  = {};
                this.preloaded = {};
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
                        if (this.preloaded[name]) {
                            this.loaded.apply(this, this.preloaded[name]);
                            module = this.modules[name];
                            this.preloaded[name] = null;
                        } else {
                            includer(name);
                        }
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
             * Предварительная загрузка модуля
             *
             * @name go.__Loader#preload
             * @public
             * @param {String} name
             * @param {Array.<String>} deps
             * @param {*} data
             */
            'preload': function (name, deps, data) {
                if (!this.preloaded.hasOwnProperty(name)) {
                    this.preloaded[name] = [name, deps, data];
                }
            },

            /**
             * Создать все предварительно загруженные модули
             *
             * @name go.__Loader#createPreloaded
             * @public
             * @return void
             */
            'createPreloaded': function () {
                var preloaded = this.preloaded,
                    name;
                for (name in preloaded) {
                    if (preloaded.hasOwnProperty(name)) {
                        if (preloaded[name]) {
                            this.loaded.apply(this, preloaded[name]);
                        }
                    }
                }
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
            'modules': null,

            /**
             * Предзагруженные модули
             *
             * Имя модуля => [name, deps, data]
             * После нормальной загрузки => null
             *
             * @name go.__Loader#preloaded
             * @private
             * @type {Object.<String, Object>}
             */
            'preloaded': null
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
            go.__Loader.includeJSFile(ROOT_DIR + name + ".js" + anticache);
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

        ROOT_DIR = matches[1];

        anticache = matches[2] || "";

        if (matches[4]) {
            go.include(matches[4].split(","));
        }

    }());

    return go;
}(this));

/*jslint unparam: true */
/**
 * @namespace go.Lang
 */
go.module("Lang", function (go, global, undefined) {
    "use strict";
    /*jslint unparam: false */

    var Lang,
        nativeObject = global.Object,
        nativeToString = nativeObject.prototype.toString,
        nativeSlice = Array.prototype.slice,
        nativeIsArray = Array.isArray,
        nativeGetPrototypeOf = nativeObject.getPrototypeOf,
        nativeKeys = Object.keys,
        nativeMap = Array.prototype.map;

    Lang = {

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
                    return func.apply(thisArg, args.concat(nativeSlice.call(arguments, 0)));
                };
            } else {
                result = function binded() {
                    return func.apply(thisArg, arguments);
                };
            }
            return result;
        },

        /**
         * Связывание метода по имени.
         *
         * Допускает отсутствие метода в момент связывания.
         *
         * @name go.Lang.bindMethod
         * @public
         * @param {Object} context
         *        объект, содержащий метод
         * @param {String} methodName
         *        имя метода
         * @param {Array} [args]
         *        аргументы, вставляемые в начало вызова функции
         * @return {Function}
         *         связанная функция
         */
        'bindMethod': function bindMethod(context, methodName, args) {
            var f;
            if (args && args.length) {
                f = function bindedMethod() {
                    return context[methodName].apply(context, args.concat(nativeSlice.call(arguments)));
                };
            } else {
                f = function bindedMethod() {
                    return context[methodName].apply(context, arguments);
                };
            }
            return f;
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
            var type, name;

            if (value && (typeof value.go$type === "string")) {
                return value.go$type;
            }

            /* typeof отсеивает основные типы */
            type = typeof value;
            if ((type !== "object") && (type !== "function")) {
                /* function - иногда это может быть регулярка в Chrome или HTMLCollection в Safari */
                return type;
            }

            /* typeof null === "object" */
            if (value === null) {
                return "null";
            }

            /* Определяем тип по строковому представлению */
            if (!getType._str) {
                getType._str = {
                    '[object Function]' : "function",
                    '[object Array]'    : "array",
                    '[object RegExp]'   : "regexp",
                    '[object Error]'    : "error",
                    '[object Date]'     : "date",
                    '[object Text]'     : "textnode",
                    '[object Arguments]': "arguments",
                    '[object Number]'   : "number",
                    '[object String]'   : "string",
                    '[object Boolean]'  : "boolean",
                    '[object NodeList]' : "collection",
                    '[object HTMLCollection]': "collection"
                };
            }
            name = nativeToString.call(value);
            type = getType._str[name];
            if (type) {
                return type;
            }

            /* DOM-элементы имеют представление [object HTML{tag}Element] */
            if (name.indexOf("[object HTML") === 0) {
                return "element";
            }

            /* Все основные браузеры здесь уже определились. Остался IE < 9 */
            if (!(value instanceof Object)) {
                /* host-объект из IE<9 или объект из другого фрейма */
                if (value.nodeType === 1) {
                    return "element";
                }
                if (value.nodeType === 3) {
                    return "textnode";
                }
                if (value.item) {
                    /* collection имеет свойство item, но оно не итерируемое */
                    /*jslint forin: true */
                    for (name in value) {
                        if (name === "item") {
                            break;
                        }
                    }
                    /*jslint forin: false */
                    if (name !== "item") {
                        return "collection";
                    }
                }
                if ((value + ":").indexOf("function") !== -1) {
                    /* Идентификация host-функции в старых IE (typeof === "object") по строковому представлению
                     * Также у них нет toString(), так что складываем со строкой.
                     * Сложение с пустой строкой не нравится JSLint
                     */
                    return "function";
                }
            }

            if (typeof value.length === "number") {
                /* arguments имеет свойство number, но оно не итерируемое */
                /*jslint forin: true */
                for (name in value) {
                    if (name === "length") {
                        return "object";
                    }
                }
                /*jslint forin: false */
                return "arguments";
            }

            return "object";
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
            if ((!value) || (typeof value !== "object")) {
                /* Сразу отсеить по typeof. (!value) требуется, так как typeof null === "object" */
                return false;
            }

            if (value.constructor === Object) {
                if (nativeGetPrototypeOf && (nativeGetPrototypeOf(value) !== Object.prototype)) {
                    /* Случай с переопределённым прототипом и не восстановленным constructor */
                    return false;
                }
                return true;
            }

            if (value instanceof Object) {
                /* value из нашего фрейма, значит constructor должен был быть Object */
                return false;
            }
            if (nativeGetPrototypeOf) {
                /* value не из нашего фрейма, можно выкрутиться с помощью getPrototypeOf, так как у прототипа объекта прототип - null */
                value = Object.getPrototypeOf(value);
                if (!value) {
                    return false;
                }
                return (Object.getPrototypeOf(value) === null);
            }

            /**
             * Все нормальные браузеры на этот момент уже определились.
             * Остались только IE<9 и значения пришедшие из фреймов.
             * Пытаемся определить по имени конструктора.
             *
             * В IE нет constructor.name, приходится заниматься разбором строкового представления.
             * toString() тоже может не быть, да ещё и могут выбрасываться исключения.
             *
             * Определить объект с уничтоженным прототипом в IE<9 не получается.
             */
            try {
                return ((value.constructor + ":").indexOf("function Object()") !== -1);
            } catch (e) {
                return false;
            }

            return false;
        },

        /**
         * Является ли значение массивом
         *
         * @name go.Lang.isArray
         * @public
         * @param {*} value
         *        проверяемое значение
         * @param {Boolean} [strict=false]
         *        точная проверка - именно массивом
         *        по умолчанию - любая коллекция с порядковым доступом
         * @return {Boolean}
         *         является ли значение массивом
         */
        'isArray': function isArray(value, strict) {
            if (nativeIsArray) {
                if (nativeIsArray(value)) {
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
         * Приведение значения к виду массива
         *
         * @name go.Lang.toArray
         * @public
         * @param {*} value
         * @return {Array}
         */
        'toArray': function toArray(value) {
            var len, i, result;
            switch (Lang.getType(value)) {
            case "array":
                return value;
            case "arguments":
                return nativeSlice.call(value, 0);
            case "collection":
                result = [];
                for (i = 0, len = value.length; i < len; i += 1) {
                    result.push(value[i]);
                }
                return result;
            case "undefined":
            case "null":
                return [];
            case "object":
                if (!Lang.isDict(value)) {
                    return [value];
                }
                result = [];
                for (i in value) {
                    if (value.hasOwnProperty(i)) {
                        result.push(value[i]);
                    }
                }
                return result;
            default:
                return [value];
            }
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
         * Получить собственные ключи объекта
         *
         * @name go.Lang.getObjectKeys
         * @public
         * @param {Object} object
         * @return {Array}
         */
        'getObjectKeys': function (object) {
            var k, keys;
            if (nativeKeys) {
                return nativeKeys(object);
            }
            keys = [];
            for (k in object) {
                if (object.hasOwnProperty(k)) {
                    keys.push(k);
                }
            }
            return keys;
        },

        /**
         * Обход элементов объекта
         *
         * @name go.Lang.each
         * @public
         * @param {(Object|Array)} items
         *        итерируемый объект (или порядковый массив)
         * @param {Function} callback
         *        тело цикла (value, key, iter)
         * @param {Object} [thisArg=global]
         *        контекст, в котором следует выполнять тело цикла
         * @param {Boolean} [deep=false]
         *        обходить ли прототипы
         * @return {(Object|Array)}
         *         результаты выполнения функции для всех элементов
         */
        'each': function each(items, callback, thisArg, deep) {
            var result, i, len;
            thisArg = thisArg || global;
            if (Lang.isArray(items)) {
                if (nativeMap) {
                    return nativeMap.call(items, callback, thisArg);
                }
                result = [];
                for (i = 0, len = items.length; i < len; i += 1) {
                    result.push(callback.call(thisArg, items[i], i, items));
                }
            } else {
                result = {};
                /*jslint forin: true */
                for (i in items) {
                    if (items.hasOwnProperty(i) || deep) {
                        result[i] = callback.call(thisArg, items[i], i, items);
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
                result = Lang.extend({}, source, false);
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
         * Простое наследование конструкторов
         *
         * @name go.Lang.inherit
         * @public
         * @param {Function} [Constr]
         *        функция-конструктор (по умолчанию создаётся пустая)
         * @param {Function} [Parent]
         *        конструктор-предок (по умолчанию Object)
         * @param {Object} [extend]
         *        список свойств для расширения прототипа
         * @return {Function}
         *         конструктор-наследник
         */
        'inherit': (function () {
            var inherit,
                nativeCreate,
                Fake;
            nativeCreate = nativeObject.create;
            if (!nativeCreate) {
                Fake = function () {};
            }
            return function inherit(Constr, Parent, extend) {
                var proto;
                Constr = Constr || function EmptyConstructor() {};
                Parent = Parent || nativeObject;
                if (nativeCreate) {
                    proto = nativeCreate(Parent.prototype);
                } else {
                    Fake.prototype = Parent.prototype;
                    proto = new Fake();
                }
                if (extend) {
                    proto = Lang.extend(proto, extend);
                }
                proto.constructor = Constr;
                Constr.prototype = proto;
                return Constr;
            };
        }()),

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
            },

            /**
             * Функция, просто возвращающая TRUE
             *
             * @name go.Lang.f.ftrue
             * @public
             * @return {Boolean}
             */
            'ftrue': function () {
                return true;
            },

            /**
             * Функция, возвращающая полученное значение
             *
             * @name go.Lang.f.identity
             * @public
             * @param {*} value
             * @return {*}
             */
            'identity': function (value) {
                return value;
            },

            /**
             * Возвращает функцию, которая будет вызвана только один раз
             *
             * @name go.Lang.f.once
             * @public
             * @param {Function} f
             *        исходная функция
             * @return {Function}
             */
            'once': function (f) {
                var called = false, result;
                return function () {
                    if (called) {
                        return result;
                    }
                    result = f.apply((this || global), arguments);
                    called = true;
                    return result;
                };
            },

            /**
             * Композиция функций
             *
             * @example f = compose([f1, f2, f3]); f(value); // (f1(f2(f3(value)))
             *
             * @name go.Lang.f.compose
             * @public
             * @param {Array} funcs
             * @param {Object} [context]
             * @return {Function}
             */
            'compose': function (funcs, context) {
                var len = funcs.length;
                if (len === 0) {
                    return Lang.f.identity;
                }
                return function () {
                    var i, value;
                    value = funcs[0].apply(context, arguments);
                    for (i = 1; i < len; i += 1) {
                        value = funcs[i].call(context, value);
                    }
                    return value;
                };
            }
        },

        'Listeners': go.__Loader.Listeners,

        'eoc': null
    };

    /**
     * @class go.Lang.Exception
     *        пользовательские "классы" исключений
     * @alias go.Lang.Exception.Base
     * @augments Error
     */
    Lang.Exception = (function () {

        var Base,
            create,
            Block,
            isFileName = (Error.prototype.fileName !== undefined), // Firefox
            inherit = Lang.inherit;

        /**
         * Создание пользовательского "класса" исключения
         *
         * @name go.Lang.Exception.create
         * @param {String} name
         *        название класса
         * @param {Function} [parent]
         *        родительский класс (конструктор), по умолчанию - go.Exception
         * @param {String} [defmessage]
         *        сообщение по умолчанию
         * @return {Function}
         *         конструктор пользовательского исключения
         */
        create = function create(name, parent, defmessage) {
            var Exception,
                regexp;

            parent = parent || Base;
            defmessage = defmessage || "";

            Exception = function Exception(message) {
                var e = new Error(),
                    matches;
                this.stack = e.stack;
                this.name    = name;
                this.message = (message !== undefined) ? message : defmessage;
                if (isFileName) {
                    if (!regexp) {
                        regexp = new RegExp("^.*\n.*@(.*):(.*)\n");
                    }
                    matches = regexp.exec(e.stack + "\n");
                    if (matches) {
                        this.fileName = matches[1];
                        this.lineNumber = parseInt(matches[2], 10);
                    }
                }
            };
            return inherit(Exception, parent);
        };

        /**
         * @constructor
         *
         * @name go.Lang.Exception.Block
         * @param {Object} exceptions
         *        список исключений. "name" => [parent, defmessage]
         * @param {String} [ns]
         *        имя пространства имён
         * @param {(Function|String|Boolean)} [base]
         *        базовое исключение
         * @param {Boolean} [lazy]
         *        отложенное создание
         * @return {Object}
         *         пространство имён с исключениями
         */
        Block = function Block(exceptions, ns, base, lazy) {
            this._exceptions = exceptions;
            this._ns = ns ? ns + "." : "";
            if (base === false) {
                base = Base;
            } else if (typeof base !== "function") {
                if (typeof base !== "string") {
                    base = "Base";
                }
                this[base] = create(this.ns + base, Base, ns + " base exception");
                base = this[base];
            }
            this._base = base;
            if (!lazy) {
                this.createAll();
            }
        };

        /**
         * Получить объект исключения из блока
         *
         * @name go.Lang.Exception.Block#get
         * @public
         * @param {String} name
         * @return {Function}
         */
        Block.prototype.get = function get(name) {
            var parent, message, exception;
            if (this.hasOwnProperty(name)) {
                return this[name];
            }
            parent = this._exceptions[name];
            if ((typeof parent === "object") && parent) {
                message = parent[1];
                parent = parent[0];
            }
            if (parent === undefined) {
                return null;
            }
            switch (typeof parent) {
            case "function":
                break;
            case "string":
                parent = this.get(parent);
                break;
            default:
                parent = this._base;
            }
            exception = create(this._ns + name, parent, message);
            this[name] = exception;
            return exception;
        };

        /**
         * Выбросить исключение из блока
         *
         * @name go.Lang.Exception.Block#raise
         * @public
         * @param {String} name
         * @param {String} [message]
         * @throws {Error}
         */
        Block.prototype.raise = function raise(name, message) {
            var E = this.get(name);
            throw new E(message);
        };

        /**
         * Создать все объекты исключений
         *
         * @name go.Lang.Exception.Block#createAll
         * @public
         * @return {void}
         */
        Block.prototype.createAll = function createAll() {
            var exceptions = this._exceptions,
                name;
            for (name in exceptions) {
                if (exceptions.hasOwnProperty(name)) {
                    this.get(name);
                }
            }
        };

        /**
         * @class go.Lang.Exception.Base
         *        базовый "класс" исключений внутри библиотеки
         * @augments Error
         */
        Base = create("go.Exception", Error);
        Base.Base = Base;
        Base.create = create;
        Base.Block = Block;

        return Base;
    }());

    return Lang;
});
