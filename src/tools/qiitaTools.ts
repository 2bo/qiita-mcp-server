import { z } from "zod";
import { QiitaApiService } from "../services/qiita.js";

type QiitaToolService = Pick<
  QiitaApiService,
  | "getAuthenticatedUserItems"
  | "getItem"
  | "updateItem"
  | "createItem"
  | "getMarkdownRules"
>;
type QiitaToolDefinition = {
  name: string;
  description: string;
  parameters: z.ZodRawShape;
  handler: (params: any) => Promise<any>;
};

const createTextResponse = (text: string, isError = false): any => ({
  content: [{ type: "text", text }],
  ...(isError ? { isError: true } : {}),
});

const createJsonResponse = (value: unknown): any =>
  createTextResponse(JSON.stringify(value, null, 2));

const executeTool = async (
  action: () => Promise<any>,
  errorPrefix: string,
  formatter: (value: any) => any = createJsonResponse
): Promise<any> => {
  try {
    return formatter(await action());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createTextResponse(`Error: ${errorPrefix}: ${errorMessage}`, true);
  }
};

const createMutationSuccessText = (actionLabel: string, item: { title: string; url: string }) =>
  `${actionLabel}\nタイトル: ${item.title}\nURL: ${item.url}\n\n${JSON.stringify(item, null, 2)}`;

const getUserArticlesSchema = z.object({
  page: z.number().optional().default(1).describe("Page number for pagination"),
  per_page: z.number().optional().default(20).describe("Number of items per page"),
});
type GetUserArticlesParams = z.infer<typeof getUserArticlesSchema>;

const getMyQiitaUserArticles = async (
  apiService: Pick<QiitaToolService, "getAuthenticatedUserItems">,
  params: GetUserArticlesParams
): Promise<any> => {
  const { page = 1, per_page = 20 } = params;
  return executeTool(
    () => apiService.getAuthenticatedUserItems(page, per_page),
    "Error fetching Qiita items"
  );
};

const getItemSchema = z.object({
  item_id: z.string().describe("The ID of the Qiita article to fetch"),
});
type GetItemParams = z.infer<typeof getItemSchema>;

const getQiitaItem = async (
  apiService: Pick<QiitaToolService, "getItem">,
  params: GetItemParams
): Promise<any> => {
  const { item_id } = params;
  return executeTool(
    () => apiService.getItem(item_id),
    "Error fetching Qiita item"
  );
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

const postQiitaArticle = async (
  apiService: Pick<QiitaToolService, "createItem">,
  params: PostArticleParams
): Promise<any> => {
  return executeTool(
    () => apiService.createItem(params),
    "Error posting Qiita article",
    (newItem) => createTextResponse(createMutationSuccessText("記事が正常に投稿されました。", newItem))
  );
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

const updateQiitaArticle = async (
  apiService: Pick<QiitaToolService, "updateItem">,
  params: UpdateArticleParams
): Promise<any> => {
  const { item_id, ...updateParams } = params;
  return executeTool(
    () => apiService.updateItem(item_id, updateParams),
    "Error updating Qiita article",
    (updatedItem) =>
      createTextResponse(createMutationSuccessText("記事が正常に更新されました。", updatedItem))
  );
};

const getQiitaMarkdownRules = async (
  apiService: Pick<QiitaToolService, "getMarkdownRules">
): Promise<any> => {
  return executeTool(
    () => apiService.getMarkdownRules(),
    "Error fetching Qiita markdown rules",
    createTextResponse
  );
};

export const getToolDefinitions = (
  apiService: QiitaToolService = new QiitaApiService()
): QiitaToolDefinition[] => {
  return [
    {
      name: "get_my_qiita_articles",
      description: "get current authenticated user qiita articles",
      parameters: getUserArticlesSchema.shape,
      handler: (params: GetUserArticlesParams) => getMyQiitaUserArticles(apiService, params)
    },
    {
      name: "get_qiita_item",
      description: "get a specific Qiita article by its ID",
      parameters: getItemSchema.shape,
      handler: (params: GetItemParams) => getQiitaItem(apiService, params)
    },
    {
      name: "update_qiita_article",
      description: "update an existing Qiita article",
      parameters: updateArticleSchema.shape,
      handler: (params: UpdateArticleParams) => updateQiitaArticle(apiService, params)
    },
    {
      name: "post_qiita_article",
      description: "create a new article on Qiita",
      parameters: postArticleSchema.shape,
      handler: (params: PostArticleParams) => postQiitaArticle(apiService, params)
    },
    {
      name: "get_qiita_markdown_rules",
      description: "get Qiita markdown syntax rules, cheat sheet",
      parameters: {} as z.ZodRawShape,
      handler: () => getQiitaMarkdownRules(apiService)
    }
  ];
};
