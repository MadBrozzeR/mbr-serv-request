import type { IncomingMessage, ServerResponse } from 'http';

declare module 'mbr-serv-request' {
  interface CookieOptions {
    expires?: Date;
    masAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
  }

  interface RouteAsFunc {
    (this: Request, request: Request): void;
  }

  type RouteAsString = string;

  interface RouteAsObj {
    [key: string]: RouteAsFunc;
  }

  interface Router {
    [key: string]: RouteAsFunc | RouteAsString | RouteAsObj;
  }

  interface ServeOptions {
    root: string;
    index?: string;
  }

  interface UrlParams {
    [key: string]: string | string[];
  }

  class Url {
    url: string;
    path?: string;
    search?: string;
    params?: UrlParams;
    fileName?: string;
    extension?: string;
    directory?: string;

    set(url: string): Url;
    getPath(): string;
    getSearch(): string;
    getParams(): UrlParams;
    getFileName(): string;
    getDirectory(): string;
    getExtension(): string | null;
    normalize(root: string): string | null;
  }

  interface ProxyOptions {
    hostname?: string;
    port?: number;
    path?: string;
    method?: string;
    headers: Record<string, number | string | string[] | undefined>;
  }

  interface GetFileOptions {
    file?: string;
    root?: string;
  }

  export class Request {
    request: IncomingMessage;
    response: ServerResponse<IncomingMessage> & { req: IncomingMessage };
    ip: string;
    port: number;
    headers: Record<string, string>;
    cookies: null | Record<string, string>;
    status: number;

    constructor(request: IncomingMessage, response: ServerResponse<IncomingMessage>);

    valueOf(): object;
    toJSON(): object;

    getData(callback?: (data: Buffer) => void): Promise<Buffer>;
    getCookies(): Record<string, string>;
    getCookie(name): string | undefined;
    setCookie(name: string, value: string, options?: CookieOptions): void;
    delCookie(name: string): void;

    match(regExp: RegExp, callback?: (this: Request, match: RegExpExecArray, request: Request) => void): RegExpExecArray | null;
    send(data?: string | Buffer, extension?: string): void;

    route(router: Router): boolean | undefined;

    simpleServer(options: ServeOptions): void;
    serve(options: ServeOptions): void;

    getFile(options?: GetFileOptions): Promise<Buffer>;

    getHost(): string | undefined;

    redirect(path: string, status?: number): void;

    proxy(options?: ProxyOptions): void;

    getUrl(customPath?: string): Url;
  }
}
