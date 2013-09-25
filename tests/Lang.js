/**
 * Testing the module go.Lang
 *
 * @package    go.js
 * @subpackage Lang
 * @author     Grigoriev Oleg aka vasa_c (http://blgo.ru/)
 */
/* global alert */
"use strict";

tests.module("Lang");

tests.test("bind() context", function () {
    var obj1, obj2;
    obj1 = {
        'x': 1,
        'f': function () {
            return this.x;
        }
    };
    obj2 = {
        'x': 2
    };

    obj2.fNorm = obj1.f;
    obj2.fBind = go.Lang.bind(obj1.f, obj1);

    equal(obj2.fNorm(), 2, "not bounded function");
    equal(obj2.fBind(), 1, "bounded function");
});

tests.test("bind() arguments", function () {
    var obj = {'x': "x"}, f, f1, f2;

    f = function (a, b, c, d) {
        return [this.x, a, b, c, d].join(", ");
    };

    f1 = go.Lang.bind(f, obj);
    f2 = go.Lang.bind(f, obj, ["a", "b"]);

    equal(f1(1, 2, 3, 4), "x, 1, 2, 3, 4", "bind without args");
    equal(f2(1, 2, 3, 4), "x, a, b, 1, 2", "bind with args");
});

tests.test("bind(global)", function () {
    var f, obj;

    f = function (a, b) {
        var g = (this === window) ? "g" : "-";
        return [g, a, b].join(", ");
    };

    obj = {
        'fG'  : go.Lang.bind(f),
        'fGA' : go.Lang.bind(f, null, ['a']),
        'fN'  : f
    };

    equal(obj.fG(1, 2), "g, 1, 2", "bind global (by default)");
    equal(obj.fGA(1, 2), "g, a, 1", "bind global (and args)");
    equal(obj.fN(1, 2), "-, 1, 2", "not bounded function");
});

tests.test("bind() user defined", function () {
    function f() {
        return "f";
    }
    f.bind = function () {
        return function () {
            return "bind";
        };
    };

    var f2 = go.Lang.bind(f);
    equal(f2(), "bind", "custom bind()");
});

tests.test("bind() no builtin Function.bind", function () {
    var obj1, obj2;
    obj1 = {
        'x': 1,
        'f': function () {
            return this.x;
        }
    };
    obj2 = {
        'x': 2
    };

    obj1.f.bind = null;

    obj2.fNorm = obj1.f;
    obj2.fBind = go.Lang.bind(obj1.f, obj1);

    equal(obj2.fNorm(), 2, "not bounded function");
    equal(obj2.fBind(), 1, "bounded function");
});

tests.test("bind() arguments + no builtin Function.bind", function () {
    var obj = {'x': "x"}, f, f1, f2;

    f = function (a, b, c, d) {
        return [this.x, a, b, c, d].join(", ");
    };

    f.bind = null;

    f1 = go.Lang.bind(f, obj);
    f2 = go.Lang.bind(f, obj, ["a", "b"]);

    equal(f1(1, 2, 3, 4), "x, 1, 2, 3, 4", "bind without args");
    equal(f2(1, 2, 3, 4), "x, a, b, 1, 2", "bind with args");
});

tests.test("bindMethod()", function () {
    var obj, f;

    obj = {
        'x': 10
    };

    f = go.Lang.bindMethod(obj, "method");

    obj.method = function (m) {
        return this.x * m;
    };
    equal(f(2), 20, "call binded method");

    obj.method = function (m) {
        return this.x + m;
    };
    equal(f(2), 12, "replace method");

    f = go.Lang.bindMethod(obj, "method", [1, 2, 3]);
    obj.method = function () {
        return Array.prototype.slice.call(arguments, 0);
    };
    deepEqual(f(4, 5), [1, 2, 3, 4, 5], "carry");
});

