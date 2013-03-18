/**
 * go.Str: строковые функции
 *
 * @package    go.js
 * @subpackage Str
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint nomen: true, es5: true */
/*global go, window */

if (!window.go) {
    throw new Error("go.core is not found");
}

/**
 * @namespace go.Str
 */
go("Str", function () {
    "use strict";

    var Str = {},
        nativeProto = String.prototype,
        nativeTrim = nativeProto.trim,
        nativeTrimLeft = nativeProto.trimLeft,
        nativeTrimRight = nativeProto.trimRight;

    /**
     * Обрезка крайних пробелов
     *
     * @name go.Str.trim
     * @public
     * @param {String} s
     * @return {String}
     */
    if (nativeTrim) {
        Str.trim = function trim(s) {
            return nativeTrim.call(s);
        };
    } else {
        Str.trim = function (s) {
            return Str.trimLeft(Str.trimRight(s));
        };
    }

    /**
     * Обрезка левых пробелов
     *
     * @name go.Str.trimLeft
     * @public
     * @param {String} s
     * @return {String}
     */
    if (nativeTrimLeft) {
        Str.trimLeft = function trimLeft(s) {
            return nativeTrimLeft.call(s);
        };
    } else {
        Str.trimLeft = function (s) {
            return s.replace(/^\s+/, "");
        };
    }

    /**
     * Обрезка правых пробелов
     *
     * @name go.Str.trim
     * @public
     * @param {String} s
     * @return {String}
     */
    if (nativeTrimRight) {
        Str.trimRight = function trimRight(s) {
            return nativeTrimRight.call(s);
        };
    } else {
        Str.trimRight = function (s) {
            return s.replace(/\s+$/, "");
        };
    }

    /**
     * Является ли значение числом или строковым представлением числа
     *
     * @name go.Str.isNumeric
     * @public
     * @param {(String|Number)} value
     *        исходное число или его строковое представление
     * @param {Boolean} [float]
     *        число может быть дробным (по умолчанию нет)
     * @param {Boolean} [signed]
     *        число может быть меньше нуля (по умолчанию нет)
     * @return {Boolean}
     *         является ли значение числом требуемого вида
     */
    Str.isNumeric = function isNumeric(value, float, signed) {
        var n;
        switch (typeof value) {
        case "string":
            if (!float) {
                n = parseInt(value, 10);
                if (n.toString() !== value) {
                    return false;
                }
                return (signed || (n >= 0));
            }
            if (value >= 0) {
                return true;
            }
            return (signed && (value < 0));
        case "number":
            if ((value === Number.POSITIVE_INFINITY) || (value === Number.NEGATIVE_INFINITY)) {
                return false;
            }
            if ((!float) && (Math.round(value) !== value)) {
                return false;
            }
            return (signed || (value >= 0));
        default:
            return false;
        }
    };


    return Str;
});