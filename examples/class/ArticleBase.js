/**
 * Базовый класс статей
 *
 * @abstract от него наследуются классы с конкретным поведением
 *
 * @var jQuery node
 *      контейнер статьи (LI)
 * @var List list
 *      объект родительского списка
 * @var jQuery nodeTitle
 *      элемент загловока (A)
 * @var jQuery nodeContent
 *      элемент содержимого (DIV)
 * @var bool opened
 *      открыта ли статья
 */
var ArticleBase = go.Class({

    '__abstract': true,
    
    /**
     * Селектор по которому отыскивается заголовок
     *
     * @const string
     */
    'NODE_TITLE': "a:eq(0)",
    
    /**
     * Селектор по которому отыскивается текст статьи
     *
     * @const string
     */
    'NODE_CONTENT': ".content",

    /**
     * Конструктор
     *
     * @param jQuery node
     *        контейнер статьи или его селектор
     * @param List list
     *        объект родительского списка
     */
    '__construct': function (node, list) {
        this.node = $(node);
        this.list = list;
        this.loadNodes();
        this.initEvents();
        this.checkOpened();        
    },
    
    /**
     * Деструктор
     */
    '__destruct': function () {
        this.doneEvents(); 
    },
    
    /**
     * Открыть статью
     */
    'open': function () {
        if (!this.opened) {
            this.opened = true;
            this.node.removeClass("closed");            
            this.node.addClass("opened");
            this.showContent();
            this.list.onChangeCurrent(this);
        }
    },
    
    /**
     * Закрыть статью
     */
    'close': function () {
        if (this.opened) {
            this.opened = false;
            this.node.removeClass("opened");
            this.node.addClass("closed");
            this.hideContent();
            this.list.onDisableCurrent(this);
        }
    },
    
    /**
     * Переключить состояние статьи
     */
    'toggle': function () {
        if (this.opened) {
            this.close();
        } else {
            this.open();
        }
    },
    
    /**
     * Открыта ли в данный момент статья
     */
    'isOpened': function () {
        return this.opened;
    },
    
    /**
     * Обработка щелчка на заголовке
     *
     * @param Event e
     */
    'onClickTitle': function (e) {
        e.preventDefault();    
        this.toggle();
    },
    
    /**
     * Подгрузка вложенных элементов
     */
    'loadNodes': function () {
        this.nodeTitle = this.node.find(this.NODE_TITLE);
        this.nodeContent = this.node.find(this.NODE_CONTENT);
    },
    
    /**
     * Инициализация обработчиков событий
     */
    'initEvents': function () {
        this.nodeTitle.click(this.onClickTitle);
    },
    
    /**
     * Разобраться открыта ли статья
     */
    'checkOpened': function () {
        this.opened = this.node.hasClass("opened");
    },    
    
    /**
     * Снятие обработчиков событий
     */
    'doneEvents': function () {
        this.nodeTitle.unbind("click", this.onClickTitle);
    },
    
    /**
     * Показать контент
     * @abstract
     */
    'showContent': function () {},
    
    /**
     * Скрыть контент
     * @abstract
     */ 
    'hideContent': function () {},

    'eoc': null
});