tests.test("getType", function () {
    var undef,
        div,
        span,
        collection,
        ConstructorEObject,
        instance,
        w = window;

    equal(go.Lang.getType(undef), "undefined", "undefined");

    equal(go.Lang.getType(null), "null", "null");

    equal(go.Lang.getType(5), "number", "positive number");
    equal(go.Lang.getType(-5), "number", "negative number");
    equal(go.Lang.getType(10 / 3), "number", "float number");
    equal(go.Lang.getType(0), "number", "number 0");
    /* jshint sub: true */
    equal(go.Lang.getType(Number["NaN"]), "number", "NaN");
    /* jshint sub: false */
    equal(go.Lang.getType(Number.NEGATIVE_INFINITY), "number", "-Infinity");
    equal(go.Lang.getType(Number.POSITIVE_INFINITY), "number", "+Infinity");
    equal(go.Lang.getType(new w.Number(3)), "number", "object Number");

    equal(go.Lang.getType(true), "boolean", "true boolean");
    equal(go.Lang.getType(false), "boolean", "false boolean");
    equal(go.Lang.getType(new w.Boolean(true)), "boolean", "object Boolean");

    equal(go.Lang.getType("string"), "string", "string");
    equal(go.Lang.getType(""), "string", "empty string");
    equal(go.Lang.getType(new w.String("string")), "string", "object String");

    equal(go.Lang.getType(function () {return true; }), "function", "user function");
    equal(go.Lang.getType(Math.floor), "function", "built-in function");
    equal(go.Lang.getType(Array), "function", "built-in constructor");
    equal(go.Lang.getType(alert), "function", "host function (alert)");
    equal(go.Lang.getType(document.getElementById), "function", "host (dom) function");
    /*jslint evil: true */
    equal(go.Lang.getType(new Function('return true')), "function", "new Function");
    /*jslint evil: false */

    equal(go.Lang.getType([1, 2, 3]), "array", "literal array");
    equal(go.Lang.getType(new w.Array(1, 2, 3)), "array", "new Array");
    equal(go.Lang.getType([]), "array", "empty Array");

    equal(go.Lang.getType(/\s/), "regexp", "literal RegExp");
    equal(go.Lang.getType(new RegExp("^a")), "regexp", "new RegExp");

    equal(go.Lang.getType(new Error()), "error", "base Error");
    equal(go.Lang.getType(new TypeError()), "error", "specific Error");
    try {
        undef.method();
    } catch (e) {
        equal(go.Lang.getType(e), "error", "catch exception");
    }

    equal(go.Lang.getType(new Date()), "date", "date");

    div = document.createElement("div");
    span = document.createElement("span");
    equal(go.Lang.getType(div), "element", "HTMLDivElement");
    equal(go.Lang.getType(div), "element", "HTMLSpanElement");

    div.innerHTML = "<span>1</span> <span>2</span>";
    collection = div.getElementsByTagName("span");
    equal(go.Lang.getType(collection), "collection", "HTMLCollection");

    equal(go.Lang.getType(collection[0].firstChild), "textnode", "Text node");

    equal(go.Lang.getType(arguments), "arguments", "arguments object");

    equal(go.Lang.getType({'x': 5}), "object", "simple dict (literal)");
    equal(go.Lang.getType(new w.Object()), "object", "simple dict (new Object)");

    ConstructorEObject = function (x) {
        this.x = x;
    };
    ConstructorEObject.prototype.method = function () {};
    instance = new ConstructorEObject(7);
    equal(go.Lang.getType(instance), "object", "extended Object");

    ConstructorEObject.prototype.go$type = "user";
    equal(go.Lang.getType(instance), "user", "user defined type");
});

