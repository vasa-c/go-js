var ArticleSmoothly = go.Class(ArticleBase, {

    /**
     * @override ArticleBase
     */
    'showContent': function () {
        this.nodeContent.slideDown();
    },
    
    /**
     * @override ArticleBase
     */ 
    'hideContent': function () {
        this.nodeContent.slideUp();
    },

    'eoc': null
});
