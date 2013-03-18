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


    return Str;
});