tests.test("getType and iframe", function () {
    var iframe = document.getElementById("iframe");
    function getResult(code) {
        return iframe.contentWindow.getResult(code);
    }
    equal(go.Lang.getType(iframe.contentWindow.getResult), "function", "user function");
    equal(go.Lang.getType(iframe.contentWindow.alert), "function", "builtin function");
    equal(go.Lang.getType(getResult("[1, 2, 3]")), "array", "eval Array");
    equal(go.Lang.getType(getResult("({x:5})")), "object", "eval Object");
    equal(go.Lang.getType(getResult("document.getElementById('test')")), "element", "eval DOMElement");
    equal(go.Lang.getType(getResult("document.getElementById('test').firstChild")), "textnode", "eval TextNode");
    equal(go.Lang.getType(getResult("document.getElementsByTagName('div')")), "collection", "eval HTMLCollection");
    equal(go.Lang.getType(getResult("/\\s/")), "regexp", "eval RegExp");
});

tests.test("isArray", function () {
    var astrict   = [1, 2, 3],
        asimilar1 = arguments,
        asimilar2 = document.body.childNodes,
        anone1    = {'x': 1},
        anone2    = 5,
        iframe = document.getElementById("iframe"),
        iframeCW = iframe.contentWindow,
        isArray = go.Lang.isArray;

    ok(isArray(astrict), "Array is nonstrict list");
    ok(isArray(asimilar1), "Arguments is nonstrict list");
    ok(isArray(asimilar2), "HTMLCollection is nonstrict list");
    ok(!isArray(anone1), "Object is not list");
    ok(!isArray(anone2), "Number is not list");

    ok(isArray(astrict, true), "Array is strict list");
    ok(!isArray(asimilar1, true), "Arguments is not strict list");
    ok(!isArray(asimilar2, true), "HTMLCollection is not strict list");
    ok(!isArray(anone1, true), "Object is not strict list");
    ok(!isArray(anone2, true), "Number is not strict list");

    ok(isArray(iframeCW.getResult('[1, 2, 3]'), true), "[] and iframe");
    ok(isArray(iframeCW.getResult('new Array()'), true), "new Array() and iframe");
    ok(isArray(iframeCW.getResult('document.getElementsByTagName("div")'), false), "collection and iframe (nonstict)");
    ok(!isArray(iframeCW.getResult('document.getElementsByTagName("div")'), true), "collection and iframe (strict)");
});

tests.test("isStrictArray", function () {
    ok(go.Lang.isStrictArray([1, 2, 3]), "Array is strict list");
    ok(!go.Lang.isStrictArray(arguments), "Arguments is not strict list");
    ok(!go.Lang.isStrictArray({'x': 1}), "Object is not strict list");
    ok(!go.Lang.isStrictArray(undefined), "Undefined is not strict list");
    ok(!go.Lang.isStrictArray(null), "Null is not strict list");
});

tests.test("toArray", function () {
    var toArray, value, expected;

    toArray = go.Lang.toArray;

    deepEqual(toArray([1, 2, 3]), [1, 2, 3], "array");

    value = (function () {return arguments; }(4, 5, 6));
    deepEqual(toArray(value), [4, 5, 6], "arguments");

    value = document.getElementsByTagName("div");
    expected = (function (collection) {
        var len = collection.length,
            i,
            result = [];
        for (i = 0; i < len; i += 1) {
            result.push(collection[i]);
        }
        return result;
    }(value));
    deepEqual(toArray(value), expected, "collection");

    value = {'x': "a", 'y': "b", 'z': "c"};
    tests.equalShuffledArrays(toArray(value), ["a", "b", "c"], "dict");

    deepEqual(toArray(1), [1], "number");
    deepEqual(toArray("string"), ["string"], "string");
    deepEqual(toArray(true), [true], "true");
    deepEqual(toArray(false), [false], "false");
    deepEqual(toArray(undefined), [], "null");
    deepEqual(toArray(undefined), [], "undefined");

    value = (function () {var C = function () {}; return new C(); }());
    deepEqual(toArray(value), [value], "object (no dict)");
});

