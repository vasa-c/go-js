var ArticleImmediately = go.Class(ArticleBase, {

    /**
     * @override ArticleBase
     */
    'showContent': function () {
        this.nodeContent.show();
    },
    
    /**
     * @override ArticleBase
     */ 
    'hideContent': function () {
        this.nodeContent.hide();
    },
    
    'eoc': null
});
