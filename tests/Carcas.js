/**
 * Тестирование модуля go.Carcas
 *
 * @package    go.js
 * @subpackage Carcas
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual, throws */
"use strict";

tests.module("Carcas");

tests.test("Carcas.getInstance()", function () {
    var instance = go.Carcas.getInstance();
    ok(instance instanceof go.Carcas);
    equal(instance, go.Carcas.getInstance());
});

tests.test("Parse deps", function () {

    var depsString = "c:page1, mo:one, mo:one.two.Three, go:Cookies, l:fancybox, page2, layout.default, mo:four.Five",
        depsDict = {
            'controllers' : ["page1", "page2", "layout.default"],
            'modules'     : ["one", "one.two.Three", "four.Five"],
            'go'          : ["Cookies"],
            'otherLibs'   : ["fancybox"]
        };

    deepEqual(go.Carcas.Helpers.parseDeps(depsString, "c"), depsDict);

    throws(
        function () {
            go.Carcas.Helpers.parseDeps(depsString);
        },
        go.Carcas.Exceptions.ErrorDependence,
        "undefined prefix"
    );

    throws(
        function () {
            var depsString = "mo:one, x:two, c:three";
            go.Carcas.Helpers.parseDeps(depsString, "c");
        },
        go.Carcas.Exceptions.ErrorDependence,
        "unknown prefix"
    );

    throws(
        function () {
            var depsString = "mo:one, mo:one:two";
            go.Carcas.Helpers.parseDeps(depsString, "c");
        },
        go.Carcas.Exceptions.ErrorDependence,
        "error format"
    );
});