tests.test("isDict", function () {
    var iframe = document.getElementById("iframe"),
        createNoDict,
        rproto;

    ok(go.Lang.isDict({'a': 1, 'b': 2}), "Object literal");
    ok(!go.Lang.isDict([1, 2]), "Array literal");
    ok(!go.Lang.isDict(document.createElement("div")), "DOMElement");
    ok(!go.Lang.isDict(function () {}), "Function");
    ok(!go.Lang.isDict(1), "Number");
    ok(!go.Lang.isDict(null), "null");
    ok(!go.Lang.isDict(), "undefined");

    ok(go.Lang.isDict(iframe.contentWindow.getResult('({x:5})')), "dict and iframe");
    ok(!go.Lang.isDict(iframe.contentWindow.getResult('[1,2,3]')), "array and iframe");
    createNoDict = "(function () {var C = function () {}; C.prototype.x=5; return (new C());})()";
    ok(!go.Lang.isDict(iframe.contentWindow.getResult(createNoDict)), "no dict and iframe");

    if (Object.getPrototypeOf) {
        /* Does not work for IE<9 */
        rproto = (function () {
            var C = function () {};
            C.prototype = {'x': 5};
            return (new C());
        }());
        ok(!go.Lang.isDict(rproto), "replace proto");
        rproto = "(function () {var C = function () {}; C.prototype={'x': 5}; return (new C());})()";
        ok(!go.Lang.isDict(iframe.contentWindow.getResult(rproto)), "replace proto and iframe");
    }
});

tests.test("getObjectKeys", function () {
    var Func, instance;

    tests.equalShuffledArrays(go.Lang.getObjectKeys({'x': 5, 'y': 6}), ["x", "y"], "Object");

    Func = function () {
        this.name = "name";
        this.prop = "prop";
    };
    Func.x = 5;
    Func.z = 7;
    tests.equalShuffledArrays(go.Lang.getObjectKeys(Func), ["x", "z"], "Function as Object");

    Func.prototype = {
        'p': 2
    };
    instance = new Func();
    tests.equalShuffledArrays(go.Lang.getObjectKeys(instance), ["name", "prop"], "Prototypes are not considered");
});

tests.test("each for array", function () {
    var iter, fn, expected, div;

    iter = [1, 2, 3];
    fn = function (value, key, iter) {
        return value + ":" + key + ":" + iter.length + ":" + this.name;
    };
    expected = ["1:0:3:t", "2:1:3:t", "3:2:3:t"];
    deepEqual(go.Lang.each(iter, fn, {'name': "t"}), expected, "iterate array");

    div = document.createElement("div");
    div.innerHTML = "<span>one</span> <span>two</span>";
    iter = div.getElementsByTagName("span");
    fn = function (value) {
        return value.firstChild.nodeValue;
    };
    expected = ["one", "two"];
    deepEqual(go.Lang.each(iter, fn), expected, "iterate collection");

    iter = (function () {return arguments; }(5, 4, 3));
    fn = function (value) {
        return value + 1;
    };
    expected = [6, 5, 4];
    deepEqual(go.Lang.each(iter, fn), expected, "iterate arguments object");
});

tests.test("each for object", function () {
    var objPrototype = {'a' : 1, 'b' : 2},
        obj,
        expected,
        deepResult;
    function ObjConstructor(b, c) {
        this.b = b;
        this.c = c;
    }
    ObjConstructor.prototype = objPrototype;
    obj = new ObjConstructor(3, 4);

    function fn(value, key) {
        return key + "=>" + value;
    }
    expected = {
        'b' : "b=>3",
        'c' : "c=>4"
    };
    deepEqual(go.Lang.each(obj, fn), expected, "Not deep");

    deepResult = go.Lang.each(obj, fn, null, true);
    equal(deepResult.a, "a=>1", "deep");
    equal(deepResult.b, "b=>3", "deep");
    equal(deepResult.c, "c=>4", "deep");
});

