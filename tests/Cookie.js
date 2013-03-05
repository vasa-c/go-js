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

