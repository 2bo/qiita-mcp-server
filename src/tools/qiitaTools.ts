import { z } from "zod";
import { QiitaApiService } from "../services/qiita.js";

const apiService = new QiitaApiService();

const createSuccessResponse = (content: string): any => {
  return {
    content: [
      { 
        type: "text", 
        text: content 
      }
    ]
  };
};

const createErrorResponse = (errorMessage: string): any => {
  return {
    content: [
      { 
        type: "text", 
        text: `Error: ${errorMessage}` 
      }
    ],
    isError: true
  };
};

const getUserArticlesSchema = z.object({
  page: z.number().optional().default(1).describe("Page number for pagination"),
  per_page: z.number().optional().default(20).describe("Number of items per page"),
});
type GetUserArticlesParams = z.infer<typeof getUserArticlesSchema>;

const getMyQiitaUserArticles = async (params: GetUserArticlesParams): Promise<any> => {
  try {
    const { page = 1, per_page = 20 } = params;
    const items = await apiService.getAuthenticatedUserItems(page, per_page);
    return createSuccessResponse(JSON.stringify(items, null, 2));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Error fetching Qiita items: ${errorMessage}`);
  }
};

const getItemSchema = z.object({
  item_id: z.string().describe("The ID of the Qiita article to fetch"),
});
type GetItemParams = z.infer<typeof getItemSchema>;

const getQiitaItem = async (params: GetItemParams): Promise<any> => {
  try {
    const { item_id } = params;
    const item = await apiService.getItem(item_id);
    return createSuccessResponse(JSON.stringify(item, null, 2));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Error fetching Qiita item: ${errorMessage}`);
  }
};

const postArticleSchema = z.object({
  title: z.string().describe("Article title"),
  body: z.string().describe("Markdown formatted content"),
  tags: z.array(z.object({
    name: z.string().describe("Tag name"),
    versions: z.array(z.string()).optional().describe("Versions (optional)")
  })).describe("List of tags for the article"),
  private: z.boolean().optional().default(true).describe("Whether the article is private"),
  tweet: z.boolean().optional().describe("Whether to post to Twitter"),
  organization_url_name: z.string().optional().describe("The url_name of the organization for the article"),
  slide: z.boolean().optional().describe("Whether to enable slide mode")
});
type PostArticleParams = z.infer<typeof postArticleSchema>;

const postQiitaArticle = async (params: PostArticleParams): Promise<any> => {
  try {
    const newItem = await apiService.createItem(params);
    
    return createSuccessResponse(
      `記事が正常に投稿されました。\nタイトル: ${newItem.title}\nURL: ${newItem.url}\n\n` + 
      JSON.stringify(newItem, null, 2)
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Error posting Qiita article: ${errorMessage}`);
  }
};

const updateArticleSchema = z.object({
  item_id: z.string().describe("The ID of the article to update"),
  title: z.string().describe("Article title"),
  body: z.string().describe("Markdown formatted content"),
  tags: z.array(z.object({
    name: z.string().describe("Tag name"),
    versions: z.array(z.string()).optional().describe("Versions (optional)")
  })).optional().describe("List of tags for the article"),
  private: z.boolean().optional().describe("Whether the article is private"),
  organization_url_name: z.string().optional().describe("The url_name of the organization for the article"),
  slide: z.boolean().optional().describe("Whether to enable slide mode")
});
type UpdateArticleParams = z.infer<typeof updateArticleSchema>;

const updateQiitaArticle = async (params: UpdateArticleParams): Promise<any> => {
  try {
    const { item_id, ...updateParams } = params;
    const updatedItem = await apiService.updateItem(item_id, updateParams);
    
    return createSuccessResponse(
      `記事が正常に更新されました。\nタイトル: ${updatedItem.title}\nURL: ${updatedItem.url}\n\n` + 
      JSON.stringify(updatedItem, null, 2)
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Error updating Qiita article: ${errorMessage}`);
  }
};

const getQiitaMarkdownRules = async (): Promise<any> => {
  try {
    const markdownRules = await apiService.getMarkdownRules();
    return createSuccessResponse(markdownRules);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Error fetching Qiita markdown rules: ${errorMessage}`);
  }
};

export const getToolDefinitions = () => {
  return [
    {
      name: "get_my_qiita_articles",
      description: "get current authenticated user qiita articles",
      parameters: getUserArticlesSchema.shape,
      handler: (params: GetUserArticlesParams) => getMyQiitaUserArticles(params)
    },
    {
      name: "get_qiita_item",
      description: "get a specific Qiita article by its ID",
      parameters: getItemSchema.shape,
      handler: (params: GetItemParams) => getQiitaItem(params)
    },
    {
      name: "update_qiita_article",
      description: "update an existing Qiita article",
      parameters: updateArticleSchema.shape,
      handler: (params: UpdateArticleParams) => updateQiitaArticle(params)
    },
    {
      name: "post_qiita_article",
      description: "create a new article on Qiita",
      parameters: postArticleSchema.shape,
      handler: (params: PostArticleParams) => postQiitaArticle(params)
    },
    {
      name: "get_qiita_markdown_rules",
      description: "get Qiita markdown syntax rules, cheat sheet",
      parameters: {} as z.ZodRawShape,
      handler: () => getQiitaMarkdownRules()
    }
  ];
};