tests.test("each: running in a given context", function () {
    var objV, objF, expected;
    objV = {
        'a': "x",
        'b': "y",
        'c': "z"
    };
    objF = {
        'x': 5,
        'y': 7,
        'z': 9,
        'f': function (value) {
            return this[value];
        }
    };
    expected = {
        'a': 5,
        'b': 7,
        'c': 9
    };
    deepEqual(go.Lang.each(objV, objF.f, objF), expected, "Running each() in a given context");
});

tests.test("copy", function () {
    var srcArray  = [1, 2, 3, 4, 5],
        srcObject = {'x': 5, 'y': 6},
        copyArray,
        copyObject;

    copyArray = go.Lang.copy(srcArray);
    deepEqual(copyArray, srcArray, "(Array): Copy equal src");
    ok(copyArray !== srcArray, "(Array): Copy is not src");
    copyArray.push(6);
    equal(copyArray.length - srcArray.length, 1, "(Array): Source is not changed depending on the copy");

    copyObject = go.Lang.copy(srcObject);
    deepEqual(copyObject, srcObject, "(Object): Copy equal src");
    ok(copyObject !== srcObject, "(Object): Copy is not src");
    copyObject.y = 7;
    equal(srcObject.y, 6, "(Object): Source is not changed depending on the copy");
});

tests.test("extend", function () {
    var objDest, objSrc, objPSrc, ConstrSrc, expected;

    objDest = {
        'a': "dest a",
        'b': "dest b",
        'c': "dest c"
    };
    objPSrc = {
        'b': "proto b",
        'c': "proto c"
    };
    ConstrSrc = function () {};
    ConstrSrc.prototype = objPSrc;
    objSrc = new ConstrSrc();
    objSrc.c = "src c";
    objSrc.d = "src d";

    expected = {
        'a': "dest a",
        'b': "dest b",
        'c': "src c",
        'd': "src d"
    };
    deepEqual(go.Lang.extend(objDest, objSrc), expected, "extend() not deep");
    deepEqual(objDest, expected, "Destination changes on the spot (not deep)");

    objDest = {
        'a': "dest a",
        'b': "dest b",
        'c': "dest c"
    };
    expected = {
        'a': "dest a",
        'b': "proto b",
        'c': "src c",
        'd': "src d"
    };
    deepEqual(go.Lang.extend(objDest, objSrc, true), expected, "extend() deep");
    deepEqual(objDest, expected, "Destination changes on the spot (deep)");
});

tests.test("merge", function () {
    var destination, source, expected;
    destination = {
        'a': "only in dest",
        'c': "c-dest",
        'd': {'x': 5},
        'e': 1,
        'f': {
            'g': 7,
            'j': {
                'x': 1,
                'y': 2
            }
        }
    };
    source = {
        'b': "only in source",
        'c': "c-source",
        'd': [1, 2],
        'e': {'x': 6},
        'f': {
            'h': 8,
            'j': {
                'x': 3,
                'z': 4
            }
        }
    };
    expected = {
        'a': "only in dest",
        'b': "only in source",
        'c': "c-source",
        'd': [1, 2],
        'e': {'x': 6},
        'f': {
            'g': 7,
            'h': 8,
            'j': {
                'x': 3,
                'y': 2,
                'z': 4
            }
        }
    };

    equal(go.Lang.merge(destination, source), destination, "Merge");
    deepEqual(destination, expected, "Destination changes on the spot (deep)");
});

tests.test("inArray", function () {
    var obj1, obj2, haystack;
    obj1 = {'x': 5};
    obj2 = {'x': 5};
    haystack = [1, 3, "5", obj1];

    ok(go.Lang.inArray(1, haystack), "Number in array");
    ok(go.Lang.inArray(3, haystack), "Number in array");
    ok(go.Lang.inArray("5", haystack), "String in array");
    ok(go.Lang.inArray(obj1, haystack), "Object in array");

    ok(!go.Lang.inArray(true, haystack), "No type casting (boolean)");
    ok(!go.Lang.inArray("3", haystack), "No type casting (string)");
    ok(!go.Lang.inArray(5, haystack), "Not type casting (number)");
    ok(!go.Lang.inArray(obj2, haystack), "Objects - individual");
});

