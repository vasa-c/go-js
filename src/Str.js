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

/*jslint unparam: true */
/**
 * @namespace go.Str
 */
go("Str", function (go, global, undefined) {
    "use strict";
    /*jslint unparam: false */
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

    /**
     * Повторить строку нужное количество раз
     *
     * @name go.Str.repeat
     * @public
     * @param {String} str
     * @param {Number} count
     * @return {String}
     */
    Str.repeat = function repeat(str, count) {
        return (new global.Array(count + 1)).join(str);
    };

    /**
     * Выровнять строку по фиксированному блоку
     *
     * @name go.Str.align
     * @public
     * @param {String} s
     *        исходная строка
     * @param {Number} size
     *        размер блока
     * @param {String} [pos]
     *        выравнивание ("left", "right", "center") по умолчанию "left"
     * @param {String} [fill]
     *        заполнитель
     * @return {String}
     *         выровненная строка
     */
    Str.align = function align(s, size, pos, fill) {
        var len = s.length;
        if (len >= size) {
            return s;
        }
        pos = pos || "left";
        fill = fill || " ";
        switch (pos) {
        case "left":
            return [s, Str.repeat(fill, size - len)].join("");
        case "right":
            return [Str.repeat(fill, size - len), s].join("");
        case "center":
            len = size - len;
            pos = Math.round(len / 2);
            return [Str.repeat(fill, pos), s, Str.repeat(fill, len - pos)].join("");
        default:
            return s;
        }
    };

    /**
     * Получение строкового представления числа
     *
     * @name go.Str.numberFormat
     * @public
     * @param {Number} number
     * @param {Number} decimal [optional=0]
     * @param {String} decPoint [optional="."]
     * @param {String} thSep [optional=","]
     * @return {String}
     */
    Str.numberFormat = function numberFormat(number, decimal, decPoint, thSep) {
        var i, len, parts, j;
        number = number.toFixed(decimal).split(".", 2);
        decPoint = number[1] ? ((decPoint || ".") + number[1]) : "";
        number = number[0].toString();
        len = number.length;
        if (len > 3) {
            parts = [];
            j = len - Math.floor(len / 3) * 3;
            if (j > 0) {
                parts.push(number.slice(0, j));
            }
            for (i = j; i < len; i += 3) {
                parts.push(number.slice(i, i + 3));
            }
            number = parts.join(thSep || ",");
        }
        return number + decPoint;
    };

    /**
     * Экранирование html-кода
     *
     * @name go.Str.html
     * @public
     * @param {String} plain
     * @return {String}
     */
    Str.html = function html(plain) {
        var spec = [
                ["&", "&amp;"],
                ["<", "&lt;"],
                [">", "&gt;"],
                ['"', "&quot;"],
                ["'", "&#039;"]
            ],
            len = spec.length,
            i,
            reg;
        for (i = 0; i < len; i += 1) {
            reg = new RegExp(spec[i][0], "g");
            plain = plain.replace(reg, spec[i][1]);
        }
        return plain;
    };

    /**
     * Перевод html в простой текст
     *
     * @name go.Str.htmlDecode
     * @public
     * @param {String} html
     * @return {String}
     */
    Str.htmlDecode = function htmlDecode(html) {
        var d;
        if (html.length === 0) {
            return "";
        }
        if (!global.document) {
            return html;
        }
        d = global.document.createElement("div");
        d.innerHTML = html;
        return d.firstChild.nodeValue || "";
    };

    return Str;
});