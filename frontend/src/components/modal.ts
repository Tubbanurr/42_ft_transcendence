export interface ModalOptions {
  title?: string;
  content: string | HTMLElement;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closable?: boolean;
  onClose?: () => void;
}

export class Modal {
  private element: HTMLElement;
  private backdrop: HTMLElement;

  constructor(options: ModalOptions) {
    this.backdrop = document.createElement('div');
    this.element = document.createElement('div');
    this.setup(options);
  }

  private setup(options: ModalOptions): void {
    this.backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    this.element.className = this.getModalClasses(options.size);
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-lg shadow-xl';
    
    if (options.title || options.closable) {
      const header = document.createElement('div');
      header.className = 'flex items-center justify-between p-6 border-b border-gray-200';
      
      if (options.title) {
        const title = document.createElement('h3');
        title.className = 'text-lg font-medium text-gray-900';
        title.textContent = options.title;
        header.appendChild(title);
      }
      
      if (options.closable !== false) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'text-gray-400 hover:text-gray-600';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.fontSize = '24px';
        closeBtn.addEventListener('click', () => this.close(options.onClose));
        header.appendChild(closeBtn);
      }
      
      modalContent.appendChild(header);
    }
    
    const body = document.createElement('div');
    body.className = 'p-6';
    
    if (typeof options.content === 'string') {
      body.innerHTML = options.content;
    } else {
      body.appendChild(options.content);
    }
    
    modalContent.appendChild(body);
    this.element.appendChild(modalContent);
    this.backdrop.appendChild(this.element);
    
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close(options.onClose);
      }
    });
  }

  private getModalClasses(size: string = 'md'): string {
    const sizeClasses: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl'
    };
    
    return `w-full ${sizeClasses[size] || sizeClasses.md} mx-4`;
  }

  public show(): void {
    document.body.appendChild(this.backdrop);
    document.body.style.overflow = 'hidden';
  }

  public close(onClose?: () => void): void {
    document.body.style.overflow = '';
    this.backdrop.remove();
    if (onClose) onClose();
  }

  public destroy(): void {
    this.close();
  }
}