tests.test("inherit", function () {
    var One, Two, Three, Constr, instanceTwo, instanceThree;

    One = go.Lang.inherit();
    Two = go.Lang.inherit(null, One, {
        'x': 5,
        'method': function () {
            return "Method: " + this.x;
        }
    });

    Constr = function Constr(x) {
        this.x = x;
    };
    Three = go.Lang.inherit(Constr, Two, {
        'method3': function () {
            return 'Method3!';
        }
    });

    instanceTwo = new Two();
    instanceThree = new Three(10);

    ok(instanceTwo instanceof One, "instance of Parent (two)");
    ok(instanceTwo instanceof Two, "instance of Self (two)");
    ok(!(instanceTwo instanceof Three), "not instance of Child (two)");
    ok(instanceThree instanceof One, "instance of Parent (three)");
    ok(instanceThree instanceof Two, "instance of Parent (three)");
    ok(instanceThree instanceof Three, "instance of Self (three)");

    equal(instanceTwo.method(), "Method: 5", "Inherited method and property");
    equal(instanceThree.method(), "Method: 10", "Override property in constructor");
    ok(!instanceTwo.method3, "Parent not inherit methods of child");
    equal(instanceThree.method3(), "Method3!", "self method");

    equal(instanceTwo.constructor, Two, "link on constructor");
    equal(instanceThree.constructor, Three, "link on constructor");
});

tests.test("go.Lang.f", function () {
    var fonce, obj, fcomp, Singleton, instance, undef;

    equal(go.Lang.f.empty(), undef, "empty");
    equal(go.Lang.f.ffalse(), false, "ffalse");
    equal(go.Lang.f.ftrue(), true, "ftrue");
    equal(go.Lang.f.identity(123), 123, "identity");

    fonce = function (x) {this.i += x; return this.i; };
    obj = {
        'i': 3
    };
    obj.fonce = go.Lang.f.once(fonce);
    equal(obj.fonce(5), 8, "once: first run");
    equal(obj.i, 8, "once: property changed");
    equal(obj.fonce(4), 8, "once: no longer works");
    equal(obj.i, 8, "once: property not changed");

    Singleton = function () {
        this.x = 1;
        this.y = 2;
        return this;
    };

    Singleton = go.Lang.f.once(Singleton);

    instance = new Singleton();
    equal(instance.y, 2, "once: instance of Singleton");
    equal(new Singleton(), instance, "Singleton same Singleton");

    obj.i = 10;
    fcomp = go.Lang.f.compose([
        function (x, y) {return x + ":" + y + ":" + this.i; },
        function (value) {return "two:" + value; },
        function (value) {return value + ":three"; }
    ], obj);
    equal(fcomp(1, 2), "two:1:2:10:three", "compose");
});

tests.test("go.Lang.Exception", function () {
    var MyBaseError = go.Lang.Exception.create("MyBaseError"),
        MyConcreteError = go.Lang.Exception.create("MyConcreteError", MyBaseError),
        NotBaseError = go.Lang.Exception.create("NotBaseError", TypeError),
        DefMessageError = go.Lang.Exception.create("DefMessageError", null, "default message"),
        ne;

    try {
        throw new MyConcreteError("Oh, error!");
    } catch (e) {
        equal(e.name, "MyConcreteError", "e.name");
        equal(e.message, "Oh, error!", "e.message");
        if (Error.prototype.fileName !== undefined) {
            ne = new Error();
            ok(e.fileName, "e.fileName is not empty");
            equal(e.fileName, ne.fileName, "e.fileName is ok");
        }
        ok(e instanceof MyConcreteError, "e instance of self");
        ok(e instanceof MyBaseError, "e instance of parent");
        ok(e instanceof go.Lang.Exception, "e instance of go-exception");
        ok(e instanceof go.Lang.Exception.Base, "Exception.Base is alias");
        ok(e instanceof Error, "e instance of Error");
        ok(!(e instanceof TypeError), "e is not instance of TypeError");
    }

    try {
        throw new NotBaseError("Not base error");
    } catch (e2) {
        ok(!(e2 instanceof go.Lang.Exception), "Inherit bypass go.Exception");
        ok(e2 instanceof TypeError, "Inherit bypass go.Exception");
    }

    try {
        throw new DefMessageError();
    } catch (e3) {
        equal(e3.message, "default message", "Default message");
    }

    try {
        throw new DefMessageError("not default message");
    } catch (e4) {
        equal(e4.message, "not default message", "Not default message");
    }
});

