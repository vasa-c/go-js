/**
 * go.Str: string functions
 *
 * @package    go.js
 * @subpackage Str
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint nomen: true */
/*global go, window */

if (!window.go) {
    throw new Error("go.core is not found");
}

/*jslint unparam: true */
/**
 * @namespace go.Str
 */
go.module("Str", null, function (go, global, undefined) {
    "use strict";
    /*jslint unparam: false */
    var Str = {},
        nativeProto = String.prototype,
        nativeTrim = nativeProto.trim,
        nativeTrimLeft = nativeProto.trimLeft,
        nativeTrimRight = nativeProto.trimRight;

    /**
     * Removing whitespace from both end of string
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
     * Removing whitespace from the left end of the string
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
     * Removing whitespace from the right end of the string.
     *
     * @name go.Str.trimRight
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
     * Checking if a value is numeric (numeric string or number directly)
     *
     * @name go.Str.isNumeric
     * @public
     * @param {(String|Number)} value
     *        original number or its string representation
     * @param {Boolean} [isfloat]
     *        number may be float (only integer by default)
     * @param {Boolean} [signed]
     *        number may be negative (does not by default)
     * @return {Boolean}
     *         value is numeric
     */
    Str.isNumeric = function isNumeric(value, isfloat, signed) {
        var n;
        switch (typeof value) {
        case "string":
            if (!isfloat) {
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
            if ((!isfloat) && (Math.round(value) !== value)) {
                return false;
            }
            return (signed || (value >= 0));
        default:
            return false;
        }
    };

    /**
     * Repeat a string
     *
     * @name go.Str.repeat
     * @public
     * @param {String} str
     *        the string to be repeated
     * @param {Number} count
     *        the number of repetitions
     * @return {String}
     *         repeated string
     */
    Str.repeat = function repeat(str, count) {
        return (new global.Array(count + 1)).join(str);
    };

    /**
     * Align the string at a fixed width block
     *
     * @name go.Str.align
     * @public
     * @param {String} s
     *        original string
     * @param {Number} size
     *        width of block
     * @param {String} [pos]
     *        type of alignment: "left", "right", or "center" (left by default)
     * @param {String} [fill]
     *        filler
     * @return {String}
     *         aligned string
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
     * Getting string representation of number
     *
     * @name go.Str.numberFormat
     * @public
     * @param {Number} number
     *        original number
     * @param {Number} decimal [optional=0]
     *        number of decimal points
     * @param {String} decPoint [optional="."]
     *        separator for the decimal point
     * @param {String} thSep [optional=","]
     *        separator for thouslands
     * @return {String}
     *         string representation
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
     * Escape html special characters
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
     * Convert html to plain text
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

    /**
     * Simple template system
     *
     * @name go.Str.tpl
     * @public
     * @param {(String|Object)} template
     *        template (string or compiling by go.Str.tpl.compile)
     * @param {Object} vars
     *        vars for rendering
     * @param {String} [openTag]
     *        open tag ("{{" by default)
     * @param {String} [closeTag]
     *        close tag ("}}" by default)
     * @return {String}
     *         rendering template
     */
    Str.tpl = function tpl(template, vars, openTag, closeTag) {
        var result = [], len, i, item, getValue;
        if (typeof template === "string") {
            template = Str.tpl.compile(template, openTag, closeTag);
        }
        getValue = function getValue(vars, path) {
            var len = path.length,
                i;
            for (i = 0; i < len; i += 1) {
                vars = vars[path[i]];
                if ((vars === undefined) || (vars === null)) {
                    return false;
                }
            }
            return vars.toString();
        };
        for (i = 0, len = template.length; i < len; i += 1) {
            item = template[i];
            if (typeof item === "string") {
                result.push(item);
            } else {
                item = getValue(vars, item);
                if (item) {
                    result.push(item);
                }
            }
        }
        return result.join("");
    };

    /**
     * Compile template for go.Str.tpl
     *
     * @name go.Str.tpl.compile
     * @public
     * @param {String} template
     *        строка шаблона
     * @param openTag
     * @param closeTag
     */
    Str.tpl.compile = function compile(template, openTag, closeTag) {
        var result = [],
            len,
            i,
            part,
            trim = Str.trim;
        openTag = openTag || "{{";
        closeTag = closeTag || "}}";
        template = template.split(openTag);
        result.push(template[0]);
        for (i = 1, len = template.length; i < len; i += 1) {
            part = template[i].split(closeTag, 2);
            result.push(trim(part[0]).split("."));
            if (part[1]) {
                result.push(part[1]);
            }
        }
        return result;
    };

    return Str;
});