/**
 * go.LangExt: расширение go.Lang
 *
 * @package    go.js
 * @subpackage Lang
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint nomen: true, es5: true */
/*global go, window */

if (!window.go) {
    throw new Error("go.core is not found");
}

go("LangExt", [], function (go, global, undefined) {
    "use strict";
    var Lang = go.Lang,
        nativeToString = Object.prototype.toString;

    /**
     * Разбор GET или POST запроса
     *
     * @name go.Lang.parseQuery
     * @public
     * @param {(String|Object)} [query]
     *        строка запроса (по умолчанию window.location) или сразу словарь переменных
     * @param {String} [sep]
     *        разделитель переменных (по умолчанию "&")
     * @return {Object}
     *         словарь переменных из запроса
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
                result[''] = decodeURIComponent(v[0]);
            }
        }
        return result;
    };

    /**
     * Сформировать строку запроса на основе набора переменных
     *
     * @name go.Lang.buildQuery
     * @public
     * @param {(Object|String)} vars
     *        набор переменных (или сразу строка)
     * @param {String} [sep]
     *        разделитель (по умолчанию "&")
     * @return {String}
     *         строка запроса
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
    };

    /**
     * Получить значение по пути внутри объекта
     *
     * @name go.Lang.getByPath
     * @public
     * @param {Object} context
     *        объект, в котором производится поиск (не указан - глобальный)
     * @param {(String|Array.<String>)} path
     *        путь - массив компонентов или строка вида "one.two.three"
     * @param {*} [bydefault]
     *        значение по умолчанию, если путь не найден
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
     * Установить значение по пути внутри объекта
     *
     * @name go.Lang.setByPath
     * @public
     * @param {Object} context
     *        целевой объект
     * @param {(String|Array.<String>)} path
     *        путь - массив компонентов или строка вида "one.two.three"
     * @param {*} value
     *        значение
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
     * Каррирование функции
     *
     * @name go.Lang.curry
     * @public
     * @param {Function} fn
     *        исходная функция
     * @param {... *} [args]
     *        запоминаемые аргументы
     * @return {Function}
     *         каррированная функция
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
     * Выполнить первую корректную функцию
     *
     * @name go.Lang.tryDo
     * @public
     * @param {Array.<Function>} funcs
     *        список функций
     * @return {*}
     *         результат первой корректно завершившейся функции.
     *         ни одна не сработала - undefined.
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
     * Является ли значение undefined
     *
     * @name go.Lang.isUndefined
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isUndefined = function isUndefined(value) {
        return (value === undefined);
    };

    /**
     * Является ли значение null
     *
     * @name go.Lang.isNull
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isNull = function isNull(value) {
        return (value === null);
    };

    /**
     * Является ли значение логическим
     *
     * @name go.Lang.isBoolean
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isBoolean = function isBoolean(value) {
        return (typeof value === "boolean");
    };

    /**
     * Является ли значение числом
     *
     * @name go.Lang.isNumber
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isNumber = function isNumber(value) {
        return (typeof value === "number");
    };

    /**
     * Является ли значение строкой
     *
     * @name go.Lang.isString
     * @param {*} value
     * @return {Boolean}
     */
    Lang.isString = function isString(value) {
        return (typeof value === "string");
    };

    /**
     * Является ли значение функцией
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
     * Является ли значение объектом исключения
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
     * Является ли значение датой
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
         * Является ли значение DOM-элементом
         *
         * @name go.Lang.isElement
         * @param {*} value
         * @return {Boolean}
         */
        Lang.isElement = function isElement(value) {
            return (nativeToString.call(value).indexOf("[object HTML") === 0) && (!Lang.isCollection(value));
        };

        /**
         * Является ли значение текстовой нодой
         *
         * @name go.Lang.isTextnode
         * @param {*} value
         * @return {Boolean}
         */
        Lang.isTextnode = function isTextnode(value) {
            return (nativeToString.call(value) === "[object Text]");
        };

        /**
         * Является ли значение HTML-коллекцией
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
         * Является ли значение объектом arguments
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
     * Вызов определённого метода для списка объектов
     *
     * @name go.Lang.invoke
     * @public
     * @param {(Object|Array)} items
     *        список или словарь объектов
     * @param {String} methodName
     *        аргументы метода
     * @param {Array} [args]
     *        аргументы вызова метода
     * @return {(Object|Array)}
     *         список той же структуры, что и items с результатами вызова метода
     */
    Lang.invoke = function invoke(items, methodName, args) {
        return Lang.each(items, function (item) {
            return item[methodName].apply(item, args);
        });
    };

    return true;
});