/**
 * Testing the module go.Cookie
 *
 * @package    go.js
 * @subpackage Cookie
 * @author     Grigoriev Oleg aka vasa_c <go.vasac@gmail.com>
 */
/*jslint node: true, nomen: true */
/*global document, go, tests, ok, equal, deepEqual, throws */
"use strict";

tests.module("Cookie");

tests.test("Parse expires", function () {

    var parse = go.Cookie.CookieClass.parseExpires,
        now = new Date(),
        nowc,
        result;

    now.setMilliseconds(0);

    result = parse(now, now);
    equal(result.toUTCString(), now.toUTCString(), "Date object");

    result = parse(1200, now);
    equal(result.getTime() - now.getTime(), 1200000, "Number of seconds (as number)");

    result = parse("1200", now);
    equal(result.getTime() - now.getTime(), 1200000, "Number of seconds (as numeric string)");

    result = parse(1234567890123, now);
    equal(result.toUTCString().replace("UTC", "GMT"), "Fri, 13 Feb 2009 23:31:30 GMT", "Unix timestamp"); // replace for IE

    result = parse("minute", now);
    equal(result.getTime() - now.getTime(), 60000, 'Const "minute"');

    result = parse("hour", now);
    equal(result.getTime() - now.getTime(), 3600000, 'Const "hour"');

    result = parse("day", now);
    equal(result.getTime() - now.getTime(), 86400000, 'Const "day"');

    result = parse("week", now);
    equal(result.getTime() - now.getTime(), 86400000 * 7, 'Const "week"');

    nowc = new Date("Fri, 13 Feb 2009 23:31:30 GMT");
    result = parse("month", nowc);
    equal(result.toUTCString().replace("UTC", "GMT"), "Fri, 13 Mar 2009 23:31:30 GMT", 'Const "month"');
    result = parse("year", nowc);
    equal(result.toUTCString().replace("UTC", "GMT"), "Sat, 13 Feb 2010 23:31:30 GMT", 'Const "year"');
    nowc = new Date("Fri, 14 Dec 2012 23:31:30 GMT");
    result = parse("month", nowc);
    equal(result.toUTCString().replace("UTC", "GMT"), "Mon, 14 Jan 2013 23:31:30 GMT", 'Const "month" and year overflow');

    result = parse("delete", now);
    ok(result.getTime() < now.getTime(), 'Const "delete"');

    result = parse("session", now);
    ok(!result, 'Const "session"');

    result = parse("forever", now);
    ok(result.getFullYear() - now.getFullYear() >= 10, 'Const "forever"');

    throws(
        function () {
            parse("vtrfg45et45t");
        },
        go.Cookie.CookieClass.Exceptions.ErrorExpires,
        "Parsing error (string)"
    );

    throws(
        function () {
            parse({});
        },
        go.Cookie.CookieClass.Exceptions.ErrorExpires,
        "Parsing error (object)"
    );
});

tests.test("Test with wrapper", function () {

    var WrapperClass, cooks, params, wrapper, now = new Date("Tue, 12 Mar 2013 15:41:06 GMT");

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
    }, "All cookies have been set");

    deepEqual(params.one, {}, 'Parameters of "one" is ok');

    deepEqual(params.two, {'expires': "Tue, 12 Mar 2013 15:41:16 GMT", 'path': "/"}, 'Parameters of "two" is ok (inc expires and default secure)');
    deepEqual(params.three, {'domain': ".example.com", 'secure': true}, 'Parameters of "three" is ok');
    deepEqual(params.four, {'expires': "Tue, 12 Mar 2013 16:41:06 GMT", 'path': "/path/"}, 'Parameters of "four" is ok (inc expires)');

    equal(wrapper.get("start"), 5, "Original cookie");
    equal(wrapper.get("one"), 10, "Out cookie");
    equal(wrapper.get("three"), "Рус", "Cyrillic cookie");
    equal(typeof wrapper.get("ten"), "undefined", "Undefined cookie");

    deepEqual(wrapper.getAll(), {
        'start': "5",
        'one': "10",
        'two': "11",
        'three': "Рус",
        'four': "12"
    }, "getAll()");

    wrapper.remove("one");
    equal(cooks.one, "deleted", "Remove cookie");
    ok((new Date(params.one.expires)).getTime() < now.getTime(), "Expires in the past (for removed cookie)");

    wrapper.setOption("path", "");
    wrapper.setOption("max-age", true);
    wrapper.set("one", 5, {'expires': "Tue, 12 Mar 2013 16:41:06 GMT"});
    deepEqual(params.one, {
        'max-age': "3600"
    }, "max-age");
});

tests.test("Test real", function () {
    document.cookie = "xxx=deleted;Expires=Fri, 02 Jan 1970 00:00:00 GMT";
    document.cookie = "yyy=deleted;Expires=Fri, 02 Jan 1970 00:00:00 GMT";
    ok(!go.Cookie.get("xxx"), "Cookie xxx originally did not exist");
    ok(!go.Cookie.get("yyy"), "Cookie yyy originally did not exist");
    go.Cookie.set("xxx", 10);
    document.cookie = "yyy=20";
    equal(go.Cookie.get("xxx"), 10, "Cookie xxx is 10 (set via set())");
    equal(go.Cookie.get("yyy"), 20, "Cookie yyy is 20 (set via document.cookie)");
    go.Cookie.remove("xxx");
    go.Cookie.remove("yyy");
    ok(!go.Cookie.get("xxx"), "Cookie xxx is deleted");
    ok(!go.Cookie.get("yyy"), "Cookie yyy is deleted");
});