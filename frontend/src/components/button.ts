export interface ButtonOptions {
  text: string;
  type?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export class Button {
  private element: HTMLButtonElement;

  constructor(options: ButtonOptions) {
    this.element = document.createElement('button');
    this.setup(options);
  }

  private setup(options: ButtonOptions): void {
    this.element.textContent = options.text;
    this.element.className = this.getClasses(options);
    
    if (options.onClick) {
      this.element.addEventListener('click', options.onClick);
    }

    if (options.disabled) {
      this.element.disabled = true;
    }
  }

  private getClasses(options: ButtonOptions): string {
    const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
    const typeClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-300 text-gray-800 hover:bg-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700'
    };
    const sizeClasses = {
      sm: 'text-sm px-2 py-1',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-6 py-3'
    };

    return `${baseClasses} ${typeClasses[options.type || 'primary']} ${sizeClasses[options.size || 'md']}`;
  }

  public getElement(): HTMLButtonElement {
    return this.element;
  }

  public destroy(): void {
    this.element.remove();
  }
}
