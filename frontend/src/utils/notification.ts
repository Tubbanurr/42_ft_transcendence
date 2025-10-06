export class NotificationManager {
  private static instance: NotificationManager;
  private container: HTMLElement;

  constructor() {
    this.container = this.createContainer();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private createContainer(): HTMLElement {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }
    return container;
  }

  public show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 5000): void {
    const notification = document.createElement('div');
    
    const baseClasses = 'max-w-sm p-4 rounded-lg shadow-lg text-white font-medium transition-all duration-300 transform translate-x-full flex items-center space-x-3';
    
    let typeClasses = '';
    let icon = '';
    
    switch (type) {
      case 'success':
        typeClasses = 'bg-green-500';
        icon = '✅';
        break;
      case 'error':
        typeClasses = 'bg-red-500';
        icon = '❌';
        break;
      case 'warning':
        typeClasses = 'bg-yellow-500';
        icon = '⚠️';
        break;
      default:
        typeClasses = 'bg-blue-500';
        icon = 'ℹ️';
    }
    
    notification.className = `${baseClasses} ${typeClasses}`;
    notification.innerHTML = `
      <span class="text-lg">${icon}</span>
      <span class="flex-1">${message}</span>
      <button class="text-white/80 hover:text-white text-xl font-bold ml-2" onclick="this.parentElement.remove()">×</button>
    `;
    
    this.container.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);
  }

  private removeNotification(notification: HTMLElement): void {
    if (notification.parentElement) {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }

  public clear(): void {
    this.container.innerHTML = '';
  }
}

export function showNotification(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 5000): void {
  NotificationManager.getInstance().show(message, type, duration);
}
