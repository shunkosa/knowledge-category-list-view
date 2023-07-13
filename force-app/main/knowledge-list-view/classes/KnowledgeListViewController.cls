/**
 * @description Controller class for knowledge list view
 */
public with sharing class KnowledgeListViewController {
    private static final String SOBJECT_TYPE = 'KnowledgeArticleVersion'; // 'Knowledge__kav' is not available for describeDataCategoryGroups

    /**
     * @description Create category tree menu
     * @return list of category tree info
     */
    @AuraEnabled
    public static List<CategoryTreeResult> getCategoryTree() {
        List<DescribeDataCategoryGroupResult> describeCategoryResult = Schema.describeDataCategoryGroups(
            new List<String>{ SOBJECT_TYPE }
        );
        List<DataCategoryGroupSobjectTypePair> pairs = new List<DataCategoryGroupSobjectTypePair>();
        for (DescribeDataCategoryGroupResult singleResult : describeCategoryResult) {
            DataCategoryGroupSobjectTypePair p = new DataCategoryGroupSobjectTypePair();
            p.setSobject(singleResult.getSobject());
            p.setDataCategoryGroupName(singleResult.getName());
            pairs.add(p);
        }
        List<DescribeDataCategoryGroupStructureResult> describeCategoryStructureResult = Schema.describeDataCategoryGroupStructures(
            pairs,
            false
        );
        List<CategoryTreeResult> result = new List<CategoryTreeResult>();
        // Iterate data category groups
        for (DescribeDataCategoryGroupStructureResult singleResult : describeCategoryStructureResult) {
            Schema.DataCategory topLevelCategory = singleResult.getTopCategories()[0];
            List<Schema.DataCategory> secondLevelCategories = topLevelcategory.getChildCategories();
            // Construct category tree from the second level because the first level is always 'All'
            List<CategoryTreeItem> tree = constructTree(secondLevelCategories, new List<CategoryTreeItem>{});
            result.add(new CategoryTreeResult(singleResult.getName(), singleResult.getLabel(), tree));
        }
        return result;
    }

    /**
     * @description Search articles by category
     * @param categoryGroupName developer name of category group
     * @param categoryName developer name of category
     * @return list of articlese
     */
    @AuraEnabled
    public static List<Knowledge__kav> getArticles(String categoryGroupName, String categoryName) {
        String queryTemplate = 'SELECT Id, Title, Summary, UrlName, ArticleNumber, CreatedDate, LastModifiedDate FROM Knowledge__kav';
        String query = String.format(queryTemplate, new List<String> {categoryGroupName + '__c', categoryName + '__c'});
        System.debug(query);
        List<Knowledge__kav> result = (List<Knowledge__kav>) Database.query(queryTemplate);
        return result;
    }

    /**
     * @description Create category tree recursively
     * @param categories category list
     * @param tree current category tree
     * @return category tree
     */
    public static List<CategoryTreeItem> constructTree(
        List<Schema.DataCategory> categories,
        List<CategoryTreeItem> tree
    ) {
        if (categories.size() == 0) {
            return tree;
        }
        for (Schema.DataCategory dc : categories) {
            CategoryTreeItem item = new CategoryTreeItem(dc.getLabel(), dc.getName());
            List<CategoryTreeItem> childTree = new List<CategoryTreeItem>();
            item.items = constructTree(dc.getChildCategories(), childTree);
            tree.add(item);
        }
        return tree;
    }

    /**
     * @description Category tree and group info
     */
    public class CategoryTreeResult {
        @AuraEnabled
        public String categoryGroupLabel;
        @AuraEnabled
        public String categoryGroupName;
        @AuraEnabled
        public List<CategoryTreeItem> tree;

        /**
         * @description constructor
         * @param categoryGroupName display name of category group
         * @param categoryGroupLabel developer name of category group
         * @param tree tree
         */
        public CategoryTreeResult(String categoryGroupName, String categoryGroupLabel, List<CategoryTreeItem> tree) {
            this.categoryGroupLabel = categoryGroupLabel;
            this.categoryGroupName = categoryGroupName;
            this.tree = tree;
        }
    }

    /**
     * @description A category item in tree
     */
    public class CategoryTreeItem {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String name;
        @AuraEnabled
        public Boolean expanded;
        @AuraEnabled
        public List<CategoryTreeItem> items;

        /**
         * @description constructor
         * @param label display name of category
         * @param name develoepr name of category
         */
        public CategoryTreeItem(String label, String name) {
            this.label = label;
            this.name = name;
            this.expanded = false;
        }
    }
}