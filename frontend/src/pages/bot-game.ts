import { BotGamePageTest } from '../game/botgame/botgame-page.js';

export class BotGamePage {
    private element: HTMLElement;
    private botGameComponent: any = null;

    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'page-container bot-game-page';
        this.setup();
    }

    private setup(): void {
        try {
            this.botGameComponent = new BotGamePageTest();
            this.botGameComponent.mount(this.element);
        } catch (error) {
            console.error('Bot oyunu başlatılırken hata:', error);
            this.showError('Bot oyunu yüklenirken bir hata oluştu.');
        }
    }

    private showError(message: string): void {
        this.element.innerHTML = `
            <div class="error-container">
                <h2>❌ Hata</h2>
                <p>${message}</p>
                <button onclick="window.location.reload()">Sayfayı Yenile</button>
            </div>
        `;
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public render(): HTMLElement {
        return this.element;
    }

    public destroy(): void {
        if (this.botGameComponent && typeof this.botGameComponent.unmount === 'function') {
            this.botGameComponent.unmount();
        }
        this.botGameComponent = null;
    }
}
