/**
 * Список статей
 *
 * @var jQuery node
 *      элемент списка (UL)
 * @var go.class AClass
 *      класс объектов статей
 * @var ArticleBase current
 *      текущая выбранная статья (null - нет выбранной)
 * @var ArticleBase[] articles
 *      список объектов статей
 */
var List = go.Class({

    /**
     * Селектор по которому выбираются элементы статей
     *
     * @const string
     */
    'NODES_ARTICLES': "li",

    /**
     * Конструктор
     * 
     * @var jQuery node
     *      элемент списка или его селектор
     * @var go.class AClass
     *      класс объектов статей
     */
    '__construct': function (node, AClass) {
        this.node = $(node);
        this.AClass = AClass;
        this.loadArticles();
    },
    
    /**
     * Деструктор
     */
    '__destruct': function () {
        this.destroyArticles();
    },
    
    /**
     * Изменение текущего элемента
     * Вызывается из объекта статьи, когда её открывают
     * 
     * @param ArticleBase newCurrent
     *        выбранная статья
     */
    'onChangeCurrent': function (newCurrent) {
        if (this.current && (this.current !== newCurrent)) {
            this.current.close();
        }
        this.current = newCurrent;
    },
    
    /**
     * Закрытие текущего элемента
     * Вызывается из объекта статьи, когда её закрывают
     */
    'onDisableCurrent': function () {
        if (this.current) {
            this.current = null;
        }
    },
    
    /**
     * Загрузка и создание списка статей
     */
    'loadArticles': function () {
        var nodes = this.node.find(this.NODES_ARTICLES),
            node,
            articles = [],
            article,
            i,
            len = nodes.length,
            AClass = this.AClass;
        this.current = null;
        for (i = 0; i < len; i += 1) {
            node = nodes.eq(i);
            article = new AClass(node, this);
            articles.push(article);
            if (article.isOpened()) {
                this.current = article;
            }
        }
        this.articles = articles;
    },
    
    /**
     * Разрушение списка статей
     */
    'destroyArticles': function () {
        var articles = this.articles,
            article;
        while (articles.length > 0) {
            article = articles.pop();
            article.destroy();
        }        
    },

    'eoc': null
});
