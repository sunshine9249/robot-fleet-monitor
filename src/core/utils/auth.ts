import jwtDecode from "jwt-decode";
import type { Page } from "../types/pages";
import type { Resource } from "../resources/resource";
import { publicApi } from "./api";

export interface TokenResponse {
  accessToken: string;
  accessTokenExp: number;
  defaultRoute?: string;
}

interface JwtPayload {
  sub: number;
  resources?: Resource[];
  pages?: Page[];
}

abstract class Auth {
  private defaultRoute: string = "/dashboard";

  public getDefaultRoute(): string {
    return this.defaultRoute;
  }

  protected setDefaultRoute(route: string) {
    this.defaultRoute = route;
  }

  public abstract init(): Promise<void>;

  public abstract getAccessToken(): string;
  protected abstract setAccessToken(token: string, exp: number): void;
  protected abstract clearAccessToken(): void;
  public abstract handleTokenResponse(response: TokenResponse): void;

  public abstract onTokenUpdate(fn: (loggedIn: boolean) => void): () => void;

  public abstract login(
    username: string,
    password: string,
    remember: boolean,
  ): Promise<void>;
  public abstract logout(): Promise<void>;

  /**
   * 토큰 보유 여부. 로그인 전(로그인 화면, 토큰 재발급 대기 중)에는 토큰이 없는 게
   * 정상이라, 그 경우까지 예외로 다루지 않으려고 둡니다.
   */
  public hasAccessToken(): boolean {
    try {
      this.getAccessToken();
      return true;
    } catch {
      return false;
    }
  }

  private getDecoded() {
    const token = this.getAccessToken();
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded;
  }

  /** 토큰이 바뀌지 않는 동안은 같은 Set 을 돌려줍니다 */
  private permissionCache: {
    token: string;
    pages: ReadonlySet<Page>;
    resources: ReadonlySet<Resource>;
  } | null = null;

  private getPermissions() {
    const token = this.getAccessToken();
    if (this.permissionCache?.token !== token) {
      const decoded = jwtDecode<JwtPayload>(token);
      this.permissionCache = {
        token,
        pages: new Set(decoded.pages ?? []),
        resources: new Set(decoded.resources ?? []),
      };
    }
    return this.permissionCache;
  }

  /** 열 수 있는 화면 */
  public getPagePermissions(): ReadonlySet<Page> {
    return this.getPermissions().pages;
  }

  /** 부를 수 있는 리소스(API) */
  public getResourcePermissions(): ReadonlySet<Resource> {
    return this.getPermissions().resources;
  }
}

class WebAuth extends Auth {
  private accessToken: string | null = null;
  private timeout: number | null = null;

  private listeners = new Set<(loggedIn: boolean) => void>();

  public async init() {
    await this.renewAccessToken();
  }

  public async login(username: string, password: string, remember: boolean) {
    const response = await publicApi
      .post("/api/auth/login", {
        json: {
          username,
          password,
          remember,
        },
      })
      .json<TokenResponse>();

    this.handleTokenResponse(response);
  }

  public async logout() {
    await publicApi.post("/api/auth/logout", {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
    this.clearAccessToken();
  }

  public getAccessToken(): string {
    if (this.accessToken === null) {
      throw new Error("No access token found");
    }
    return this.accessToken;
  }

  protected setAccessToken(token: string, exp: number) {
    this.accessToken = token;

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const timeLeft = exp - Date.now() - 60000;
    this.timeout = window.setTimeout(() => this.renewAccessToken(), timeLeft);

    this.listeners.forEach((listener) => listener(true));
  }

  protected clearAccessToken() {
    this.accessToken = null;
    this.listeners.forEach((listener) => listener(false));
  }

  public onTokenUpdate(fn: (loggedIn: boolean) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  protected async renewAccessToken() {
    const response = await publicApi
      .post("/api/auth/renew")
      .json<TokenResponse>();

    this.handleTokenResponse(response);
  }

  public handleTokenResponse(response: TokenResponse) {
    if (response.defaultRoute) {
      this.setDefaultRoute(response.defaultRoute);
    }
    this.setAccessToken(response.accessToken, response.accessTokenExp);
  }
}

export const auth: Auth = new WebAuth();
