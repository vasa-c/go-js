/**
 * go.LangExt: extension of go.Lang
 *
 * @package    go.js
 * @subpackage Lang
 * @author     Grigoriev Oleg aka vasa_c <go.vasac@gmail.com>
 */
/* jshint maxstatements: 50, maxcomplexity: 20 */

if (!window.go) {
    throw new Error("go.core is not found");
}

go.module("LangExt", null, function (go, global, undefined) {
    "use strict";
    var Lang = go.Lang,
        nativeToString = global.Object.prototype.toString,
        nativeArrayPrototype = global.Array.prototype,
        isStrictArray = Lang.isStrictArray;

    /**
     * Parses the string (GET or POST request) into variables
     *
     * @name go.Lang.parseQuery
     * @public
     * @param {(String|Object)} [query]
     *        request string (window.location by default) or dictionary of variables
     * @param {String} [sep]
     *        variable separator ("&" by default)
     * @return {Object}
     *         dictionary of variables from request
     */
    Lang.parseQuery = function parseQuery(query, sep) {
        var result, i, len, v;
        if (query === undefined) {
            query = global.location.toString().split("#", 2)[0].split("?", 2)[1];
        } else if (typeof query !== "string") {
            return query;
        }
        if (!query) {
            return {};
        }
        result = {};
        query = query.split(sep || "&");
        for (i = 0, len = query.length; i < len; i += 1) {
            v = query[i].split("=", 2);
            if (v.length === 2) {
                result[decodeURIComponent(v[0])] = decodeURIComponent(v[1]);
            } else {
                result[decodeURIComponent(v[0])] = undefined;
            }
        }
        return result;
    };

    /**
     * Create query string (URL-encoded)
     *
     * @name go.Lang.buildQuery
     * @public
     * @param {(Object|String)} vars
     *        variables (discionary or string)
     * @param {String} [sep]
     *        variable separator ("&" by default)
     * @return {String}
     *         query string
     */
    Lang.buildQuery = function buildQuery(vars, sep) {
        var query, buildValue, buildArray, buildDict;
        if (typeof vars === "string") {
            return vars;
        }
        query = [];
        buildValue = function (name, value) {
            if (Lang.isDict(value)) {
                buildDict(value, name);
            } else if (isStrictArray(value)) {
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
    };

    /**
     * Get value by path inside object
     *
     * @name go.Lang.getByPath
     * @public
     * @param {Object} context
     *        target object (global by default)
     * @param {(String|Array.<String>)} path
     *        path - string ("one.two.three") or list of components (["one", "two", "three"])
     * @param {*} [bydefault]
     *        default value (if path is not found)
     * @return {*}
     */
    Lang.getByPath = function getByPath(context, path, bydefault) {
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
    };

    /**
     * Set value by path inside object
     *
     * @name go.Lang.setByPath
     * @public
     * @param {Object} context
     *        target object
     * @param {(String|Array.<String>)} path
     *        path - string ("one.two.three") or list of components (["one", "two", "three"]
     * @param {*} value
     *        value for setting
     */
    Lang.setByPath = function setByPath(context, path, value) {
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
    };

    /**
     * Currying of function
     *
     * @name go.Lang.curry
     * @public
     * @param {Function} fn
     *        original function
     * @param {... *} [args]
     *        memorized arguments
     * @return {Function}
     *         curried function
     */
    Lang.curry = function curry(fn) {
        var slice = Array.prototype.slice,
            cargs = slice.call(arguments, 1);
        return function () {
            var args = cargs.concat(slice.call(arguments));
            return fn.apply(global, args);
        };
    };

    /**
     * Execute first correct function
     *
     * @name go.Lang.tryDo
     * @public
     * @param {Array.<Function>} funcs
     *        list of functions
     * @return {*}
     *         first correct result (or undefined if none of them correct)
     */
    Lang.tryDo = function tryDo(funcs) {
        var i, len, result;
        for (i = 0, len = funcs.length; i < len; i += 1) {
            try {
                return funcs[i]();
            } catch (e) {
            }
        }
        return result;
    };

    /**
     * Finds out whether a variable is an undefined
     *
     * @name go.Lang.isUndefined
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isUndefined = function isUndefined(value) {
        return (value === undefined);
    };

    /**
     * Finds out whether a variable is NULL
     *
     * @name go.Lang.isNull
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isNull = function isNull(value) {
        return (value === null);
    };

    /**
     * Finds out whether a variable is a boolean
     *
     * @name go.Lang.isBoolean
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isBoolean = function isBoolean(value) {
        return (typeof value === "boolean");
    };

    /**
     * Finds out whether a variable is a number
     *
     * @name go.Lang.isNumber
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isNumber = function isNumber(value) {
        return (typeof value === "number");
    };

    /**
     * Finds out whether a variable is a string
     *
     * @name go.Lang.isString
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isString = function isString(value) {
        return (typeof value === "string");
    };

    /**
     * Finds out whether a variable is a function
     *
     * @name go.Lang.isFunction
     * @param {*} value
     * @return {Boolean}
     */
    if ((global.alert) && (typeof global.alert !== "function")) {
        Lang.isFunction = function (value) { // for IE<9
            if (typeof value === "function") {
                return true;
            }
            return ((value + ":").indexOf("[native code]") !== -1);
        };
    } else {
        Lang.isFunction = function isFunction(value) {
            return (nativeToString.call(value) === "[object Function]");
        };
    }

    /**
     * Finds out whether a instance of exception
     *
     * @name go.Lang.isError
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isError = function isError(value) {
        if (nativeToString.call(value) === "[object Error]") {
            return true;
        }
        return value instanceof global.Error;
    };

    /**
     * Finds out whether a data
     *
     * @name go.Lang.isDate
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isDate = function isDate(value) {
        return (nativeToString.call(value) === "[object Date]");
    };

    if (nativeToString.call(arguments) === "[object Arguments]") {
        /**
         * Finds out whether a DOM element
         *
         * @name go.Lang.isElement
         * @param {*} value
         * @return {Boolean}
         */
        Lang.isElement = function isElement(value) {
            return (nativeToString.call(value).indexOf("[object HTML") === 0) && (!Lang.isCollection(value));
        };

        /**
         * Finds out whether a text node
         *
         * @name go.Lang.isTextnode
         * @param {*} value
         * @return {Boolean}
         */
        Lang.isTextnode = function isTextnode(value) {
            return (nativeToString.call(value) === "[object Text]");
        };

        /**
         * Finds out whether a HTML collection
         *
         * @name go.Lang.isCollection
         * @param {*} value
         * @return {Boolean}
         */
        Lang.isCollection = function isCollection(value) {
            return Lang.inArray(nativeToString.call(value), [
                "[object HTMLCollection]",
                "[object NodeList]",
                "[object HTMLAllCollection]"
            ]);
        };

        /**
         * Finds out whether a arguments
         *
         * @name go.Lang.is
         * @param {*} value
         * @return {Boolean}
         */
        Lang.isArguments = function isArguments(value) {
            return (nativeToString.call(value) === "[object Arguments]");
        };
    } else {
        Lang.isElement = function (value) {
            return (value && (typeof value === "object") && (value.nodeType === 1));
        };

        Lang.isTextnode = function (value) {
            return (value && (typeof value === "object") && (value.nodeType === 3));
        };

        Lang.isCollection = function (value) {
            var k;
            if ((!value) || (typeof value !== "object")) {
                return false;
            }
            if (!value.item) {
                return false;
            }
            /*jslint forin: true */
            for (k in value) {
                if (k === "item") {
                    return false;
                }
            }
            /*jslint forin: false */
            return true;
        };

        Lang.isArguments = function (value) {
            var k;
            if ((!value) || (typeof value !== "object")) {
                return false;
            }
            if ((typeof value.length !== "number") || (value.item) || (value.slice)) {
                return false;
            }
            /*jslint forin: true */
            for (k in value) {
                if (k === "length") {
                    return false;
                }
            }
            /*jslint forin: false */
            return true;
        };
    }

    /**
     * Call method by name for list of objects
     *
     * @name go.Lang.invoke
     * @public
     * @param {(Object|Array)} items
     *        list or dictionary of objects
     * @param {String} methodName
     *        method name
     * @param {Array} [args]
     *        arguments for call
     * @return {(Object|Array)}
     *         results of calling (structure same items)
     */
    Lang.invoke = function invoke(items, methodName, args) {
        return Lang.each(items, function (item) {
            return item[methodName].apply(item, args || []);
        });
    };

    /**
     * Get field value by name from list of objects
     *
     * @name go.Lang.field
     * @public
     * @param {(Object|Array)} items
     *        list or dictionary of items
     * @param {String} fieldName
     *        field name
     * @return {(Object|Array)}
     *         values of field (structure same items)
     */
    Lang.field = function field(items, fieldName) {
        return Lang.each(items, function (item) {
            return item[fieldName];
        });
    };

    /**
     * Get field value by path from list of objects
     *
     * In contrast to the field(), you can specify the path instead of the name
     *
     * @name go.Lang.fieldByPath
     * @public
     * @param {(Object|Array)} items
     *        list or dictionary of items
     * @param {(String|Array)} fieldPath
     *        path to field as string ("one.two.three") or as list (["one", "two", "three"])
     * @return {(Object|Array)}
     *         values of field (structure same items)
     */
    Lang.fieldByPath = function fieldByPath(items, fieldPath) {
        var getByPath = Lang.getByPath;
        if (typeof fieldPath === "string") {
            fieldPath = fieldPath.split(".");
        }
        return Lang.each(items, function (item) {
            return getByPath(item, fieldPath);
        });
    };

    /**
     * Filtering structure
     *
     * @name go.Lang.filter
     * @public
     * @param {(Object|Array)} items
     *        original structure
     * @param {(Function|String)} criterion
     *        filter criterion (function or field name)
     * @param {Object} context [optional]
     *        executive context for criterion
     * @return {(Object|Array)}
     *         filtered structure
     */
    Lang.filter = function filter(items, criterion, context) {
        var i, len, result, item;
        if (isStrictArray(items)) {
            if (typeof criterion !== "function") {
                criterion = (function (field) {
                    return function (item) {
                        return item[field];
                    };
                }(criterion));
            }
            if (nativeArrayPrototype.filter) {
                result = nativeArrayPrototype.filter.call(items, criterion, context);
            } else {
                result = [];
                for (i = 0, len = items.length; i < len; i += 1) {
                    item = items[i];
                    if (criterion.call(context, item, i, items)) {
                        result.push(item);
                    }
                }
            }
        } else {
            result = {};
            if (typeof criterion === "function") {
                for (i in items) {
                    if (items.hasOwnProperty(i)) {
                        item = items[i];
                        if (criterion.call(context, item, i, items)) {
                            result[i] = item;
                        }
                    }
                }
            } else {
                for (i in items) {
                    if (items.hasOwnProperty(i)) {
                        item = items[i];
                        if (item[criterion]) {
                            result[i] = item;
                        }
                    }
                }
            }
        }
        return result;
    };

    /**
     * Sort list by criterion
     *
     * @name go.Lang.sortBy
     * @public
     * @param {Array} items
     *        original list
     * @param {(Function|String)} criterion
     *        sort criterion (field name or callback(item))
     * @param {Object} [context]
     *        executive context for criterion
     * @param {Boolean} [reverse]
     *        sort in reverse order
     * @return {Array}
     *         sorted list
     */
    Lang.sortBy = function sortBy(items, criterion, context, reverse) {
        var arr = [],
            len = items.length,
            f,
            item,
            value,
            i;
        reverse = reverse ? -1 : 1;
        f = (typeof criterion === "function");
        for (i = 0; i < len; i += 1) {
            item = items[i];
            value = f ? criterion.call(context, item, i, items) : item[criterion];
            arr.push([value, item]);
        }
        arr.sort(function (a, b) {
            a = a[0];
            b = b[0];
            if (a > b) {
                return reverse;
            }
            if (b > a) {
                return -reverse;
            }
            return 0;
        });
        items = [];
        for (i = 0; i < len; i += 1) {
            items.push(arr[i][1]);
        }
        return items;
    };

    /**
     * Grouping by criterion
     *
     * @name go.Lang.groupBy
     * @public
     * @param {(Array|Object)} items
     *        original list or dictionary of objects
     * @param {(Function|String)} criterion
     *        grouping criterion (field name or callback(item))
     * @param {Object} [context]
     *        executive context for criterion
     * @return {Object}
     *         grouped structure
     */
    Lang.groupBy = function groupBy(items, criterion, context) {
        var f = (typeof criterion === "function"),
            result = {},
            item,
            value,
            len,
            i;
        if (isStrictArray(items)) {
            for (i = 0, len = items.length; i < len; i += 1) {
                item = items[i];
                value = f ? criterion.call(context, item, i, items) : item[criterion];
                if (result[value]) {
                    result[value].push(item);
                } else {
                    result[value] = [item];
                }
            }
        } else {
            for (i in items) {
                if (items.hasOwnProperty(i)) {
                    item = items[i];
                    value = f ? criterion.call(context, item, i, items) : item[criterion];
                    if (!result[value]) {
                        result[value] = {};
                    }
                    result[value][i] = item;
                }
            }
        }
        return result;
    };

    /**
     * Exchanges all keys with their associated values
     *
     * @name flip
     * @public
     * @param {(Object|Array)} items
     *        original list or dictionary
     * @param {*} [value]
     *        value (key by default)
     * @return {Object}
     *         flipped items
     */
    Lang.flip = function flip(items, value) {
        var result = {},
            len,
            def = (value !== undefined),
            i;
        if (isStrictArray(items)) {
            for (i = 0, len = items.length; i < len; i += 1) {
                result[items[i]] = def ? value : i;
            }
        } else {
            for (i in items) {
                if (items.hasOwnProperty(i)) {
                    result[items[i]] = def ? value : i;
                }
            }
        }
        return result;
    };

    /**
     * Check whether all the elements meet the criterion
     *
     * @name go.Lang.every
     * @public
     * @param {(Object|Array)} items
     *        elements (list or dictionary)
     * @param {(Function|String)} [criterion]
     *        criterion (field name or callback)
     * @param {Object} [context]
     *        executive context for criterion
     * @return {Boolean}
     *         TRUE - all items meet the criterion
     */
    Lang.every = function every(items, criterion, context) {
        var len,
            i,
            noc = (!criterion),
            f = (typeof criterion === "function"),
            value;
        if (isStrictArray(items)) {
            if (nativeArrayPrototype.every) {
                if (!f) {
                    if (noc) {
                        criterion = function (item) {return item; };
                    } else {
                        f = criterion;
                        criterion = function (item) {return item[f]; };
                    }
                }
                return nativeArrayPrototype.every.call(items, criterion, context);
            }
            for (i = 0, len = items.length; i < len; i += 1) {
                if (f) {
                    value = criterion.call(context, items[i], i, items);
                } else {
                    value = noc ? items[i] : items[i][criterion];
                }
                if (!value) {
                    return false;
                }
            }
        } else {
            for (i in items) {
                if (items.hasOwnProperty(i)) {
                    if (f) {
                        value = criterion.call(context, items[i], i, items);
                    } else {
                        value = noc ? items[i] : items[i][criterion];
                    }
                    if (!value) {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    /**
     * Check if there is at least one element that matches the criteria
     *
     * @name go.Lang.some
     * @public
     * @param {(Object|Array)} items
     *        elements (list or dictionary)
     * @param {(Function|String)} [criterion]
     *        criterion (field name or callback)
     * @param {Object} [context]
     *        executive context for criterion
     * @return {Boolean}
     *         there is at least one element meet the criterion
     */
    Lang.some = function some(items, criterion, context) {
        var field;
        if (isStrictArray(items) && nativeArrayPrototype.some) {
            if (typeof criterion !== "function") {
                if (criterion) {
                    field = criterion;
                    criterion = function (item) {return item[field]; };
                } else {
                    criterion = function (item) {return item; };
                }
            }
            return nativeArrayPrototype.some.call(items, criterion, context);
        }
        return (Lang.find(items, criterion, context, true) !== undefined);
    };

    /**
     * Search element, which meet the criterion
     *
     * @name go.Lang.find
     * @public
     * @param {(Object|Array)} items
     *        elements (list or dictionary)
     * @param {(Function|String)} [criterion]
     *        criterion (field name or callback)
     * @param {Object} [context]
     *        executive context for criterion
     * @param {Boolean} [returnkey]
     *        instead values ​​should return the key (dictionary) or index (array)
     * @param {*} [bydefault]
     *        default value (element is not found)
     * @return {*}
     *         value (or key) of target item or bydefault for fail
     */
    Lang.find = function find(items, criterion, context, returnkey, bydefault) {
        var len,
            i,
            noc = (!criterion),
            f = (typeof criterion === "function"),
            value,
            ritem,
            rkey;
        if (isStrictArray(items)) {
            if (nativeArrayPrototype.some) {
                if (!f) {
                    if (noc) {
                        criterion = function (item, key) {
                            ritem = item;
                            rkey = key;
                            return item;
                        };
                    } else {
                        f = criterion;
                        criterion = function (item, key) {
                            ritem = item;
                            rkey = key;
                            return item[f];
                        };
                    }
                } else {
                    f = criterion;
                    criterion = function (item, key, items) {
                        if (f.call(this, item, key, items)) {
                            ritem = item;
                            rkey = key;
                            return true;
                        }
                        return false;
                    };
                }
                if (nativeArrayPrototype.some.call(items, criterion, context)) {
                    return returnkey ? rkey : ritem;
                }
                return bydefault;
            }
            for (i = 0, len = items.length; i < len; i += 1) {
                if (f) {
                    value = criterion.call(context, items[i], i, items);
                } else {
                    value = noc ? items[i] : items[i][criterion];
                }
                if (value) {
                    return returnkey ? i : items[i];
                }
            }
        } else {
            for (i in items) {
                if (items.hasOwnProperty(i)) {
                    if (f) {
                        value = criterion.call(context, items[i], i, items);
                    } else {
                        value = noc ? items[i] : items[i][criterion];
                    }
                    if (value) {
                        return returnkey ? i : items[i];
                    }
                }
            }
        }
        return bydefault;
    };

    /**
     * Reduce of items (left-to-right)
     *
     * @name go.Lang.reduce
     * @public
     * @param {(Array|Object)} items
     *        list or dictionary of items
     * @param {(Function|Array)} callback
     *        callback or [callback, context]
     * @param initialValue [optional]
     *        the initial value
     * @return {*}
     *         result of reduce
     */
    Lang.reduce = function reduce(items, callback, initialValue) {
        var clb = callback, // jslint: Do not mutate parameter 'callback' when using 'arguments'.
            context,
            init = (arguments.length > 2),
            value,
            len,
            i,
            start;
        if (typeof clb === "object") {
            context = clb[1];
            clb = clb[0];
        }
        if (isStrictArray(items)) {
            if (nativeArrayPrototype.reduce) {
                if (context) {
                    clb = Lang.bind(clb, context);
                }
                if (init) {
                    return nativeArrayPrototype.reduce.call(items, clb, initialValue);
                }
                return nativeArrayPrototype.reduce.call(items, clb);
            }
            len = items.length;
            if (init) {
                value = initialValue;
                start = 0;
            } else {
                if (len === 0) {
                    throw new TypeError("Reduce of empty array with no initial value");
                }
                value = items[0];
                start = 1;
            }
            for (i = start; i < len; i += 1) {
                value = clb.call(context, value, items[i], i, items);
            }
        } else {
            if (init) {
                value = initialValue;
                start = true;
            } else {
                start = false;
            }
            for (i in items) {
                if (items.hasOwnProperty(i)) {
                    if (start) {
                        value = clb.call(context, value, items[i], i, items);
                    } else {
                        value = items[i];
                        start = true;
                    }
                }
            }
        }
        return value;
    };

    /**
     * Reduce of items (right-to-left)
     *
     * @name go.Lang.reduce
     * @public
     * @param {(Array|Object)} items
     *        list or dictionary of items
     * @param {(Function|Array)} callback
     *        callback or [callback, context]
     * @param initialValue [optional]
     *        the initial value
     * @return {*}
     *         result of reduce
     */
    Lang.reduceRight = function reduceRight(items, callback, initialValue) {
        var clb = callback, // jslint: Do not mutate parameter 'callback' when using 'arguments'.
            context,
            init = (arguments.length > 2),
            value,
            len,
            i,
            start;
        if (typeof clb === "object") {
            context = clb[1];
            clb = clb[0];
        }
        if (isStrictArray(items)) {
            if (nativeArrayPrototype.reduce) {
                if (context) {
                    clb = Lang.bind(clb, context);
                }
                if (init) {
                    return nativeArrayPrototype.reduceRight.call(items, clb, initialValue);
                }
                return nativeArrayPrototype.reduceRight.call(items, clb);
            }
            len = items.length;
            if (init) {
                value = initialValue;
                start = len - 1;
            } else {
                if (len === 0) {
                    throw new TypeError("Reduce of empty array with no initial value");
                }
                value = items[len - 1];
                start = len - 2;
            }
            for (i = start; i >= 0; i -= 1) {
                value = clb.call(context, value, items[i], i, items);
            }
        } else {
            if (init) {
                value = initialValue;
                start = true;
            } else {
                start = false;
            }
            for (i in items) {
                if (items.hasOwnProperty(i)) {
                    if (start) {
                        value = clb.call(context, value, items[i], i, items);
                    } else {
                        value = items[i];
                        start = true;
                    }
                }
            }
        }
        return value;
    };

    /* go.LangExt === true */
    return true;
});