tests.test("go.Lang.Exception.block()", function () {
    var block, instance;

    block = new go.Lang.Exception.Block();

    block = new go.Lang.Exception.Block({
        'Logic'     : true,
        'Runtime'   : true,
        'NotFound'  : "Logic",
        'Unknown'   : ["Logic", "This is undefined"],
        'Other'     : Error
    }, "MyLib.Exceptions");

    instance = new block.Unknown();
    equal(instance.name, "MyLib.Exceptions.Unknown", "e.name");
    equal(instance.message, "This is undefined", "e.message (default)");
    ok(instance instanceof block.Logic, "instance by Name");
    ok(instance instanceof block.Base, "instance by Base");
    ok(instance instanceof go.Lang.Exception);

    instance = new block.Other();
    ok(!(instance instanceof block.Base), "Inherit bypass Base");
    ok(instance instanceof Error, "Inherit bypass Base");

    instance = new block.NotFound();
    equal(instance.name, "MyLib.Exceptions.NotFound", "e.name (string params)");
    ok(instance instanceof block.Logic, "instance by Name (string params)");

    equal(block.get("Runtime"), block.Runtime, "get()");
    ok(!block.get("Qwerty"), "get undefined");
    try {
        block.raise("NotFound", "msg");
        throw new Error();
    } catch (e) {
        ok(e instanceof block.NotFound, "raise()");
        equal(e.message, "msg", "raise() and message");
    }

    block = new go.Lang.Exception.Block({
        'Logic'     : true,
        'NotFound'  : "Logic"
    }, "MyLib.Exceptions", "OBase");
    ok(!block.Base, "Rename Base");
    instance = new block.NotFound();
    ok(instance instanceof block.OBase, "Rename Base");

    block = new go.Lang.Exception.Block({
        'Logic'     : true,
        'NotFound'  : "Logic"
    }, "MyLib.Exceptions", false);
    ok(!block.Base, "Remove Base");
});

tests.test("go.Lang.Exception.block() lazy", function () {
    var block, instance, E;

    block = new go.Lang.Exception.Block({
        'Logic'     : true,
        'Runtime'   : true,
        'NotFound'  : "Logic",
        'Unknown'   : ["Logic", "This is undefined"],
        'Other'     : Error
    }, "MyLib.Exceptions", true, true);

    ok(!block.Unknown);
    ok(!block.Logic);

    E = block.get("Unknown");
    instance = new E();
    equal(instance.name, "MyLib.Exceptions.Unknown", "e.name");
    equal(instance.message, "This is undefined", "e.message (default)");
    ok(instance instanceof block.get("Logic"), "instance by Name");
    ok(instance instanceof block.get("Base"), "instance by Base");
    ok(instance instanceof go.Lang.Exception);

    equal(block.get("Logic"), block.get("Logic"));

    try {
        block.raise("NotFound");
        throw new Error();
    } catch (e) {
        ok(e instanceof block.get("NotFound"));
    }

    ok(!block.Runtime);
    ok(!block.Other);

    block.createAll();
    ok(block.Runtime);
    ok(block.Other);
});


