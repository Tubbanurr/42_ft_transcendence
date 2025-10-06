export class DOMUtils {
  public static createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options: {
      className?: string;
      id?: string;
      textContent?: string;
      innerHTML?: string;
      attributes?: Record<string, string>;
      children?: HTMLElement[];
    } = {}
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    
    if (options.className) {
      element.className = options.className;
    }
    
    if (options.id) {
      element.id = options.id;
    }
    
    if (options.textContent) {
      element.textContent = options.textContent;
    }
    
    if (options.innerHTML) {
      element.innerHTML = options.innerHTML;
    }
    
    if (options.attributes) {
      Object.entries(options.attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
    }
    
    if (options.children) {
      options.children.forEach(child => {
        element.appendChild(child);
      });
    }
    
    return element;
  }

  public static querySelector<T extends HTMLElement = HTMLElement>(
    selector: string,
    parent: Document | Element = document
  ): T | null {
    return parent.querySelector(selector) as T | null;
  }

  public static querySelectorAll<T extends HTMLElement = HTMLElement>(
    selector: string,
    parent: Document | Element = document
  ): NodeListOf<T> {
    return parent.querySelectorAll(selector) as NodeListOf<T>;
  }

  public static addEventListener<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    element.addEventListener(type, listener, options);
    
    return () => {
      element.removeEventListener(type, listener, options);
    };
  }

  public static toggleClass(element: HTMLElement, className: string, force?: boolean): boolean {
    return element.classList.toggle(className, force);
  }

  public static addClass(element: HTMLElement, ...classNames: string[]): void {
    element.classList.add(...classNames);
  }

  public static removeClass(element: HTMLElement, ...classNames: string[]): void {
    element.classList.remove(...classNames);
  }

  public static hasClass(element: HTMLElement, className: string): boolean {
    return element.classList.contains(className);
  }

  public static getPosition(element: HTMLElement): { x: number; y: number } {
    const rect = element.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
    };
  }

  public static getSize(element: HTMLElement): { width: number; height: number } {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  public static isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  public static scrollIntoView(
    element: HTMLElement,
    options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest' }
  ): void {
    element.scrollIntoView(options);
  }

  public static getFormData(form: HTMLFormElement): Record<string, string> {
    const formData = new FormData(form);
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    
    return data;
  }

  public static setFormData(form: HTMLFormElement, data: Record<string, string>): void {
    Object.entries(data).forEach(([key, value]) => {
      const element = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
      if (element) {
        element.value = value;
      }
    });
  }

  public static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  public static throttle<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let lastTime = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastTime >= wait) {
        lastTime = now;
        func(...args);
      }
    };
  }

  public static loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  public static loadCSS(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
      document.head.appendChild(link);
    });
  }

  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch {
        textArea.remove();
        return false;
      }
    }
  }

  public static generateId(prefix: string = 'id'): string {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public static escapeHTML(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public static parseHTML(html: string): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content;
  }
}
