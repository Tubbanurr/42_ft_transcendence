import { authService } from "../services/auth.js";

export interface Route {
  path: string;
  component: any;
  title?: string;
  requiresAuth?: boolean;
}

export class Router {
  private routes: Route[] = [];
  private currentRoute: Route | null = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.setupEventListeners();
  }

  public addRoute(route: Route): void {
    this.routes.push(route);
  }

  public addRoutes(routes: Route[]): void {
    this.routes.push(...routes);
  }

  private setupEventListeners(): void {
    window.addEventListener("popstate", (event) => {
      const path = this.getCurrentPath();
      const params = (event.state && event.state.params) || {};
      this.handleRoute(path, params);
    });

    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest("a[href]") as HTMLAnchorElement;

      if (link && this.isInternalLink(link.href)) {
        event.preventDefault();
        this.navigate(link.getAttribute("href") || "");
      }
    });
  }

  public getCurrentPath(): string {
    return window.location.pathname;
  }

  private isInternalLink(href: string): boolean {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      return true;
    }
  }

  public navigate(path: string, params: Record<string, any> = {}): void {
    const currentPath = this.getCurrentPath();
    const state = window.history.state || {};
    const mergedParams = { ...(state.params || {}), ...params };

    if (currentPath !== path) {
      window.history.pushState({ params: mergedParams }, "", path);
      this.handleRoute(path, mergedParams);
    }
  }

  public replace(path: string, params: Record<string, any> = {}): void {
    window.history.replaceState({ params }, "", path);
    this.handleRoute(path, params);
  }

  private matchRoute(
    path: string,
    routePath: string
  ): Record<string, string> | null {
    const pathParts = path.split("/").filter(Boolean);
    const routeParts = routePath.split("/").filter(Boolean);

    if (pathParts.length !== routeParts.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        const key = routeParts[i].substring(1);
        params[key] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return params;
  }

  private handleRoute(
    path: string,
    extraParams: Record<string, any> = {}
  ): void {
    for (const route of this.routes) {
      const params = this.matchRoute(path, route.path);
      if (params) {
        const stateParams = (window.history.state && window.history.state.params) || {};
        const merged = { ...stateParams, ...params, ...extraParams };

        if (route.requiresAuth && !this.isAuthenticated()) {
          this.navigate("/login");
          return;
        }

        this.renderRoute(route, merged);
        return;
      }
    }
    this.handle404();
  }

  private renderRoute(
    route: Route,
    params: Record<string, any> = {}
  ): void {
    if (this.currentRoute) {
      this.container.innerHTML = "";
    }

    try {
      const ComponentClass = route.component;
      const component = new ComponentClass(params);

      let element;
      if (typeof component.render === "function") {
        element = component.render();
      } else if (typeof component.getElement === "function") {
        element = component.getElement();
      } else {
        throw new Error("Component must have render() or getElement() method");
      }

      this.container.appendChild(element);

      if (route.title) {
        document.title = route.title;
      }

      this.currentRoute = route;

      const app = (window as any).app;
      if (app && app.updateNavbar) {
        setTimeout(() => app.updateNavbar(), 100);
      }

      console.log("Navigated to:", route.path, "with params:", params);
    } catch (error) {
      console.error("Error rendering route:", error);
      this.handle500();
    }
  }

  private handle404(): void {
    this.container.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <p class="text-xl text-gray-600 mb-8">Page not found</p>
          <button onclick="window.app?.navigate('/home')"
                  class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Go Home
          </button>
        </div>
      </div>
    `;
    document.title = "404 - Page Not Found";
  }

  private handle500(): void {
    this.container.innerHTML = `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-6xl font-bold text-gray-900 mb-4">500</h1>
          <p class="text-xl text-gray-600 mb-8">Internal Server Error</p>
          <button onclick="window.location.reload()"
                  class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Reload Page
          </button>
        </div>
      </div>
    `;
    document.title = "500 - Internal Server Error";
  }

  private isAuthenticated(): boolean {
    return authService.isAuthenticated();
  }

  public start(): void {
    const initialPath = this.getCurrentPath();
    const params = (window.history.state && window.history.state.params) || {};
    this.handleRoute(initialPath, params);
  }

  public getCurrentRoute(): Route | null {
    return this.currentRoute;
  }

  public back(): void {
    window.history.back();
  }

  public forward(): void {
    window.history.forward();
  }
}
