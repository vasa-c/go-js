/**
 * go.Carcas: небольшой фреймворк
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

        /**
         * @ignore
         */
        '__static': {

            /**
             * @name go.Carcas.getInstance
             * @public
             * @static
             * @return {go.Carcas}
             */
            'getInstance': function () {
                if (!this.instance) {
                    this.instance = new this();
                }
                return this.instance;
            },

            /**
             * @name go.Carcas.init
             * @alias go.Carcas#init
             * @public
             * @static
             * @param {Object} params
             * @throws {go.Carcas.Exceptions.AlreadyInited}
             */
            'init': function (params) {
                this.getInstance().init(params);
            },

            /**
             * @name go.Carcas.module
             * @alias go.Carcas#module
             * @public
             * @static
             * @return {Boolean}
             * @throws go.Carcas.Exceptions.NotInited
             * @throws go.Carcas.Exceptions.ModuleRedeclare
             */
            'module': function (name, reqs, fmodule) {
                return this.getInstance().module(name, reqs, fmodule);
            },

            /**
             * @name go.Carcas.controller
             * @alias go.Carcas#controller
             * @public
             * @static
             * @return {Boolean}
             * @throws go.Carcas.Exceptions.NotInited
             * @throws go.Carcas.Exceptions.ControllerRedeclare
             */
            'controller': function (name, reqs, props) {
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
         * @name go.Carcas#controllersList
         * @public
         * @type {Object.<String, go.Class.Controller>}
         */
        'controllersList': null,

        /**
         * Список загруженных модулей
         *
         * @name go.Carcas#modulesList
         * @public
         * @type {Object.<String, Object>}
         */
        'modulesList': null,

        /**
         * Список загруженных модулей
         *
         * @name go.Carcas#mo
         * @alias go.Carcas#modulesList
         * @public
         * @type {Object.<String, Object>}
         */
        'mo': null,

        /**
         * Загрузчик дополнительных библиотек
         *
         * @private
         * @type {Function(Array.<String [, Function])}
         */
        'otherLibsLoader': null,

        /**
         * Был ли каркас инициализован
         *
         * @private
         * @type {Boolean}
         */
        'inited': false,

        /**
         * @constructs
         */
        '__construct': function () {
        },

        /**
         * Инициализация и запуск каркаса
         *
         * @name go.Carcas#init
         * @public
         * @param {Object} params
         *        параметры (реестр, загружаемые контроллеры и т.п)
         * @throws {go.Carcas.Exceptions.AlreadyInited}
         */
        'init': function (params) {
            if (this.inited) {
                throw new go.Carcas.Exceptions.AlreadyInited();
            }
            this.inited = true;
            this.registry = (typeof params.registry === "object") ? params.registry : {};
            this.otherLibsLoader = params.otherLibsLoader;
            this.controllersList = {};
            this.modulesList = {};
            this.mo = this.modulesList;
            // @todo (load controllers)
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
         * @throws go.Carcas.Exceptions.NotInited
         * @throws go.Carcas.Exceptions.ModuleRedeclare
         */
        'module': function (name, reqs, fmodule) {
            if (!fmodule) {
                fmodule = reqs;
                reqs = [];
            }
            // @todo        
        },

        /**
         * Определение контроллера
         *
         * @name go.Carcas#controller
         * @public
         * @param {String} name
         *        имя контроллера
         * @param {(String|Object)} [reqs]
         *        зависимости
         * @param {Object} props
         *        поля класса контроллера (расширение go.Carcas.Controller)
         * @return {Boolean}
         *         был ли контроллер создан сразу же (все зависимости есть)
         * @throws go.Carcas.Exceptions.NotInited
         * @throws go.Carcas.Exceptions.ControllerRedeclare
         */
        'controller': function (name, reqs, props) {
            if (!props) {
                props = reqs;
                reqs = [];
            }
            // @todo
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
         */
        '__construct': function (carcas) {
            this.carcas = carcas;
            this.oncreate();
        },

        /**
         * @destructs
         */
        '__destruct': function () {
        },

        /**
         * Действия после создания объекта
         *
         * @name go.Carcas.Controller#oncreate
         * @protected
         * @return void
         */
        'oncreate': function () {
            // переопределятеся у потомков
        },

        /**
         * Действия после загрузки DOM
         *
         * @name go.Carcas.Controller#init
         * @protected
         * @return void
         */
        'init': function () {
            // переопределяется у потомков
        },

        /**
         * Действия после загрузки всех ресурсов
         *
         * @name go.Carcas.Controller#oncload
         * @protected
         * @return void
         */
        'onload': function () {
            // переопределяется у потомков
        },

        /**
         * Действия перед разрушением объекта
         *
         * @name go.Carcas.Controller#done
         * @protected
         * @return void
         */
        'done': function () {
            // переопределяется у потомков
        },

        'eoc': null
    });

    /**
     * @namespace go.Carcas.Exceptions
     *            исключения при работе с библиотекой
     */
    Carcas.Exceptions = (function () {
        var create = go.Lang.Exception.create,
            Base = create("go.Carcas.Exceptions.Base", go.Lang.Exception);
        return {

            /**
             * @class go.Carcas.Exceptions.Base
             *        базовое исключение при работе с библиотекой
             * @abstract
             */
            'Base': Base,

            /**
             * @class go.Carcas.Exceptions.AlreadyInited
             *        попытка инициализовать уже инициализированный каркас
             * @augments go.Carcas.Exceptions.Base
             */
            'AlreadyInited': create("go.Carcas.Exceptions.AlreadyInited", Base),

            /**
             * @class go.Carcas.Exceptions.NotInited
             *        попытка доступа к ещё не инициализированному каркасу
             * @augments go.Carcas.Exceptions.Base
             */
            'NotInited': create("go.Carcas.Exceptions.NotInited", Base),

            /**
             * @class go.Carcas.Exceptions.ModuleRedeclare
             *        попытка повторно определить модуль
             * @augments go.Carcas.Exceptions.Base
             */
            'ModuleRedeclare': create("go.Carcas.Exceptions.ModuleRedeclare", Base),

            /**
             * @class go.Carcas.Exceptions.ControllerRedeclare
             *        попытка повторно определить контроллер
             * @augments go.Carcas.Exceptions.Base
             */
            'ControllerRedeclare': create("go.Carcas.Exceptions.ControllerRedeclare", Base),

            /**
             * @class go.Carcas.Exceptions.ErrorDependence
             *        ошибочная зависимость
             * @augments go.Carcas.Exceptions.Base
             */
            'ErrorDependence': create("go.Carcas.Exceptions.ErrorDependence", Base)
        };
    }());

    /**
     * @namespace Carcas.Helpers
     *            некоторые вспомогательные функции
     */
    Carcas.Helpers = {

        /**
         * Привести список зависимостей к виду словаря
         *
         * @name go.Carcas.Helpers
         * @public
         * @static
         * @param {(Object|String)} deps
         * @param {String} [defaultPrefix]
         * @return {Object.<String, Array>}
         * @throws {go.Carcas.Exceptions.ErrorDependence}
         */
        'parseDeps': function (deps, defaultPrefix) {
            var result,
                dep,
                len,
                i,
                prefix,
                lprefixes;
            if (typeof deps === "object") {
                return deps;
            }
            result = {};
            lprefixes = Carcas.Helpers.prefixes;
            deps = deps.replace(/\s+/g, "").split(",");
            for (i = 0, len = deps.length; i < len; i += 1) {
                dep = deps[i].split(":");
                switch (dep.length) {
                case 2:
                    prefix = dep[0];
                    dep = dep[1];
                    break;
                case 1:
                    prefix = defaultPrefix;
                    dep = dep[0];
                    break;
                default:
                    throw new Carcas.Exceptions.ErrorDependence("Error format in " + deps[i]);
                }
                if (!prefix) {
                    throw new Carcas.Exceptions.ErrorDependence("Undefined prefix in " + deps[i]);
                }
                prefix = lprefixes[prefix];
                if (!prefix) {
                    throw new Carcas.Exceptions.ErrorDependence("Error prefix " + deps[i]);
                }
                if (result[prefix]) {
                    result[prefix].push(dep);
                } else {
                    result[prefix] = [dep];
                }
            }
            return result;
        },

        /**
         * @name go.Carcas.Helpers.prefixes
         * @static
         * @private
         * @type {Object.<String, String>}
         */
        'prefixes': {
            'c'  : "controllers",
            'mo' : "modules",
            'go' : "go",
            'l'  : "otherLibs"
        }

    };

    return Carcas;
});
