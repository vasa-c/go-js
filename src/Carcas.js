/**
 * go.Carcas: небольшой фреймворк
 *
 * @package    go.js
 * @subpackage Carcas
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @uses       go.Class
 * @uses       jQuery
 */
/*jslint nomen: true */
/*global go, window, jQuery */

if (!window.go) {
    throw new Error("go.core is not found");
}

go("Carcas", ["Class", "Ext"], function (go, global) {
    "use strict";
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
                    this.instance = new Carcas();
                }
                return this.instance;
            },

            /**
             * @name go.Carcas.setInstance
             * @public
             * @static
             * @param {go.Carcas} instance
             * @throws go.Carcas.Exceptions.MainInstanceCreated
             */
            'setInstance': function (instance) {
                if (this.instance) {
                    throw new go.Carcas.Exceptions.MainInstanceCreated();
                }
                this.instance = instance;
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
             * @param {String} name
             * @param {(String|Array.<String>|Object)} deps
             * @param {Function} CModule
             * @return {Boolean}
             * @throws go.Carcas.Exceptions.NotInited
             * @throws go.Carcas.Exceptions.ModuleRedeclare
             */
            'module': function (name, deps, CModule) {
                return this.getInstance().module(name, deps, CModule);
            },

            /**
             * @name go.Carcas.controller
             * @alias go.Carcas#controller
             * @public
             * @static
             * @param {String} name
             * @param {(String|Array.<String>|Object)} deps
             * @param {Object} props
             * @return {Boolean}
             * @throws go.Carcas.Exceptions.NotInited
             * @throws go.Carcas.Exceptions.ControllerRedeclare
             */
            'controller': function (name, deps, props) {
                return this.getInstance().controller(name, deps, props);
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
         * Базовый каталог контроллеров и модулей
         *
         * @name go.Carcas#root
         * @protected
         * @type {String}
         */
        'root': null,

        /**
         * Загрузчик дополнительных библиотек
         *
         * @name go.Carcas#libsLoader
         * @protected
         * @type {Function(Array.<String> [, Function])}
         */
        'libsLoader': null,

        /**
         * Был ли каркас инициализован
         *
         * @name go.Carcas#inited
         * @protected
         * @type {Boolean}
         */
        'inited': false,

        /**
         * Загрузчик
         *
         * @name go.Carcas#loader
         * @protected
         * @type {go.__Loader}
         */
        'loader': null,

        /**
         * Статус загрузки
         *
         * 0 - до загрузки DOM
         * 1 - DOM загружен
         * 2 - полная загрузка
         *
         * @name go.Carcas#loadedStatus
         * @protected
         * @type {Number}
         */
        'loadedStatus': 0,

        /**
         * Загруженные контроллеры и модули (имя => объект)
         *
         * @name go.Carcas#loadedObjects
         * @private
         * @type {Object}
         */
        'loadedObjects': null,

        /**
         * @ignore
         */
        '__bind': ["includerForLoader", "creatorForLoader", "ondomload", "onload", "onunload"],

        /**
         * @constructs
         */
        '__construct': function () {
            this.controllersList = {};
            this.modulesList = {};
            this.mo = this.modulesList;
            this.loadedObjects = {
                'c': {},
                'mo': {}
            };
            this.loader = new go.__Loader(this.includerForLoader, this.creatorForLoader);
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
            var controllers;
            if (this.inited) {
                throw new go.Carcas.Exceptions.AlreadyInited();
            }
            this.inited = true;
            this.root  = params.root;
            this.registry = (typeof params.registry === "object") ? params.registry : {};
            this.libsLoader = params.libsLoader;
            if (params.controllers) {
                controllers = params.controllers;
                if (typeof controllers === "string") {
                    controllers = [controllers];
                }
                controllers = go.Lang.each(controllers, function (c) {return "c:" + c; });
                this.loader.include(controllers);
            }
            this.loader.createPreloaded();
            this.setEventsListeners();
        },

        /**
         * Определение модуля
         *
         * @name go.Carcas#mo
         * @public
         * @param {String} name
         *        имя модуля
         * @param {(String|Array.<String>|Object)} [deps]
         *        зависимости
         * @param {Function} CModule
         *        функция-конструктор модуля
         * @throws go.Carcas.Exceptions.NotInited
         * @throws go.Carcas.Exceptions.ModuleRedeclare
         */
        'module': function (name, deps, CModule) {
            if (!CModule) {
                CModule = deps;
                deps = [];
            }
            deps = Carcas.Helpers.normalizeDeps(deps, "mo");
            if (!this.inited) {
                this.loader.preload("mo:" + name, deps, CModule);
                return;
            }
            if (this.loadedObjects.mo[name]) {
                throw new Carcas.Exceptions.ModuleRedeclare('Module "' + name + '" redeclare');
            }
            this.loader.loaded("mo:" + name, deps, CModule);
        },

        /**
         * Определение контроллера
         *
         * @name go.Carcas#controller
         * @public
         * @param {String} name
         *        имя контроллера
         * @param {(String|Object)} [deps]
         *        зависимости
         * @param {Object} props
         *        поля класса контроллера (расширение go.Carcas.Controller)
         * @throws go.Carcas.Exceptions.NotInited
         * @throws go.Carcas.Exceptions.ControllerRedeclare
         */
        'controller': function (name, deps, props) {
            if (!props) {
                props = deps;
                deps = [];
            }
            deps = Carcas.Helpers.normalizeDeps(deps, "c");
            if (!this.inited) {
                this.loader.preload("c:" + name, deps, props);
                return;
            }
            if (this.loadedObjects.c[name]) {
                throw new Carcas.Exceptions.ControllerRedeclare('Controller "' + name + '" redeclare');
            }
            this.loader.loaded("c:" + name, deps, props);
        },

        /**
         * Колбэк includer для загрузчика
         * @see go.__Loader
         *
         * @name go.Carcas#includerForLoader
         * @private
         * @param {String} name
         */
        'includerForLoader': function (name) {
            var prefix, folder;
            name = name.split(":", 2);
            if (name.length !== 2) {
                throw new Carcas.Exceptions.ErrorDependence("Error name " + name[0]);
            }
            prefix = name[0];
            name = name[1];
            switch (prefix) {
            case 'c':
                folder = "controllers";
                break;
            case 'mo':
                folder = "modules";
                break;
            case 'go':
                return this.requestGoModule(name);
            case 'l':
                return this.requestOtherLib(name);
            default:
                throw new Carcas.Exceptions.ErrorDependence("Error prefix in " + prefix + ":" + name);
            }
            this.requestJSFile(this.root + "/" + folder + "/" + name.replace(/\./g, "/") + ".js");
        },

        /**
         * Колбэк creator для загрузчика
         * @see go.__Loader
         *
         * @name go.Carcas#creatorForLoader
         * @private
         * @param {String} name
         * @param {*} data
         */
        'creatorForLoader': function (name, data) {
            var prefix;
            name = name.split(":", 2);
            if (name.length !== 2) {
                throw new Carcas.Exceptions.ErrorDependence("Error name " + name[0]);
            }
            prefix = name[0];
            name = name[1];
            switch (prefix) {
            case 'c':
                this.createController(name, data);
                break;
            case 'mo':
                this.createModule(name, data);
                break;
            case 'go':
                break;
            case 'l':
                break;
            default:
                throw new Carcas.Exceptions.ErrorDependence("Error prefix in " + prefix + ":" + name);
            }
        },

        /**
         * Запрос на подключения JS-файла
         *
         * @name go.Carcas#requestJSFile
         * @protected
         * @param {String} filename
         */
        'requestJSFile': function (filename) {
            go.__Loader.includeJSFile(filename);
        },

        /**
         * Запрос на подключения сторонних библиотек
         *
         * @name go.Carcas#requestOtherLib
         * @protected
         * @param {String} name
         */
        'requestOtherLib': function (name) {
            var _this = this;
            this.libsLoader.call(null, [name], function () {
                _this.loader.loaded("l:" + name, [], true);
            });
        },

        /**
         * Запрос на подключение модулей go
         *
         * @name go.Carcas#requestGoModule
         * @protected
         * @param {String} name
         */
        'requestGoModule': function (name) {
            var _this = this;
            go.include([name], function () {
                _this.loader.loaded("go:" + name, [], true);
            });
        },

        /**
         * Создание объекта контроллера
         *
         * @name go.Carcas#createController
         * @protected
         * @param {String} name
         *        имя контроллера
         * @param {Object} props
         *        расширение класса go.Carcas.Controller
         */
        'createController': function (name, props) {
            var CController, controller;
            if (this.loadedObjects.c[name]) {
                throw new Carcas.Exceptions.ControllerRedeclare('Controller "' + name + '" redeclare');
            }
            CController = go.Class(Carcas.Controller, props);
            controller = new CController(name, this);
            this.setByPath(this.controllersList, name, controller);
            this.loadedObjects.c[name] = controller;
            if (this.loadedStatus > 0) {
                controller.init();
                if (this.loadedStatus > 1) {
                    controller.onload();
                }
            }
        },

        /**
         * Создание объекта модуля
         *
         * @name go.Carcas#createModule
         * @protected
         * @param {String} name
         *        имя модуля
         * @param {Function} CModule
         *        функция-конструктор модуля
         */
        'createModule': function (name, CModule) {
            var module;
            if (this.loadedObjects.mo[name]) {
                throw new Carcas.Exceptions.ModuleRedeclare('Module "' + name + '" redeclare');
            }
            module = new CModule(this);
            this.setByPath(this.modulesList, name, module);
            this.loadedObjects.mo[name] = module;
        },

        /**
         * Записать объект (модуль|контроллер) по нужному пути (в зависимости от имени) в хранилище
         *
         * @name go.Carcas#setByPath
         * @protected
         * @param {Object} context
         *        хранилище
         * @param {String} name
         *        имя
         * @param {Object} obj
         *        объект
         */
        'setByPath': function (context, name, obj) {
            var i, len, c;
            if (typeof name === "string") {
                name = name.split(".");
            }
            for (i = 0, len = name.length - 1; i < len; i += 1) {
                c = name[i];
                if (!context[c]) {
                     context[c] = {};
                }
                context = context[c];
            }
            c = name[len];
            if (context[c]) {
                obj = go.Lang.extend(obj, context[c]);
            }
            context[c] = obj;
        },

        /**
         * Установить слушаетели событий загрузки документа
         *
         * @name go.Carcas#setEventsListeners
         * @protected
         * @return void
         */
        'setEventsListeners': function () {
            var DOM = this.DOMLayer;
            DOM.ondomload(this.ondomload);
            DOM.onfullload(this.onload);
            DOM.onunload(this.onunload);
        },

        /**
         * Обработка загрузки DOM
         *
         * @name go.Carcas#ondomload
         * @protected
         * @return void
         */
        'ondomload': function () {
            var list = this.loadedObjects.c, k;
            this.loadedStatus = 1;
            for (k in list) {
                if (list.hasOwnProperty(k)) {
                    list[k].ondomload();
                }
            }
        },

        /**
         * Обработка полной загрузки документа
         *
         * @name go.Carcas#onload
         * @protected
         * @return void
         */
        'onload': function () {
            var list = this.loadedObjects.c, k;
            this.loadedStatus = 2;
            for (k in list) {
                if (list.hasOwnProperty(k)) {
                    list[k].onload();
                }
            }
        },

        /**
         * Обработка закрытия страницы
         *
         * @name go.Carcas#onunload
         * @protected
         * @return void
         */
        'onunload': function () {
            var list = this.loadedObjects.c, k;
            for (k in list) {
                if (list.hasOwnProperty(k)) {
                    list[k].onunload();
                }
            }
            this.destroy();
        },

        /**
         * @destructs
         */
        '__destruct': function () {
            var list = this.loadedObjects.c, k;
            for (k in list) {
                if (list.hasOwnProperty(k)) {
                    list[k].destroy();
                }
            }
        },

        /**
         * @name go.Carcas#DOMLayer
         *       весь интерфейс с DOM выносится сюда
         */
        'DOMLayer': {

            /**
             * Повесить обработчик на загрузку DOM
             *
             * @name go.Carcas#DOMLayer.ondomload
             * @public
             * @param {Function} handler
             */
            'ondomload': function (handler) {
                jQuery(global.document).ready(handler);
            },

            /**
             * Повесить обработчик на полную загрузку документа
             *
             * @name go.Carcas#DOMLayer.onfullload
             * @public
             * @param {Function} handler
             */
            'onfullload': function (handler) {
                jQuery(global).bind("load", handler);
            },

            /**
             * Повесить обработчик на закрытие страницы
             *
             * @name go.Carcas#DOMLayer.onunload
             * @public
             * @param {Function} handler
             */
            'onunload': function (handler) {
                jQuery(global).bind("unload", handler);
            }
        }
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
         * Название конструктора
         *
         * @name go.Carcas.Controller#name
         * @protected
         * @type {String}
         */
        'name': null,

        /**
         * @name go.Carcas.Controller#carcas
         * @protected
         * @type {go.Carcas}
         */
        'carcas': null,

        /**
         * @constructs
         * @param {String} name
         * @param {go.Carcas} carcas
         */
        '__construct': function (name, carcas) {
            this.name = name;
            this.carcas = carcas;
            this.oncreate();
        },

        /**
         * @destructs
         */
        '__destruct': function () {
            this.done();
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
         * @name go.Carcas.Controller#ondomload
         * @private
         * @return void
         */
        'ondomload': function () {
            this.initNodes(this.node);
            this.init();
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
         * @name go.Carcas.Controller#onload
         * @protected
         * @return void
         */
        'onload': function () {
            // переопределяется у потомков
        },

        /**
         * Действия перед закрытием страницы
         *
         * @name go.Carcas.Controller#onunload
         * @protected
         * @return void
         */
        'onunload': function () {

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

        /**
         * @return {String}
         */
        'toString': function () {
            return "[Controller " + this.name + "]";
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
            'ErrorDependence': create("go.Carcas.Exceptions.ErrorDependence", Base),

            /**
             * @class go.Carcas.Exceptions.MainInstanceCreated
             *        попытка заменить уже созданный основной объект (через setInstance)
             * @augments go.Carcas.Exceptions.Base
             */
            'MainInstanceCreated': create("go.Carcas.Exceptions.MainInstanceCreated", Base)
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
         * @param {(String|Array.<String>|Object.<String, Array.<String>>)} deps
         * @param {String} context ("c"|"mo")
         * @return {Array.<String>}
         * @throws {go.Carcas.Exceptions.ErrorDependence}
         */
        'normalizeDeps': function (deps, context) {
            var isarray = go.Lang.isArray(deps),
                result,
                len,
                i,
                lenj,
                j,
                dep,
                prefix,
                nodes,
                node,
                list;

            if (!deps) {
                return [];
            }

            if (typeof deps === "string") {
                deps = deps.split(",");
                isarray = true;
            }

            if (isarray) {
                result = [];
                for (i = 0, len = deps.length; i < len; i += 1) {
                    dep = deps[i].replace(/^\s+/, "").replace(/\s+$/, "");
                    if (dep.indexOf(":") === -1) {
                        dep = context + ":" + dep;
                    }
                    result.push(dep);
                }
                return result;
            }

            result = [];
            nodes = Carcas.Helpers.nodes;
            for (i = 0, len = nodes.length; i < len; i += 1) {
                node = nodes[i];
                prefix = node[0];
                list = deps[node[1]];
                if (list) {
                    for (j = 0, lenj = list.length; j < lenj; j += 1) {
                        result.push(prefix + ":" + list[j]);
                    }
                }
            }
            return result;
        },

        'nodes': [["c", "controllers"], ["mo", "modules"], ["go", "go"], ["l", "libs"]]
    };

    return Carcas;
});
