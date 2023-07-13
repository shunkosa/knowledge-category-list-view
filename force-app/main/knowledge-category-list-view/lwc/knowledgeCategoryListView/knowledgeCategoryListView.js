import { LightningElement, track } from 'lwc';
import getCategoryTree from '@salesforce/apex/KnowledgeCategoryListViewController.getCategoryTree';
import getArticles from '@salesforce/apex/KnowledgeCategoryListViewController.getArticles';

const columns = [
    {
        label: '記事番号',
        fieldName: 'Url',
        type: 'url',
        typeAttributes: { label: { fieldName: 'ArticleNumber' } },
        initialWidth: 120
    },
    { label: 'タイトル', fieldName: 'Title' },
    { label: '概要', fieldName: 'Summary' },
    {
        label: '作成日',
        fieldName: 'CreatedDate',
        type: 'date',
        initialWidth: 120,
        typeAttributes: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }
    },
    {
        label: '最終更新日',
        fieldName: 'LastModifiedDate',
        type: 'date',
        initialWidth: 120,
        typeAttributes: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }
    }
];

export default class KnowledgeCategoryListView extends LightningElement {
    loading;
    @track trees;
    articles = [];
    async connectedCallback() {
        this.loading = true;
        const result = await getCategoryTree();
        this.trees = result;
        this.loading = false;
    }
    selectedCategoryName;
    selectedCategoryGroupName;
    searchExecuted;

    columns = columns;

    handleCategorySelected(event) {
        this.selectedCategoryName = event.detail.name;
        // Deselect category on the other category groups
        const selectedCategoryGroupName = event.target.dataset.name;
        this.selectedCategoryGroupName = selectedCategoryGroupName;
        const otherCategoryTree = this.template.querySelectorAll(
            `lightning-tree[data-name]:not([data-name="${selectedCategoryGroupName}"])`
        );
        for (const tree of otherCategoryTree) {
            tree.selectedItem = '';
        }
    }

    /**
     * Action when expand all button pressed
     */
    expandAll() {
        for (let i = 0; i < this.trees.length; i++) {
            this.trees[i].tree = this.toggle(true, this.trees[i].tree);
            this.trees[i].categoryGroupLabel = this.toggleLabel(this.trees[i].categoryGroupLabel);
        }
    }

    /**
     * Toggle tree items' expanded attribute value
     * @param {""} expanded
     * @param {*} tree
     * @returns tree
     */
    toggle(expanded, tree) {
        if (tree.length === 0) {
            return tree;
        }
        for (const item of tree) {
            item.expanded = expanded;
            item.items = this.toggle(expanded, item.items);
        }
        return tree;
    }

    /**
     * Action when collapse all button pressed
     */
    collapseAll() {
        for (let i = 0; i < this.trees.length; i++) {
            this.trees[i].tree = this.toggle(false, this.trees[i].tree);
            this.trees[i].categoryGroupLabel = this.toggleLabel(this.trees[i].categoryGroupLabel);
        }
    }

    /**
     * Update category group label to rerender tree
     * @private
     * @param {*} text
     * @returns label
     */
    toggleLabel(text) {
        return text.includes(' ') ? text.trim() : `${text} `;
    }

    /**
     * Query articles by the selected data category
     * @returns articles
     */
    async search() {
        if (!this.selectedCategoryName) {
            return;
        }
        this.loading = true;
        const articles = await getArticles({
            categoryGroupName: this.selectedCategoryGroupName,
            categoryName: this.selectedCategoryName
        });
        this.articles = articles.map((r) => ({
            Url: `/lightning/r/${r.Id}/view`,
            ...r
        }));
        this.loading = false;
        this.searchExecuted = true;
    }

    get noArticles() {
        return this.articles.length === 0;
    }

    get numOfArticles() {
        return this.articles.length;
    }

    get tableContainerHeight() {
        return this.articles.length === 0 ? 'height:2.125rem;' : `height:${this.articles.length * 1.825 + 2.125}rem `;
    }
}
