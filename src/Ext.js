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

go("Ext", ["Class"], function (go) {

    var Ext = {};

    /**
     * Ext.Options - класс с настройками
     *
     * @var hash options
     *      настройки данного класса,
     *      перекрывают настройки предка и перекрываются настройками объекта
     */
    Ext.Options = go.Class({

        '__classname': "go.Ext.Options",

        'options': {},

        '__mutators': {

            /**
             * Мутатор "options" - подгрузка предковых настроек
             *
             * @todo оптимизировать (отложенное копирование)
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
         * Конструктор
         *
         * @param hash options
         *        уникальные настройки объекта
         */
        '__construct': function (options) {
            this.initOptions(options);
        },

        /**
         * Сохранение настроек объекта
         *
         * @param hash options
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
         * @return hash
         */
        'getOptions': function () {
            return this.options;
        },

        /**
         * Получить указанную настройку
         *
         * @throws go.Ext.Exception.NotFound
         * @param string opt
         *        имя настройки в виде пути ("one.two.three")
         * @return value
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
         * Установить настройку
         *
         * @throws go.Ext.Exception.NotFound
         * @param string opt
         * @param mixed value
         */
        'setOption': function (opt, value) {
            var path = opt.split("."),
                hash,
                i,
                len;
            if (this.__OptionsLazy) {
                this.options = go.Lang.copy(this.options);
                this.__OptionsLazy = false;
            }
            hash = this.options;
            for (i = 0, len = path.length; i < len; i += 1) {
                if ((!hash) || (typeof hash !== "object")) {
                    throw new Ext.Options.Exceptions.NotFound("setOption(" + opt + ")");
                }
                if (i === len - 1) {
                    hash[path[i]] = value;
                } else {
                    hash = hash[path[i]];
                }
            }
        },

        'eoc': null
    });

    Ext.Options.Exceptions = {
        'NotFound' : go.Lang.Exception.create("go.Ext.Options.Exceptions.NotFound", go.Lang.Exception)
    };

    /**
     * Ext.Nodes - класс, обрабатывающий DOM-элементы
     *
     * @uses jQuery
     *
     * @var jQuery node
     *      основная нода объекта
     * @var hash nodes
     *      список загруженных нод
     * @var list nodesListeners
     *      список установленных слушателей событий
     */
    Ext.Nodes = go.Class({

        /**
         * Список указателей на ноды
         * Переопределяется у потомков
         *
         * @var hash
         */
        'nodes': {},

        '__abstract': true,

        '__mutators': {

        },

        /**
         * Конструктор
         *
         * @param mixed node
         *        указатель на основной контейнер объекта
         */
        '__construct': function (node) {
            this.initNodes(node);
        },

        /**
         * Деструктор
         */
        '__destruct': function () {
            this.doneNodes();
        },

        /**
         * Инициализация нод
         *
         * @param mixed node
         *        указатель на основной контейнер объекта
         */
        'initNodes': function (node) {
            this.node = jQuery(node);
            this.nodesListeners = [];
        },

        /**
         * Очищение структур данных
         */
        'doneNodes': function () {
            this.unbindAll();
        },

        /**
         * Установить обработчик события
         *
         * @param mixed node
         *        указатель на ноду
         * @param string eventType
         *        тип события
         * @param function(e)|string handler
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
         * @param mixed node
         * @param string eventType
         * @param function(e)|string handler
         */
        'unbind': function (node, eventType, handler) {
            if (typeof handler !== "function") {
                handler = this[handler];
            }
            jQuery(node).unbind(eventType, handler);
        },

        /**
         * Снять все обработчики, установленные ранее через bind()
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

    return Ext;
});