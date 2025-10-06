import { AppDataSource } from "../database";
import { Game } from "../entities/Game";
import { GamePlayer} from "../entities/GamePlayer";
import { generateUniqueRoomCode } from "../utils/roomCode";
import { User } from "../entities/User";

const getTurkeyDate = () => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Istanbul"}));
};

export const GameService = {
  async createGame(hostId: number) {
    const repo = AppDataSource.getRepository(Game);
    const gpRepo = AppDataSource.getRepository(GamePlayer);

    const roomCode = await generateUniqueRoomCode();

    const game = repo.create({ 
      roomCode, 
      hostId, 
      guestId: null, 
      status: "waiting",
      gameType: "two_player",
      hostScore: 0,
      guestScore: 0,
      winnerId: null,
      startedAt: null,
      finishedAt: null,
      duration: null
    });
    await repo.save(game);

    const host = gpRepo.create({ gameId: game.id, userId: hostId, role: "host", connected: false, lastSeenAt: null });
    await gpRepo.save(host);

    return game;
  },

  async joinGameByCode(userId: number, roomCode: string) {
    const gameRepo = AppDataSource.getRepository(Game);
    const gpRepo = AppDataSource.getRepository(GamePlayer);

    const game = await gameRepo.findOne({ where: { roomCode } });
    if (!game) throw new Error("Room not found");

    const exists = await gpRepo.findOne({ where: { gameId: game.id, userId } });
    if (exists) return game;

    if (game.guestId && game.guestId !== userId) throw new Error("Room is full");

    if (!game.hostId) {
      game.hostId = userId;
      await gameRepo.save(game);
      await gpRepo.save(gpRepo.create({ gameId: game.id, userId, role: "host", connected: false }));
      return game;
    }

    if (!game.guestId) {
      game.guestId = userId;
      await gameRepo.save(game);
      await gpRepo.save(gpRepo.create({ gameId: game.id, userId, role: "guest", connected: false }));
      return game;
    }

    return game;
  },

  async getByCode(roomCode: string) {
    return await AppDataSource.getRepository(Game).findOne({ where: { roomCode } });
  },

  async setConnection(gameId: number, userId: number, connected: boolean) {
    const gpRepo = AppDataSource.getRepository(GamePlayer);
    await gpRepo
      .createQueryBuilder()
      .update()
      .set({ connected, lastSeenAt: () => "CURRENT_TIMESTAMP" })
      .where("gameId = :gameId AND userId = :userId", { gameId, userId })
      .execute();
  },

  async startGame(gameId: number) {
    const gameRepo = AppDataSource.getRepository(Game);
    await gameRepo.update(gameId, {
      status: "running",
      startedAt: new Date()
    });
  },

  async finishGame(gameId: number, hostScore: number, guestScore: number) {
    const gameRepo = AppDataSource.getRepository(Game);
    const game = await gameRepo.findOne({ where: { id: gameId } });
    
    if (!game) throw new Error("Game not found");

    const winnerId = hostScore > guestScore ? game.hostId : 
                    guestScore > hostScore ? game.guestId : null;
    
    const finishedAt = new Date();
    const duration = game.startedAt ? 
      Math.floor((finishedAt.getTime() - game.startedAt.getTime()) / 1000) : null;

    await gameRepo.update(gameId, {
      status: "finished",
      hostScore,
      guestScore,
      winnerId,
      finishedAt,
      duration
    });

    return await gameRepo.findOne({ where: { id: gameId } });
  },

  async getMatchHistory(userId: number, page: number = 1, limit: number = 10) {
    const gameRepo = AppDataSource.getRepository(Game);
    const userRepo = AppDataSource.getRepository(User);
    
    const offset = (page - 1) * limit;
    
    const [games, total] = await gameRepo
      .createQueryBuilder("game")
      .where("(game.hostId = :userId OR game.guestId = :userId) AND game.status = :status", 
             { userId, status: "finished" })
      .orderBy("game.finishedAt", "DESC")
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const gamesWithPlayers = await Promise.all(
      games.map(async (game: Game) => {
        const [host, guest] = await Promise.all([
          game.hostId ? userRepo.findOne({ 
            where: { id: game.hostId },
            select: ["id", "username", "display_name"]
          }) : null,
          game.guestId ? userRepo.findOne({ 
            where: { id: game.guestId },
            select: ["id", "username", "display_name"]
          }) : null
        ]);

        return {
          id: game.id,
          roomCode: game.roomCode,
          gameType: game.gameType,
          status: game.status,
          hostScore: game.hostScore,
          guestScore: game.guestScore,
          winnerId: game.winnerId,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
          duration: game.duration,
          host,
          guest,
          isWin: game.winnerId === userId,
          isDraw: game.winnerId === null
        };
      })
    );

    return {
      games: gamesWithPlayers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getGameStats(userId: number) {
    const gameRepo = AppDataSource.getRepository(Game);
    
    const stats = await gameRepo
      .createQueryBuilder("game")
      .select([
        "COUNT(*) as totalGames",
        "SUM(CASE WHEN game.winnerId = :userId THEN 1 ELSE 0 END) as wins",
        "SUM(CASE WHEN game.winnerId IS NULL THEN 1 ELSE 0 END) as draws",
        "SUM(CASE WHEN game.winnerId != :userId AND game.winnerId IS NOT NULL THEN 1 ELSE 0 END) as losses"
      ])
      .where("(game.hostId = :userId OR game.guestId = :userId) AND game.status = :status", 
             { userId, status: "finished" })
      .getRawOne();

    return {
      totalGames: parseInt(stats.totalGames) || 0,
      wins: parseInt(stats.wins) || 0,
      draws: parseInt(stats.draws) || 0,
      losses: parseInt(stats.losses) || 0,
      winRate: stats.totalGames > 0 ? 
        ((parseInt(stats.wins) / parseInt(stats.totalGames)) * 100).toFixed(1) : "0.0"
    };
  },

  async createTwoPlayerGame(player1Username: string, player2Username: string) {
    const userRepo = AppDataSource.getRepository(User);
    const gameRepo = AppDataSource.getRepository(Game);

    console.log(`🆕 createTwoPlayerGame çağrıldı: player1=${player1Username}, player2=${player2Username}`);

    const player1 = await userRepo.findOne({ where: { username: player1Username } });
    const player2 = await userRepo.findOne({ where: { username: player2Username } });

    if (!player1 || !player2) {
      throw new Error("Oyunculardan biri bulunamadı");
    }

    console.log(`🆕 Kullanıcılar bulundu: player1 ID=${player1.id}, player2 ID=${player2.id}`);

    const roomCode = await generateUniqueRoomCode();
    const game = gameRepo.create({
      roomCode,
      hostId: player1.id,
      guestId: player2.id,
      status: "running",
      gameType: "two_player",
      hostScore: 0,
      guestScore: 0,
      winnerId: null,
      startedAt: getTurkeyDate(),
      finishedAt: null
    });

    await gameRepo.save(game);
    console.log(`🆕 Oyun oluşturuldu: ID=${game.id}, host=${player1Username}(${player1.id}), guest=${player2Username}(${player2.id})`);
    return game;
  },

  async completeGame(gameId: number, playerOneScore: number, playerTwoScore: number, winnerUsername: string | null) {
    const gameRepo = AppDataSource.getRepository(Game);
    const userRepo = AppDataSource.getRepository(User);

    console.log(`🎮 CompleteGame çağrıldı: gameId=${gameId}, p1Score=${playerOneScore}, p2Score=${playerTwoScore}, winner=${winnerUsername}`);

    const game = await gameRepo.findOne({ where: { id: gameId } });
    if (!game) {
      throw new Error("Oyun bulunamadı");
    }

    console.log(`🎮 Oyun bulundu: hostId=${game.hostId}, guestId=${game.guestId}`);

    let winnerId = null;
    if (winnerUsername) {
      const winnerUser = await userRepo.findOne({ where: { username: winnerUsername } });
      if (winnerUser) {
        winnerId = winnerUser.id;
      }
    }

    game.hostScore = playerOneScore;
    game.guestScore = playerTwoScore;
    game.winnerId = winnerId;
    game.finishedAt = getTurkeyDate();
    game.status = "finished";

    console.log(`🎮 Oyun kaydediliyor: hostScore=${game.hostScore}, guestScore=${game.guestScore}, winnerId=${winnerId}`);
    await gameRepo.save(game);
    console.log(`✅ Oyun başarıyla kaydedildi!`);
    return game;
  },
};
