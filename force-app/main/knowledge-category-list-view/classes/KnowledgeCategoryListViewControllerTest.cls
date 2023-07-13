/**
 * @description Test class. Make sure you have at least one active data category group in your org
 */
@isTest
public with sharing class KnowledgeCategoryListViewControllerTest {
    private static final String SOBJECT_TYPE = 'KnowledgeArticleVersion'; // 'Knowledge__kav' is not available for describeDataCategoryGroups

    @isTest
    public static void testGetCategoryTree() {
        List<KnowledgeCategoryListViewController.CategoryTreeResult> result = KnowledgeCategoryListViewController.getCategoryTree();
        Assert.isTrue(result.size() > 0, 'Category trees are not successfully created or there are no category groups.');
    }

    @isTest
    public static void testGetArticles() {
        // Get first data category dynamically
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
        DescribeDataCategoryGroupStructureResult dataCategoryGroup = describeCategoryStructureResult[0];
        Schema.DataCategory dataCategory = dataCategoryGroup.getTopCategories()[0].getChildCategories()[0];
        
        String dataCategoryGroupName = dataCategoryGroup.getName();
        String dataCategoryName = dataCategory.getName();
        // Insert knowledge
        Knowledge__kav article = new Knowledge__kav(
            UrlName = 'test001',
            Title = 'Test',
            Summary = 'Test article'
        );
        insert article;
        Knowledge__kav draftArticle = [SELECT KnowledgeArticleId FROM Knowledge__kav LIMIT 1];
        Knowledge__DataCategorySelection dcs = new Knowledge__DataCategorySelection(
            DataCategoryGroupName = dataCategoryGroupName,
            DataCategoryName = dataCategoryName,
            ParentId = article.Id
        );
        insert dcs;
        KbManagement.PublishingService.publishArticle(draftArticle.KnowledgeArticleId, false);

        Test.startTest();
        List<Knowledge__kav> articles = KnowledgeCategoryListViewController.getArticles(dataCategoryGroupName, dataCategoryName);
        Test.stopTest();

        Assert.areEqual(1, articles.size(), 'Failed to query articles');
    }
}
