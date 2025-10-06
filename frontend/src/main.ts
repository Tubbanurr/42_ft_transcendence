import { App } from './app';
import './styles/tailwind.css';
import './styles/variables.css';
import './styles/tournament.css';
import './styles/twoplayer-styles.css';

// DOM hazır olduğunda uyulamayıb initle
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize();
});

window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
}); 

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

export * from './app';