tests.test("go.Lang.Listeners.create", function () {
    var listener, f1, f2, f3, result, idf2;

    f1 = function (t) {
        if (!t) {
            t = 0;
        }
        result.push(1 + t);
    };
    f2 = function () {
        result.push(2);
    };
    f3 = function () {
        result.push(3);
    };

    listener = go.Lang.Listeners.create(f1);

    result = [];
    listener();
    deepEqual(result, [1]);
    listener.ping(10);
    deepEqual(result, [1, 11]);

    result = [];
    idf2 = listener.append(f2);
    equal(idf2, listener.append(f2, true));
    listener();
    listener.append(f3);
    listener(10);
    deepEqual(result, [1, 2, 11, 2, 3]);

    result = [];
    ok(listener.remove(idf2));
    listener();
    ok(!listener.remove(idf2));
    ok(listener.remove(f3));
    listener();
    ok(!listener.remove(f3));
    deepEqual(result, [1, 3, 1]);
});

tests.test("go.Lang.Listeners.Listener::remove(all)", function () {
    var f1, f2, log, listener;

    f1 = function () {
        log.push(1);
    };

    f2 = function () {
        log.push(2);
    };

    listener = go.Lang.Listeners.create();

    listener.append(f2);
    listener.append(f1);
    listener.append(f2);
    listener.append(f1);
    listener.append(f2);
    listener.append(f1, true);

    log = [];
    listener.ping();
    deepEqual(log, [2, 1, 2, 1, 2]);

    log = [];
    listener.remove(f2);
    listener.ping();
    deepEqual(log, [1, 2, 1, 2]);

    log = [];
    listener.remove(f1, true);
    listener.ping();
    deepEqual(log, [2, 2]);
});

tests.test("go.Lang.Listeners.createCounter", function () {
    var f1, f2, f3, listener1, listener2, counter1, counter2, counter3, result;

    f1 = function () {
        result.push(1);
    };
    f2 = function () {
        result.push(2);
    };
    f3 = function () {
        result.push(3);
    };

    result = [];
    listener1 = go.Lang.Listeners.create([f1, f2]);
    counter1  = go.Lang.Listeners.createCounter(5, listener1);
    counter2  = go.Lang.Listeners.createCounter(3, f3);
    counter3  = go.Lang.Listeners.createCounter(0, f1);
    listener2 = go.Lang.Listeners.create([counter1, counter2, counter3]);
    deepEqual(result, [1]);

    result = [];
    listener2();
    listener2();
    deepEqual(result, []);
    listener2();
    deepEqual(result, [3]);
    listener2();
    deepEqual(result, [3]);
    listener2();
    deepEqual(result, [3, 1, 2]);
    listener2();
    deepEqual(result, [3, 1, 2]);

    result = [];
    counter3 = go.Lang.Listeners.createCounter(null, f1);
    deepEqual(result, []);
    counter3.inc();
    counter3.inc(2);
    counter3();
    counter3.inc();
    counter3();
    counter3();
    deepEqual(result, []);
    counter3();
    deepEqual(result, [1]);
    counter3.inc();
    counter3();
    deepEqual(result, [1]);

    result = [];
    counter3 = go.Lang.Listeners.createCounter(null, f1);
    counter3.filled();
    deepEqual(result, [1]);
});

tests.test("go.Lang.Listeners.Counter: filled and empty count", function () {
    var ex, handler, counter;

    handler = function () {
        ex = true;
    };

    ex = false;
    counter = go.Lang.Listeners.createCounter(0, handler);
    ok(ex);

    ex = false;
    counter = go.Lang.Listeners.createCounter("0", handler);
    ok(ex);

    ex = false;
    counter = go.Lang.Listeners.createCounter("2", handler);
    ok(!ex);
    counter();
    ok(!ex);
    counter();
    ok(ex);

    ex = false;
    counter = go.Lang.Listeners.createCounter(null, handler);
    ok(!ex);
    counter.filled();
    ok(ex);
    ex = false;
    counter.filled();
    counter();
    ok(!ex);
});