/**
 * go.js: library for simplify some things in javascript
 *
 * This file contains only core and basic part of module go.Lang.
 * Other modules are located in other files.
 *
 * @package go.js
 * @author Grigoriev Oleg aka vasa_c <go.vasac@gmail.com>
 * @version 2.0-beta
 * @license http://www.opensource.org/licenses/mit-license.php MIT
 * @link https://github.com/vasa-c/go-js repository
 * @link https://github.com/vasa-c/go-js/wiki documentation
 */

/*global go:true */

var go = (function (global) {
    "use strict";

    var go = {
            'VERSION': "2.0-beta"
        },

        /**
         * Http-address directory of go.js and modules
         *
         * @type {String}
         */
        ROOT_DIR,

        /**
         * @type {Document}
         */
        doc = global.document,

        /**
         * Loader of modules
         *
         * @type {go.__Loader}
         */
        loader,

        /**
         * String for anticache
         *
         * @type {String}
         */
        anticache;

    /**
     * Initiating loading necessary modules
     * (step of loading page only)
     *
     * @name go.include
     * @public
     * @param {(String|Array.<String>)} names
     *        module name (String) or list of names (Array.String)
     * @param {Function} [listener]
     *        handler has finished loading all the modules
     */
    go.include = function include(names, listener) {
        loader.include(names, listener);
    };

    /**
     * Adding the module to the namespace
     * (calling when the module definition)
     *
     * @name go.module
     * @public
     * @param {String} name
     *        module name
     * @param {(Array.<String>|String)} [deps]
     *        dependency list
     * @param {Function} CModule
     *        function-constructor of module
     */
    go.module = function module(name, deps, CModule) {
        if (!CModule) {
            CModule = deps;
            deps = [];
        }
        loader.loaded(name, deps, CModule);
    };

    /**
     * Get http-address of directory of go.js
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
     *        loader for modules
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
             *        external function that initiates the request to load the module: Function(String name)
             * @param {Function} creator
             *        external function that creates a module: Function(String name, * data)
             */
            '__construct': function (includer, creator) {
                this.includer = includer;
                this.creator  = creator;
                this.modules  = {};
                this.preloaded = {};
            },

            /**
             * Request for including module
             *
             * @name go.__Loader#include
             * @public
             * @param {(String|Array.<String>)} names
             *        module name or list of names
             * @param {Function} [listener]
             *        handler has finished loading all the modules from list
             */
            'include': function (names, listener) {
                /* jshint maxstatements: 30 */
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
             * Processing of data loading module
             *
             * @name go.__Loader#loaded
             * @public
             * @param {String} name
             *        module name
             * @param {Array.<String>} deps
             *        dependency list
             * @param {*} data
             *        data of module
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
             * Module pre-loading
             *
             * @name go.__Loader#preload
             * @public
             * @param {String} name
             *        module name
             * @param {Array.<String>} deps
             *        dependency list
             * @param {*} data
             *        data of module
             */
            'preload': function (name, deps, data) {
                if (!this.preloaded.hasOwnProperty(name)) {
                    this.preloaded[name] = [name, deps, data];
                }
            },

            /**
             * Create all preloaded modules
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
             * @see __construct
             * @name go.__Loader#includer
             * @private
             * @type {Function(String)}
             */
            'includer': null,

            /**
             * @see __construct
             * @name go.__Loader#creator
             * @private
             * @type {Function(String, *)}
             */
            'creator': null,

            /**
             * Statuses and parameters of modules
             * name => parameters
             *
             * If a record exists, then the load request is sent
             * field "created"  - module is created
             * field "listener" - handler of creating module
             *
             * @name go.__Loader#modules
             * @private
             * @type {Object.<String, Object>}
             */
            'modules': null,

            /**
             * Preloaded modules
             *
             * name => [name, deps, data]
             * After normal loading => null
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
         * Create simple listener
         *
         * @name go.Lang.Listeners.create
         * @public
         * @param {(Function|Array.<Function>)} [handlers]
         *        tied to the listener handlers or list of handlers
         * @return {go.Lang.Listeners.Listener}
         *         listener object
         */
        'create': (function () {

            var ping, append, remove;

            /**
             * Call listener
             *
             * @name go.Lang.Listeners.Listener#ping
             * @public
             * @return void
             */
            ping = function ping() {
                this.apply(null, arguments);
            };

            /**
             * Append handler to listener
             *
             * @name go.Lang.Listeners.Listener#append
             * @public
             * @param {Function} handler
             *        handler
             * @param {Boolean} [check]
             *        check whether it has already
             * @return {Number}
             *         handler ID
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
             * Remove handler from listener
             *
             * @name go.Lang.Listeners.Listener#remove
             * @public
             * @param {(Function|Number)} handler
             *        handler-function or its ID
             * @param {Boolean} [all]
             *        delete all the same functions (by default, only the first found)
             * @return {Boolean}
             *         handler was found and removed
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
         * Create listener-counter
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
             * Increase the counter
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
             * Mark the counter as filled
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
     * Request on including JS-file
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
     * Debug out
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
     * Core init
     * - define ROOT_DIR
     * - include modules from url
     *
     * @todo optimize and test for different URL
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

/**
 * @namespace go.Lang
 */
go.module("Lang", null, function (go, global, undefined) {
    "use strict";

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
         * Binding of function with arguments and context
         * The behavior is similar Function.prototype.bind()
         * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
         *
         * If defined func.bind() then use it
         *
         * @name go.Lang.bind
         * @public
         * @param {Function} func
         *        original function
         * @param {Object} [thisArg]
         *        execution context (global by default)
         * @param {Array} [args]
         *        arguments to prepend to calling arguments
         * @return {Function}
         *         bounded function
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
         * Binding method by name
         *
         * The method can not exist when the binding.
         *
         * @name go.Lang.bindMethod
         * @public
         * @param {Object} context
         *        object, owner of the method
         * @param {String} methodName
         *        method name
         * @param {Array} [args]
         *        arguments to prepend to calling arguments
         * @return {Function}
         *         bounded function
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
         * Getting extended type of value
         *
         * @name go.Lang.getType
         * @public
         * @param {*} value
         *        value to test
         * @return {String}
         *         name of type
         */
        'getType': function getType(value) {
            /* jshint maxstatements: 50, maxcomplexity: 25 */
            var type, name;

            if (value && (typeof value.go$type === "string")) {
                return value.go$type;
            }

            /* typeof отсеивает основные типы */
            type = typeof value;
            if ((type !== "object") && (type !== "function")) {
                /* function - sometimes it can be a regexp (Chrome) or HTMLCollection (Safari) */
                return type;
            }

            /* typeof null === "object" */
            if (value === null) {
                return "null";
            }

            /* Define by string representation */
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

            /* DOM-elements has representation as [object HTML{tag}Element] */
            if (name.indexOf("[object HTML") === 0) {
                return "element";
            }

            /* All normal browser is already ok. There was only IE < 9 */
            if (!(value instanceof Object)) {
                /* host-object in IE<9 or object from another frame */
                if (value.nodeType === 1) {
                    return "element";
                }
                if (value.nodeType === 3) {
                    return "textnode";
                }
                if (value.item) {
                    /* collection has property "item" (not iterable) */
                    /* jshint forin: false */
                    for (name in value) {
                        if (name === "item") {
                            break;
                        }
                    }
                    if (name !== "item") {
                        return "collection";
                    }
                }
                if ((value + "").indexOf("function") !== -1) {
                    /* Define host-functions in old IE (typeof === "object") by string representation.
                     * They may not have toString()-method: convert through the addition of a string.
                     */
                    return "function";
                }
            }

            if (typeof value.length === "number") {
                /* arguments has property "number" (not iterable) */
                /* jshint forin: false */
                for (name in value) {
                    if (name === "length") {
                        return "object";
                    }
                }
                return "arguments";
            }

            return "object";
        },

        /**
         * Whether the object is a simple dictionary
         * (any object not having a specific type)
         *
         * @name go.Lang.isDict
         * @public
         * @param {Object} value
         *        value for test
         * @return {Boolean}
         *         value is dictionary
         */
        'isDict': function isDict(value) {
            if ((!value) || (typeof value !== "object")) {
                /* !value: (typeof null === "object") */
                return false;
            }

            if (value.constructor === Object) {
                if (nativeGetPrototypeOf && (nativeGetPrototypeOf(value) !== Object.prototype)) {
                    /* The case of the overriden prototype and constructor are not restored */
                    return false;
                }
                return true;
            }

            if (value instanceof Object) {
                /* value from current frame, so constructor must be Object */
                return false;
            }
            if (nativeGetPrototypeOf) {
                /* Value from another frame. Prototype of object prototype - null. */
                value = nativeGetPrototypeOf(value);
                if (!value) {
                    return false;
                }
                return (nativeGetPrototypeOf(value) === null);
            }

            /**
             * All normal browser is already ok. There was only IE < 9 and value from another frame.
             * Attempt to use constructor name.
             *
             * constructor.name is not exists in IE (parse string representation).
             * Object may not have toString()-method.
             * May also be an exception is thrown.
             *
             * Define the object with destroyed prototype in IE <9 does not work.
             */
            try {
                return ((value.constructor + ":").indexOf("function Object()") !== -1);
            } catch (e) {
                return false;
            }

            return false;
        },

        /**
         * Whether value is an array
         *
         * @name go.Lang.isArray
         * @public
         * @param {*} value
         *        value for test
         * @param {Boolean} [strict=false]
         *        strict - only Array
         *        by default - any collection (HTMLCollection, arguments)
         * @return {Boolean}
         *         value is an array
         */
        'isArray': function isArray(value, strict) {
            if (strict) {
                return Lang.isStrictArray(value);
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
         * Whether value is an array (strict)
         *
         * @name go.Lang.isStrictArray
         * @public
         * @param {*} value
         * @return {Boolean}
         */
        'isStrictArray': (function () {
            if (nativeIsArray) {
                return nativeIsArray;
            }
            return function isStrictArray(value) {
                return (nativeToString.call(value) === "[object Array]");
            };
        }()),

        /**
         * Convert value to Array
         *
         * @name go.Lang.toArray
         * @public
         * @param {*} value
         * @return {Array}
         */
        'toArray': function toArray(value) {
            /* jshint maxcomplexity: 15 */
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
         * Checks if a value exists in an array
         * (strict checking)
         *
         * @name go.Lang.inArray
         * @public
         * @param {mixed} needle
         * @param {Array} haystack
         * @return {Boolean}
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
         * Getting own keys of object (not from prototype)
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
         * Traversing the elements of an object
         *
         * @name go.Lang.each
         * @public
         * @param {(Object|Array)} items
         *        object or array for traversing
         * @param {Function} callback
         *        loop body (value, key, iter)
         * @param {Object} [thisArg=global]
         *        executive context for loop body
         * @param {Boolean} [deep=false]
         *        prototypes traverse
         * @return {(Object|Array)}
         *         resulting for all elements
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
                /* jshint forin: false */
                for (i in items) {
                    if (items.hasOwnProperty(i) || deep) {
                        result[i] = callback.call(thisArg, items[i], i, items);
                    }
                }
            }
            return result;
        },

        /**
         * Copy object or array
         *
         * @name go.Lang.copy
         * @public
         * @param {(Object|Array)} source
         *        source object
         * @return {(Object|Array)}
         *         copy of source object
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
         * Extension an object of the properties of another
         *
         * @name go.Lang.extend
         * @public
         * @param {Object} destination
         *        original object (will be changed)
         * @param {Object} source
         *        source of new properties
         * @param {Boolean} [deep=false]
         *        whether to use source prototypes?
         * @return {Object}
         *         extended destination
         */
        'extend': function extend(destination, source, deep) {
            var k;
            for (k in source) {
                /* jshint forin: false */
                if (deep || source.hasOwnProperty(k)) {
                    destination[k] = source[k];
                }
            }
            return destination;
        },

        /**
         * Recursive merge two objects
         *
         * @name go.Lang.merge
         * @public
         * @param {Object} destination
         *        original object (will be changed)
         * @param {Object} source
         *        source of new properties
         * @return {Object}
         *         extended destination
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
         * Simple inheritance constructors
         *
         * @name go.Lang.inherit
         * @public
         * @param {Function} [Constr]
         *        constructor function (empty function by default)
         * @param {Function} [Parent]
         *        constructor-parent (Object by default)
         * @param {Object} [extend]
         *        properties list for extend of prototype
         * @return {Function}
         *         constructor of new "class"
         */
        'inherit': (function () {
            var nativeCreate,
                Fake;
            nativeCreate = nativeObject.create;
            if (!nativeCreate) {
                Fake = function () {};
            }
            function inherit(Constr, Parent, extend) {
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
            }
            return inherit;
        }()),

        /**
         * Helper functions
         *
         * @namespace go.Lang.f
         */
        'f': {
            /**
             * The function that does nothing
             *
             * @name go.Lang.f.empty
             * @public
             * @return void
             */
            'empty': function () {
            },

            /**
             * The function that just returns FALSE
             *
             * @name go.Lang.f.ffalse
             * @public
             * @return {Boolean}
             */
            'ffalse': function () {
                return false;
            },

            /**
             * The function that just returns TRUE
             *
             * @name go.Lang.f.ftrue
             * @public
             * @return {Boolean}
             */
            'ftrue': function () {
                return true;
            },

            /**
             * The function returns argument
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
             * Creation of the function to be called only once
             *
             * @name go.Lang.f.once
             * @public
             * @param {Function} f
             *        original function
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
             * The composition of functions
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
     *        custom exception "classes"
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
         * Create exception "class"
         *
         * @name go.Lang.Exception.create
         * @param {String} name
         *        class name
         * @param {Function} [parent]
         *        parent class (constructor). go.Exception by default
         * @param {String} [defmessage]
         *        default message
         * @return {Function}
         *         constructor of custom exception
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
         *        list of exceptions. "name" => [parent, defmessage]
         * @param {String} [ns]
         *        namespace
         * @param {(Function|String|Boolean)} [base]
         *        basic exception
         * @param {Boolean} [lazy]
         *        lazy instantination
         * @return {Object}
         *         namespace of exceptions
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
         * Getting exception instance from block
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
         * Throws exception from block
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
         * Create all exception instances in block
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
         *        basic exception for go-library
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
