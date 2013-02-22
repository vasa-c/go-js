/**
 * go.Class: надстройка над ООП с "классовым" синтаксисом
 *
 * @package    go.js
 * @subpackage Carcas
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global go, window */

"use strict";

if (!window.go) {
    throw new Error("go.core is not found");
}

go("Carcas", ["Class", "Ext"], function (go) {

    /**
     * @class go.Carcas
     */
    var Carcas = go.Class({

        '__static': {

            /**
             * @name go.Carcas.getInstance
             * @public
             * @return {go.Carcas}
             */
            'getInstance': function () {
                if (!this.instance) {
                    this.instance = new this();
                }
                return this.instance;
            },

            /**
             * @name go.Carcas.mo
             * @alias go.Carcas#mo
             * @return {Boolean}
             */
            'mo': function (name, reqs, fmodule) {
                return this.getInstance().mo(name, reqs, fmodule);
            },

            /**
             * @name go.Carcas.c
             * @alias go.Carcas#c
             * @return {Boolean}
             */
            'c': function (name, reqs, props) {
                return this.getInstance().c(name, reqs, props);
            }
        },

        /**
         * @lends go.Carcas.prototype
         */

        /**
         * Общедоступный реестр
         *
         * @name go.Carcas#registry
         * @public
         * @type {Object}
         */
        'registry': null,

        /**
         * Список загруженных контроллеров
         *
         * @name go.Carcas#controllers
         * @public
         * @type {Object.<String, go.Class.Controller>}
         */
        'controllers': null,

        /**
         * Загрузчик дополнительных библиотек
         *
         * @private
         * @type {Function(Array.<String [, Function])}
         */
        'libsLoader': null,

        /**
         * @constructs
         */
        '__construct': function () {
        },

        /**
         * Определение модуля
         *
         * @name go.Carcas#mo
         * @public
         * @param {String} name
         *        имя модуля
         * @param {(String|Object)} [reqs]
         *        зависимости
         * @param {Function} fmodule
         *        функция-конструктор модуля
         * @return {Boolean}
         *         был ли модуль создан сразу же (все зависимости есть)
         */
        'mo': function (name, reqs, fmodule) {
            if (!fmodule) {
                fmodule = reqs;
                reqs = [];
            }
            // @todo        
        },

        /**
         * Определение контроллера
         *
         * @name go.Carcas#c
         * @public
         * @param {String} name
         *        имя контроллера
         * @param {(String|Object)} [reqs]
         *        зависимости
         * @param {Object} props
         *        поля класса контроллера (расширение go.Carcas.Controller)
         * @return {Boolean}
         *         был ли контроллер создан сразу же (все зависимости есть)
         */
        'c': function (name, reqs, props) {
            if (!props) {
                props = reqs;
                reqs = [];
            }
            // @todo
        },

        /**
         * Указать загрузчик дополнительных библиотек
         *
         * @param {Function(Array.<String> [, Function])} loader
         */
        'setLibsLoader': function (loader) {
            this.libsLoader = loader;
        },

        'eoc': null
    });

    /**
     * @class go.Carcas.Controller
     *        базовый класс контроллеров
     * @augments go.Ext.Nodes
     */
    Carcas.Controller = go.Class([null, go.Ext.Nodes], {
        '__classname': "go.Carcas.Controller",
        '__abstract': true,

        /**
         * @lends go.Carcas.Controller.prototype
         */

        /**
         * @name go.Carcas.Controller#carcas
         * @protected
         * @type {go.Carcas}
         */
        'carcas': null,

        /**
         * @constructs
         * @param {go.Carcas} carcas
         * @param {go} go
         * @param {window} global
         */
        '__construct': function (carcas, go, global) {
            this.carcas = carcas;
            this.go = go;
            this.global = global;
        },

        'eoc': null
    });

    return Carcas;
});
