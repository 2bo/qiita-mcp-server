/**
 * Qiita API操作のためのサービスクラス
 * API通信の共通処理を提供します
 */
type QiitaApiServiceOptions = {
  apiToken?: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

const USER_FIELDS_TO_OMIT = [
  "facebook_id",
  "followees_count",
  "followers_count",
  "github_login_name",
  "profile_image_url",
  "team_only",
  "twitter_screen_name",
  "website_url",
] as const;
const MARKDOWN_RULES_ITEM_ID = "c686397e4a0f4f11683d";

export class QiitaApiService {
  private readonly baseUrl: string;
  private apiToken: string | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(options: QiitaApiServiceOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://qiita.com/api/v2';
    this.apiToken = options.apiToken ?? process.env.QIITA_API_TOKEN;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /**
   * APIトークンの存在を確認
   * @throws {Error} APIトークンが設定されていない場合
   */
  private validateToken = (): void => {
    if (!this.apiToken) {
      throw new Error('Qiita API token is not provided. Set QIITA_API_TOKEN environment variable before using this tool.');
    }
  };

  /**
   * APIリクエストの共通ヘッダーを取得
   */
  private getHeaders = (): Record<string, string> => {
    this.validateToken();
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };
  };

  /**
   * レスポンスエラーを処理
   */
  private handleErrorResponse = async (response: Response): Promise<never> => {
    const errorText = await response.text();
    throw new Error(`Qiita API returned ${response.status}: ${response.statusText}\n${errorText}`);
  };

  /**
   * 共通のJSONリクエスト処理
   */
  private requestJson = async <T>(
    path: string,
    init?: RequestInit
  ): Promise<T> => {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
  };

  /**
   * オブジェクトから不要なフィールドを削除
   */
  private removeUndefinedFields = <T extends Record<string, any>>(obj: T): T => {
    const result = { ...obj };
    Object.keys(result).forEach(key => {
      if (result[key] === undefined) {
        delete result[key];
      }
    });
    return result;
  };

  /**
   * Qiita記事データから不要なフィールドを削除し、LLMの入力トークンを削減
   */
  private filterItem = (item: any): any => {
    // rendered_bodyを削除して、トークン数を節約
    const { rendered_body, ...rest } = item;

    return {
      ...rest,
      user: this.filterUser(rest.user),
    };
  };

  /**
   * 記事リストから不要なフィールドを削除
   */
  private filterItems = (items: any[]): any[] => {
    return items.map(item => {
      const { rendered_body, body, ...rest } = item;

      return {
        ...rest,
        user: this.filterUser(rest.user),
      };
    });
  };

  /**
   * ユーザー情報から過剰なフィールドを削除
   */
  private filterUser = (user: Record<string, any> | undefined) => {
    if (!user) {
      return user;
    }

    const filteredUser = { ...user };
    USER_FIELDS_TO_OMIT.forEach((field) => {
      delete filteredUser[field];
    });
    return filteredUser;
  };

  /**
   * 認証ユーザーの記事一覧を取得
   */
  getAuthenticatedUserItems = async (page: number = 1, per_page: number = 20): Promise<any[]> => {
    this.validateToken();
    const items = await this.requestJson<any[]>(
      `/authenticated_user/items?page=${page}&per_page=${per_page}`
    );
    return this.filterItems(items);
  };

  /**
   * 特定の記事を取得
   */
  getItem = async (item_id: string): Promise<any> => {
    this.validateToken();
    const item = await this.requestJson(`/items/${item_id}`);
    return this.filterItem(item);
  };

  /**
   * 記事を更新
   */
  updateItem = async (
    item_id: string, 
    params: {
      title: string;
      body: string;
      tags?: Array<{ name: string; versions?: string[] }>;
      private?: boolean;
      organization_url_name?: string;
      slide?: boolean;
    }
  ): Promise<any> => {
    this.validateToken();
    const requestBody = this.removeUndefinedFields(params);
    const item = await this.requestJson(`/items/${item_id}`, {
      method: 'PATCH',
      body: JSON.stringify(requestBody)
    });
    return this.filterItem(item);
  };

  /**
   * 新規記事を投稿
   */
  createItem = async (
    params: {
      title: string;
      body: string;
      tags: Array<{ name: string; versions?: string[] }>;
      private?: boolean;
      tweet?: boolean;
      organization_url_name?: string;
      slide?: boolean;
    }
  ): Promise<any> => {
    this.validateToken();
    const requestBody = this.removeUndefinedFields(params);
    const item = await this.requestJson(`/items`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    return this.filterItem(item);
  };

  /**
   * Markdown構文ガイドを取得
   * Qiitaの特定記事のbodyを返す
   */
  getMarkdownRules = async (): Promise<string> => {
    this.validateToken();

    const item = await this.requestJson<{ body?: string }>(
      `/items/${MARKDOWN_RULES_ITEM_ID}`
    );
    return item.body || "Markdownコンテンツが見つかりませんでした。";
  };
}
