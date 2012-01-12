/**
 * go.Class: надстройка над ООП с "классовым" синтаксисом
 *
 * @package    go.js
 * @subpackage Class
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global go, window */
"use strict";

if (!window.go) {
    throw new Error("go.core is not found");
}

go("Class", (function () {

    function Class(props) {

        function FakeConstruct() {
        }
        function Construct() {
            if (!(this instanceof Construct)) {
                // @todo когда this может быть внезапно instanceof?
                var obj = new FakeConstruct();
                Construct.apply(obj, arguments);
                return obj;
            }
        }
        Construct.prototype = props;
        FakeConstruct.prototype = props;

        return Construct;
    }

    return Class;
}()));