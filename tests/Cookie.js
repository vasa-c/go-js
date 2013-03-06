/**
 * Тестирование модуля go.Cookie
 *
 * @package    go.js
 * @subpackage Class
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual, raises */
"use strict";

tests.module("Cookie");

tests.test("Parse expires", function () {

    var parse = go.Cookie.CookieClass.parseExpires,
        now = new Date(),
        nowc,
        result;

    now.setMilliseconds(0);

    result = parse(now, now);
    equal(result.toUTCString(), now.toUTCString());

    result = parse(1200, now);
    equal(result.getTime() - now.getTime(), 1200000);

    result = parse("1200", now);
    equal(result.getTime() - now.getTime(), 1200000);

    result = parse(1234567890123, now);
    equal(result.toUTCString(), "Fri, 13 Feb 2009 23:31:30 GMT");

    result = parse("minute", now);
    equal(result.getTime() - now.getTime(), 60000);

    result = parse("hour", now);
    equal(result.getTime() - now.getTime(), 3600000);

    result = parse("day", now);
    equal(result.getTime() - now.getTime(), 86400000);

    result = parse("week", now);
    equal(result.getTime() - now.getTime(), 86400000 * 7);

    nowc = new Date("Fri, 13 Feb 2009 23:31:30 GMT");
    result = parse("month", nowc);
    equal(result.toUTCString(), "Fri, 13 Mar 2009 23:31:30 GMT");
    result = parse("year", nowc);
    equal(result.toUTCString(), "Sat, 13 Feb 2010 23:31:30 GMT");
    nowc = new Date("Fri, 07 Dec 2012 23:31:30 GMT");
    result = parse("month", nowc);
    equal(result.toUTCString(), "Mon, 07 Jan 2013 23:31:30 GMT");

    result = parse("delete", now);
    ok(result.getTime() < now.getTime());

    result = parse("session", now);
    ok(!result);

    raises(
        function () {
            parse("vtrfg45et45t");
        },
        go.Cookie.CookieClass.Exceptions.Error
    );

    raises(
        function () {
            parse({});
        },
        go.Cookie.CookieClass.Exceptions.Error
    );
});

tests.test("Test with wrapper", function () {

    var WrapperClass, cooks, params, wrapper, now = new Date("Tue, 05 Mar 2013 15:41:06 GMT");

    /**
     * @augments go.Cookie.CookieClass
     */
    WrapperClass = go.Class(go.Cookie.CookieClass, {

        /**
         * @override
         */
        'saveCookieHeader': function (header) {
            var i, len, h, result = {};
            header = header.split(";");
            h = header[0].split("=", 2);
            cooks[h[0]] = h[1];
            params[h[0]] = result;
            for (i = 1, len = header.length; i < len; i += 1) {
                h = header[i].split("=", 2);
                result[h[0].toLowerCase().replace(/^\s+/, "").replace(/\s+$/, "")] = (h[1] || true);
            }
        },

        /**
         * @override
         */
        'loadCookieHeader': function () {
            var k, result = [];
            for (k in cooks) {
                if (cooks.hasOwnProperty(k)) {
                    result.push(k + "=" + cooks[k]);
                }
            }
            return result.join("; ");
        },

        /**
         * @override
         */
        'getNow': function () {
            return now;
        }

    });

    wrapper = new WrapperClass();

    cooks = {
        'start': "5"
    };
    params = {
        'start': {}
    };

    wrapper.set("one", 10);
    wrapper.set("two", 11, {'expires': 10, 'path': "/", 'secure': false});
    wrapper.set("three", "Рус", {'domain': ".example.com", 'secure': true});

    wrapper.setOption("path", "/path/");
    wrapper.set("four", 12, {'expires': "hour"});

    deepEqual(cooks, {
        'start': "5",
        'one': "10",
        'two': "11",
        'three': encodeURIComponent("Рус"),
        'four': "12"
    });

    deepEqual(params.one, {});
    deepEqual(params.two, {'expires': "Tue, 05 Mar 2013 15:41:16 GMT", 'path': "/"});
    deepEqual(params.three, {'domain': ".example.com", 'secure': true});
    deepEqual(params.four, {'expires': "Tue, 05 Mar 2013 16:41:06 GMT", 'path': "/path/"});

    equal(wrapper.get("start"), 5);
    equal(wrapper.get("one"), 10);
    equal(wrapper.get("three"), "Рус");
    equal(typeof wrapper.get("ten"), "undefined");

    deepEqual(wrapper.getAll(), {
        'start': "5",
        'one': "10",
        'two': "11",
        'three': "Рус",
        'four': "12"
    });

    wrapper.remove("one");
    equal(cooks.one, "deleted");
    ok((new Date(params.one.expires)).getTime() < now.getTime());
});

tests.test("Test real", function () {
    ok(!go.Cookie.get("xxx"));
    ok(!go.Cookie.get("yyy"));
    go.Cookie.set("xxx", 10);
    document.cookie = "yyy=20";
    equal(go.Cookie.get("xxx"), 10);
    equal(go.Cookie.get("yyy"), 20);
    go.Cookie.remove("xxx");
    go.Cookie.remove("yyy");
    ok(!go.Cookie.get("xxx"));
    ok(!go.Cookie.get("yyy"));
});