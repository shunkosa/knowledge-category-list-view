import { LightningElement, track } from 'lwc';
import getCategoryTree from '@salesforce/apex/KnowledgeCategoryListViewController.getCategoryTree';
import getArticles from '@salesforce/apex/KnowledgeCategoryListViewController.getArticles';
import getFormattedColumns from '@salesforce/apex/KnowledgeCategoryListViewController.getFormattedColumns';

import KCLV_Title from '@salesforce/label/c.KCLV_Title';
import KCLV_ExpandAll from '@salesforce/label/c.KCLV_ExpandAll';
import KCLV_CollapseAll from '@salesforce/label/c.KCLV_CollapseAll';
import KCLV_Search from '@salesforce/label/c.KCLV_Search';
import KCLV_MessageArticleFound from '@salesforce/label/c.KCLV_MessageArticleFound';
import KCLV_MessageArticleNotFound from '@salesforce/label/c.KCLV_MessageArticleNotFound';
import KCLV_ErrorHeader from '@salesforce/label/c.KCLV_ErrorHeader';

export default class KnowledgeCategoryListView extends LightningElement {
    loading;
    errorMessage;

    @track trees;
    columns = [];
    articles = [];

    selectedCategoryName;
    selectedCategoryGroupName;
    searchExecuted;

    label = {
        KCLV_Title,
        KCLV_ExpandAll,
        KCLV_CollapseAll,
        KCLV_Search,
        KCLV_MessageArticleFound,
        KCLV_MessageArticleNotFound,
        KCLV_ErrorHeader
    };

    async connectedCallback() {
        this.loading = true;
        try {
            this.trees = await getCategoryTree();
            const columns = await getFormattedColumns();
            this.columns = columns.map((column, index) => {
                return this.formatColumn(column, index);
            });
        } catch (e) {
            console.error(e);
            this.errorMessage = this.extractErrorMessage(e);
        } finally {
            this.loading = false;
        }
    }

    /**
     * Event handler on tree item selected
     * @param {*} event
     */
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
        try {
            const articles = await getArticles({
                categoryGroupName: this.selectedCategoryGroupName,
                categoryName: this.selectedCategoryName
            });
            this.articles = articles.map((r) => ({
                recordUrl: `/lightning/r/${r.Id}/view`,
                ...r
            }));
        } catch (e) {
            console.error(e);
            this.errorMessage = this.extractErrorMessage(e);
        } finally {
            this.loading = false;
            this.searchExecuted = true;
        }
    }

    /**
     * @private
     * @param {} column
     * @param {*} index
     * @returns
     */
    formatColumn(column, index) {
        if (index === 0) {
            return {
                label: column.label,
                fieldName: 'recordUrl',
                type: 'url',
                typeAttributes: {
                    label: { fieldName: column.fieldName },
                    tooltip: { fieldName: column.fieldName }
                },
                hideDefaultActions: true
            };
        }
        return column;
    }

    /**
     * @privates
     * @param {*} e Error
     * @returns error message
     */
    extractErrorMessage(e) {
        return typeof e.message === 'string' ? JSON.stringify(e, Object.getOwnPropertyNames(e)) : JSON.stringify(e);
    }

    get disabledSearchButton() {
        return !this.selectedCategoryName;
    }

    get noArticles() {
        return this.articles.length === 0;
    }

    get numOfArticlesMessage() {
        return this.label.KCLV_MessageArticleFound.replaceAll('{0}', this.articles.length);
    }

    get tableContainerHeight() {
        return this.articles.length === 0 ? 'height:2.125rem;' : `height:${this.articles.length * 1.825 + 2.125}rem `;
    }

    get hasError() {
        return !!this.errorMessage;
    }
}
