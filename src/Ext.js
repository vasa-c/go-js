/**
 * go.Ext: вспомогательные расширения
 *
 * @package    go.js
 * @subpackage Ext
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @uses       go.Class
 */
/*jslint node: true, nomen: true */
/*global go, window, jQuery */
"use strict";

if (!window.go) {
    throw new Error("go.core is not found");
}

/**
 * @namespace go.Ext
 */
go("Ext", ["Class"], function (go, global) {

    var Ext = {};

    /**
     * @class go.Ext.Options
     *        класс с настройками
     */
    Ext.Options = go.Class({

        /**
         * Настройки данного класса.
         * Перекрывают настройки предка и перекрываются настройками объекта.
         *
         * @name go.Ext.Options#options
         * @protected
         * @type {Object}
         */
        'options': {},

        /**
         * @ignore
         */
        '__classname': "go.Ext.Options",

        /**
         * @ignore
         */
        '__mutators': {

            /**
             * Мутатор "options" - подгрузка предковых настроек
             */
            'options' : {
                'processClass': function (props) {
                    var paropt;
                    if (this.parent) {
                        paropt = this.parent.__mutators.mutators.options.options;
                    }
                    if (props.options) {
                        if (paropt) {
                            this.options = go.Lang.copy(paropt);
                            go.Lang.merge(this.options, props.options);
                        } else {
                            this.options = props.options;
                        }
                    } else {
                        if (this.parent) {
                            this.options = paropt;
                        } else {
                            this.options = {};
                        }
                    }
                    props.options = this.options;
                },
                'loadFromParents': function () {
                    return;
                }
            }

        },

        /**
         * @constructs
         * @public
         * @param {Object} options
         *        уникальные настройки объекта
         */
        '__construct': function (options) {
            this.initOptions(options);
        },

        /**
         * Сохранение настроек объекта
         *
         * @name go.Ext.Options#initOptions
         * @protected
         * @param {Object} options
         *        уникальные настройки объекта
         */
        'initOptions': function (options) {
            if (options) {
                this.options = go.Lang.copy(this.__self.prototype.options);
                go.Lang.merge(this.options, options);
                this.__OptionsLazy = false;
            } else {
                this.__OptionsLazy = true;
            }
        },

        /**
         * Получить настройки объекта
         *
         * @name go.Ext.Options#getOptions
         * @public
         * @return {Object}
         */
        'getOptions': function () {
            return this.options;
        },

        /**
         * Получить указанную настройку
         *
         * @name go.Ext.Options#getOption
         * @public
         * @param {String} opt
         *        имя настройки в виде пути ("one.two.three")
         * @return {*}
         *         значение настроки
         * @throws go.Ext.Exception.NotFound
         *         неверный путь
         */
        'getOption': function (opt) {
            var path = opt.split("."),
                value = this.options,
                i,
                len;
            for (i = 0, len = path.length; i < len; i += 1) {
                if ((!value) || (typeof value !== "object")) {
                    throw new Ext.Options.Exceptions.NotFound("getOption(" + opt + ")");
                }
                value = value[path[i]];
            }
            return value;
        },

        /**
         * Установить новое значение настройки
         *
         * @name go.Ext.Options#setOption
         * @public
         * @param {String} opt
         *        путь к настройке ("one.two.three")
         * @param {mixed} value
         *        новое значение
         * @throws go.Ext.Exception.NotFound
         *         неверный путь
         */
        'setOption': function (opt, value) {
            var path = opt.split("."),
                dict,
                i,
                len;
            if (this.__OptionsLazy) {
                this.options = go.Lang.copy(this.options);
                this.__OptionsLazy = false;
            }
            dict = this.options;
            for (i = 0, len = path.length; i < len; i += 1) {
                if ((!dict) || (typeof dict !== "object")) {
                    throw new Ext.Options.Exceptions.NotFound("setOption(" + opt + ")");
                }
                if (i === len - 1) {
                    dict[path[i]] = value;
                } else {
                    dict = dict[path[i]];
                }
            }
        },

        'eoc': null
    });

    /**
     * @namespace go.Ext.Options.Exceptions
     */
    Ext.Options.Exceptions = {
        /**
         * Исключение - настройка по указанному пути не найдена
         *
         * @name go.Ext.Options.Exceptions.NotFound
         * @type {Error}
         */
        'NotFound' : go.Lang.Exception.create("go.Ext.Options.Exceptions.NotFound", go.Lang.Exception)
    };

    /**
     * @class go.Ext.Nodes
     *        класс, обрабатывающий DOM-элементы
     * @abstract
     * @uses jQuery
     */
    Ext.Nodes = go.Class({

        /**
         * Основная нода объекта
         *
         * @name go.Ext.Nodes#node
         * @protected
         * @type {jQuery}
         */
        'node': null,

        /**
         * При определении класса - список указателей на ноды
         * Переопределяется у потомков
         * В экземпляре класса - список самих нод
         *
         * @name go.Ext.Nodes#nodes
         * @protected
         * @type {Object.<string, jQuery>}
         */
        'nodes': {},

        /**
         * Список слушателей событий
         *
         * @name go.Ext.Nodes#nodesListeners
         * @protected
         * @type {Array.<[jQuery node, String eventType, Function handler]>}
         */
        'nodesListeners': null,

        /**
         * @ignore
         */
        '__abstract': true,

        /**
         * @ignore
         */
        '__mutators': {
            /**
             * Мутатор "nodes" - подгрузка предковых списков нод
             */
            'nodes' : {
                'processClass': function (props) {
                    var parnodes;
                    if (this.parent) {
                        parnodes = this.parent.__mutators.mutators.nodes.nodes;
                    }
                    if (props.nodes) {
                        if (parnodes) {
                            this.nodes = go.Lang.copy(parnodes);
                            go.Lang.merge(this.nodes, props.nodes);
                        } else {
                            this.nodes = props.nodes;
                        }
                    } else {
                        if (this.parent) {
                            this.nodes = parnodes;
                        } else {
                            this.nodes = {};
                        }
                    }
                    props.nodes = this.nodes;
                },
                'loadFromParents': function () {
                    return;
                }
            }
        },

        /**
         * @constructs
         * @param {jQuerySelector} node
         *        указатель на основной контейнер объекта
         */
        '__construct': function (node) {
            this.initNodes(node);
        },

        /**
         * @destructs
         * @ignore
         * @return void
         */
        '__destruct': function () {
            this.doneNodes();
        },

        /**
         * Инициализация нод
         *
         * @name go.Ext.Nodes#initNodes
         * @protected
         * @param {jQuery} node
         *        указатель на основной контейнер объекта
         * @todo протестировать лучше
         */
        'initNodes': function (node) {
            var nodes = {},
                nnode,
                lnodes = this.nodes,
                lnode,
                k,
                _this = this;
            function create(lnode) {
                var nnode,
                    parent,
                    events,
                    k,
                    handler;
                if (!lnode) {
                    return null;
                }
                if ((typeof lnode === "object") && (typeof lnode.length !== "undefined")) {
                    return lnode;
                }
                if (typeof lnode === "function") {
                    lnode = {
                        'creator': lnode
                    };
                } else if (typeof lnode === "string") {
                    lnode = {
                        'selector': lnode
                    };
                }
                if (lnode.selector) {
                    parent = lnode.global ? jQuery(global) : node;
                    nnode = parent.find(lnode.selector);
                } else if (lnode.creator) {
                    nnode = lnode.creator.call(_this, node, lnode);
                    nnode = create(nnode);
                }
                events = lnode.events;
                if (events) {
                    for (k in events) {
                        if (events.hasOwnProperty(k)) {
                            if (typeof events[k] === "function") {
                                handler = events[k];
                            } else {
                                handler = _this[events[k]];
                            }
                            _this.bind(nnode, k, handler);
                        }
                    }
                }
                return nnode;
            } // create()
            node = node ? jQuery(node) : jQuery(global.document);
            this.node = node;
            this.nodesListeners = [];
            for (k in lnodes) {
                if (lnodes.hasOwnProperty(k)) {
                    lnode = lnodes[k];
                    nnode = create(lnode);
                    if (nnode) {
                        nodes[k] = nnode;
                    }
                }
            }
            this.nodes = nodes;
        },

        /**
         * Очищение структур данных
         *
         * @name go.Ext.Nodes#doneNodes
         * @protected
         * @return void
         */
        'doneNodes': function () {
            this.unbindAll();
        },

        /**
         * Установить обработчик события
         *
         * @name go.Ext.Nodes#bind
         * @protected
         * @param {jQuerySelector} node
         *        указатель на ноду
         * @param {String} eventType
         *        тип события
         * @param {(String|Function(e))} handler
         *        обработчик - функция или имя метода данного объекта
         */
        'bind': function (node, eventType, handler) {
            if (typeof handler !== "function") {
                handler = this[handler];
            }
            jQuery(node).bind(eventType, handler);
            this.nodesListeners.push([node, eventType, handler]);
        },

        /**
         * Снять обработчик события
         *
         * @name go.Ext.Nodes#unbind
         * @protected
         * @param {jQuerySelector} node
         *        указатель на ноду
         * @param {String} eventType
         *        тип события
         * @param {(String|Function(e))} handler
         *        обработчик - функция или имя метода данного объекта
         */
        'unbind': function (node, eventType, handler) {
            if (typeof handler !== "function") {
                handler = this[handler];
            }
            jQuery(node).unbind(eventType, handler);
        },

        /**
         * Снять все обработчики, установленные ранее через bind()
         *
         * @name go.Ext.Nodes#unbindAll
         * @protected
         * @return void
         */
        'unbindAll': function () {
            var listeners = this.nodesListeners,
                listener;
            while (listeners.length > 0) {
                listener = listeners.pop();
                this.unbind.apply(this, listener);
            }
        },

        'eoc': null
    });

    /**
     * @class go.Ext.Events
     *        класс, генерирующий события, на которые можно подписываться
     */
    Ext.Events = go.Class({

        /**
         * Список подписчиков
         *
         * @name go.Ext.Events#eventListeners
         * @protected
         * @type {Object.<string, go.Lang.Listeners.Listener>}
         *       имя события => список обработчиков
         */
        'eventListeners': null,

        /**
         * Добавить обработчик события
         *
         * @name go.Ext.Events#addEventListener
         * @public
         * @param {String} [eventType]
         *        тип события (если в классе определены различные)
         * @param {Function} listener
         *        обработчик события
         * @return {Number}
         *         идентификатор слушателя
         */
        'addEventListener': function (eventType, listener) {
            var elisteners;
            if (!listener) {
                listener  = eventType;
                eventType = "";
            }
            if (!this.eventListeners) {
                this.eventListeners = {};
            }
            elisteners = this.eventListeners;
            if (!elisteners[eventType]) {
                elisteners[eventType] = go.Lang.Listeners.create();
            }
            return elisteners[eventType].append(listener);
        },

        /**
         * Удалить обработчик события
         *
         * @name go.Ext.Events#removeEventsListener
         * @public
         * @param {String} [eventType]
         *        тип события (если в классе определены различные)
         * @param {(Function|Number)} listener
         *        обработчик или его идентификатор
         * @return {Boolean}
         *         был ли обработчик найден и удалён
         */
        'removeEventListener': function (eventType, listener) {
            var elisteners = this.eventListeners, i, len;
            if (!elisteners) {
                return false;
            }
            elisteners = elisteners[eventType];
            if (!elisteners) {
                return false;
            }
            return elisteners.remove(listener);
        },

        /**
         * Удалить все обработчики одного события
         *
         * @name go.Ext.Events#removeEventsAllListeners
         * @public
         * @param {String} [eventType]
         *        тип события
         */
        'removeEventAllListeners': function (eventType) {
            this.eventListeners[eventType] = null;
        },

        /**
         * Сброс всех обработчиков всех событий
         *
         * @name go.Ext.Events#resetEventListeners
         * @public
         * @return void
         */
        'resetEventListeners': function () {
            this.eventListeners = {};
        },

        /**
         * Генерация события
         *
         * @name go.Ext.Events#fireEvent
         * @public
         * @param {(String|Object)} event
         *        объект события или его тип
         * @param {*} [eventData]
         *        данные события (если event - строка)
         */
        'fireEvent': function (event, eventData) {
            var listener, i, len;
            if ((!event) || (typeof event !== "object")) {
                event = new Ext.Events.Event(event, eventData);
            }
            listener = this.eventListeners && this.eventListeners[event.type];
            if (!listener) {
                return;
            }
            listener(event);
        },

        /**
         * @destructs
         * @ignore
         */
        '__destruct': function () {
            this.resetEventListeners();
        },

        'eoc': null
    });

    /**
     * @class go.Ext.Events.Event
     *        конструктор объектов-событий для go.Ext.Events
     *
     * @property {String} type
     * @property {*} data
     */
    Ext.Events.Event = (function () {

        var EventPrototype = {

            /**
             * @lends go.Ext.Events.Event.prototype
             */

            /**
             * @constructs
             * @param {String} eventType
             * @param {*} eventData
             */
            '__construct': function (eventType, eventData) {
                this.type = eventType;
                this.data = eventData;
            },

            /**
             * Строковое представление объекта события
             * @name go.Ext.Events.Event#toString
             * @override
             * @return {String}
             */
            'toString': function () {
                return "[Event " + this.type + "]";
            }
        };

        /**
         * @param eventType
         * @param eventData
         */
        function EventConstructor(eventType, eventData) {
            this.__construct(eventType, eventData);
        }
        EventConstructor.prototype = EventPrototype;

        return EventConstructor;
    }());

    return Ext;
});