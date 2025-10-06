import { createTwoPlayerGamePage, initializeTwoPlayerGame } from '../game/twoplayer/index.js';

export class TwoPlayerGamePage {
    private element: HTMLElement;
    private game: any = null;
    private isInitialized: boolean = false;

    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'twoplayer-game-page';
        this.setup();
    }

    private setup(): void {
        this.element.innerHTML = createTwoPlayerGamePage();

        setTimeout(() => {
            if (!this.isInitialized) {
                this.game = initializeTwoPlayerGame();
                this.isInitialized = true;
            }
        }, 100);
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public render(): HTMLElement {
        return this.element;
    }

    public destroy(): void {
        if (this.game && typeof this.game.destroy === 'function') {
            this.game.destroy();
            this.game = null;
        }
        this.isInitialized = false;

        const canvas = this.element.querySelector('#twoPlayerGameCanvas');
        if (canvas) {
            canvas.remove();
        }
    }
}
