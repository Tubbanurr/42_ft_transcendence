export { BotPongGame } from './BotPongGame.js';
export { BotGamePage } from './botgame-page.js';

import './botgame-styles.css';

export class BotGameUtils {

   @param container
   @returns

  static initializeBotGame(container: HTMLElement): any {
    const { BotGamePage } = require('./botgame-page.js');
    const botGamePage = new BotGamePage();
    botGamePage.mount(container);
    return botGamePage;
  }

  static getDifficultyLevels() {
    return {
      BEGINNER: {
        name: 'Acemi',
        description: 'Yavaş tepki, çok hata yapar',
        reflexTime: 250,
        accuracy: 0.6,
        mistakeChance: 0.2
      },
      INTERMEDIATE: {
        name: 'Orta',
        description: 'Dengeli oyun, bazen hata yapar',
        reflexTime: 180,
        accuracy: 0.75,
        mistakeChance: 0.12
      },
      ADVANCED: {
        name: 'İleri',
        description: 'Hızlı tepki, az hata',
        reflexTime: 120,
        accuracy: 0.85,
        mistakeChance: 0.08
      },
      EXPERT: {
        name: 'Uzman',
        description: 'Çok hızlı, neredeyse hiç hata yapmaz',
        reflexTime: 80,
        accuracy: 0.95,
        mistakeChance: 0.03
      },
      HUMAN_LIKE: {
        name: 'İnsan-benzeri',
        description: 'Değişken performans, adaptif',
        reflexTime: 150,
        accuracy: 0.8,
        mistakeChance: 0.1
      }
    };
  }
  

  static formatGameStats(stats: any) {
    return {
      gamesPlayed: stats.gamesPlayed || 0,
      gamesWon: stats.gamesWon || 0,
      gamesLost: stats.gamesLost || 0,
      winRate: stats.gamesPlayed ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : '0.0',
      averageScore: stats.averageScore || 0,
      bestScore: stats.bestScore || 0,
      totalPlayTime: stats.totalPlayTime || 0
    };
  }

  static getBotPersonalities() {
    return [
      {
        type: 'aggressive',
        name: 'Saldırgan',
        description: 'Hızlı ve agresif oynar, risk alır',
        traits: { aggressiveness: 0.8, patience: 0.3, accuracy: 0.7 }
      },
      {
        type: 'defensive',
        name: 'Savunmacı',
        description: 'Sabırlı ve dikkatli, az hata yapar',
        traits: { aggressiveness: 0.3, patience: 0.8, accuracy: 0.9 }
      },
      {
        type: 'unpredictable',
        name: 'Öngörülemez',
        description: 'Rastgele davranır, sürpriz yapar',
        traits: { aggressiveness: 0.5, patience: 0.5, accuracy: 0.6 }
      },
      {
        type: 'adaptive',
        name: 'Adaptif',
        description: 'Oyuncuya göre kendini ayarlar',
        traits: { aggressiveness: 0.6, patience: 0.6, accuracy: 0.8 }
      }
    ];
  }

  static getControls() {
    return {
      player: {
        up: ['W', 'w'],
        down: ['S', 's']
      },
      game: {
        reset: ['R', 'r'],
      }
    };
  }

  static getGameRules() {
    return {
      maxScore: 5,
      ballSpeed: {
        initial: 5,
        increment: 0.05,
        maximum: 12
      },
      paddleSpeed: {
        player: 5,
        bot: 5
      },
      canvas: {
        width: 800,
        height: 400
      },
      paddle: {
        width: 10,
        height: 80
      },
      ball: {
        radius: 8
      }
    };
  }

  static loadGameStats() {
    try {
      const stats = localStorage.getItem('botGameStats');
      return stats ? JSON.parse(stats) : {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        averageScore: 0,
        bestScore: 0,
        totalPlayTime: 0,
        lastPlayed: null
      };
    } catch (error) {
      console.error('Bot oyunu istatistikleri yüklenirken hata:', error);
      return null;
    }
  }

  static saveGameStats(stats: any) {
    try {
      localStorage.setItem('botGameStats', JSON.stringify({
        ...stats,
        lastPlayed: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error('Bot oyunu istatistikleri kaydedilirken hata:', error);
      return false;
    }
  }
}

if (typeof document !== 'undefined') {
  console.log('Bot game styles imported via CSS import');
}

