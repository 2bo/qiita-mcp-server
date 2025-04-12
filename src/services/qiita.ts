/**
 * Qiita API操作のためのサービスクラス
 * API通信の共通処理を提供します
 */
export class QiitaApiService {
  private readonly baseUrl = 'https://qiita.com/api/v2';
  private apiToken: string | undefined;

  constructor() {
    this.apiToken = process.env.QIITA_API_TOKEN;
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
    
    // ユーザー情報も過剰なフィールドを削除
    if (rest.user) {
      const {
        facebook_id,
        followees_count,
        followers_count,
        github_login_name,
        profile_image_url,
        team_only,
        twitter_screen_name,
        website_url,
        ...userRest
      } = rest.user;
      rest.user = userRest;
    }
    
    return rest;
  };

  /**
   * 記事リストから不要なフィールドを削除
   */
  private filterItems = (items: any[]): any[] => {
    return items.map(item => {
      const { rendered_body, body, ...rest } = item;
      
      if (rest.user) {
        const {
          facebook_id,
          followees_count,
          followers_count,
          github_login_name,
          profile_image_url,
          team_only,
          twitter_screen_name,
          website_url,
          ...userRest
        } = rest.user;
        rest.user = userRest;
      }
      
      return rest;
    });
  };

  /**
   * 認証ユーザーの記事一覧を取得
   */
  getAuthenticatedUserItems = async (page: number = 1, per_page: number = 20): Promise<any[]> => {
    this.validateToken();

    const response = await fetch(
      `${this.baseUrl}/authenticated_user/items?page=${page}&per_page=${per_page}`, 
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    
    const items = await response.json();
    return this.filterItems(items);
  };

  /**
   * 特定の記事を取得
   */
  getItem = async (item_id: string): Promise<any> => {
    this.validateToken();

    const response = await fetch(
      `${this.baseUrl}/items/${item_id}`, 
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    
    const item = await response.json();
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
    
    const response = await fetch(
      `${this.baseUrl}/items/${item_id}`, 
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    
    const item = await response.json();
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
    
    const response = await fetch(
      `${this.baseUrl}/items`, 
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    
    const item = await response.json();
    return this.filterItem(item);
  };

  /**
   * Markdown構文ガイドを取得
   * Qiitaの特定記事のbodyを返す
   */
  getMarkdownRules = async (): Promise<string> => {
    this.validateToken();
    
    // Qiitaのmarkdownルール記事IDを固定で使用
    const item_id = "c686397e4a0f4f11683d";
    
    const response = await fetch(
      `${this.baseUrl}/items/${item_id}`, 
      { headers: this.getHeaders() }
    );
    
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }
    
    const item = await response.json();
    return item.body || "Markdownコンテンツが見つかりませんでした。";
  };
}