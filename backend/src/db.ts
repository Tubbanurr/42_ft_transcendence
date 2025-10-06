import { AppDataSource } from "./database.js";
import { User } from "./entities/User.js";
import { Session } from "./entities/Session.js";
import { Friendship } from "./entities/Friendship.js";
import { Message } from "./entities/Message.js";
import { Notification } from "./entities/Notification.js";
import { Game } from "./entities/Game.js";
import { GamePlayer } from "./entities/GamePlayer.js";
import { Tournament, TournamentParticipant, Match } from "./entities/Tournament.js";

export const usersDb = {
  getById: (id: number) => AppDataSource.getRepository(User).findOneBy({ id }),
  getByUsername: (username: string) =>
    AppDataSource.getRepository(User).findOne({ where: { username } }),
  getByUsernameOrEmail: (usernameOrEmail: string) =>
    AppDataSource.getRepository(User).findOne({
      where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    }),
  getByGoogleId: (googleId: string) =>
    AppDataSource.getRepository(User).findOne({ where: { google_id: googleId } }),
  
  async searchUsers(query: string, excludeUserId: number) {
    return AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .where('user.id != :excludeUserId', { excludeUserId })
      .andWhere('(user.username LIKE :query OR user.display_name LIKE :query)', { 
        query: `%${query}%` 
      })
      .select(['user.id', 'user.username', 'user.display_name', 'user.avatar_url'])
      .limit(20)
      .getMany();
  },

  async updateAvatar(userId: number, avatarUrl: string) {
    return AppDataSource.getRepository(User).update(
      { id: userId },
      { avatar_url: avatarUrl }
    );
  },

  async updatePassword(userId: number, hashedPassword: string) {
    return AppDataSource.getRepository(User).update(
      { id: userId },
      { password_hash: hashedPassword }
    );
  },

  async deleteUser(userId: number) {
    return AppDataSource.transaction(async (em: any) => {
      console.log(`Starting user deletion for userId: ${userId}`);
      
      await em.getRepository(Session).delete({ userId });
      console.log('Sessions deleted');

      await em.getRepository(Notification).delete({ userId });
      console.log('Notifications deleted');

      await em.getRepository(Message).delete({ senderId: userId });
      await em.getRepository(Message).delete({ receiverId: userId });
      console.log('Messages deleted');

      await em.getRepository(Friendship).delete({ userId });
      await em.getRepository(Friendship).delete({ friendId: userId });
      console.log('Friendships deleted');

      await em.getRepository(GamePlayer).delete({ userId });
      console.log('Game players deleted');

      await em.getRepository(Game).delete({ hostId: userId });
      await em.getRepository(Game).delete({ guestId: userId });
      await em.getRepository(Game).delete({ winnerId: userId });
      console.log('Games deleted');

      try {
        const userCreatedTournaments = await em.getRepository(Tournament)
          .find({ where: { createdBy: { id: userId } } });
        
        console.log(`Found ${userCreatedTournaments.length} tournaments created by user`);
        
        for (const tournament of userCreatedTournaments) {
          await em.getRepository(Match).delete({ tournament: { id: tournament.id } });
          console.log(`Deleted matches for tournament ${tournament.id}`);
          
          await em.getRepository(TournamentParticipant).delete({ tournament: { id: tournament.id } });
          console.log(`Deleted participants for tournament ${tournament.id}`);
        }
        
        await em.getRepository(Tournament).delete({ createdBy: { id: userId } });
        console.log('Created tournaments deleted');
        
        const tournamentParticipants = await em.getRepository(TournamentParticipant)
          .find({ where: { user: { id: userId } } });
        
        console.log(`Found ${tournamentParticipants.length} tournament participations`);
        
        for (const participant of tournamentParticipants) {
          await em.getRepository(Match).delete({ player1: { id: participant.id } });
          await em.getRepository(Match).delete({ player2: { id: participant.id } });
          await em.getRepository(Match).delete({ winner: { id: participant.id } });
        }
        console.log('Tournament matches cleaned');
        
        await em.getRepository(TournamentParticipant).delete({ user: { id: userId } });
        console.log('Tournament participants deleted');
        
      } catch (error) {
        console.error('Tournament deletion error:', error);
        throw error;
      }

      const result = await em.getRepository(User).delete({ id: userId });
      console.log('User deleted successfully');
      
      return result;
    });
  },

  async getAllUsers(excludeUserId: number) {
    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder('user')
      .leftJoin(
        'friendships',
        'f',
        '(f.userId = :currentUser AND f.friendId = user.id) OR (f.userId = user.id AND f.friendId = :currentUser AND f.status = "accepted")',
        { currentUser: excludeUserId }
      )
      .where('user.id != :excludeUserId', { excludeUserId })
      .andWhere(`NOT EXISTS (
        SELECT 1 FROM friendships fb
        WHERE (
          (fb.userId = :currentUser AND fb.friendId = user.id) OR
          (fb.userId = user.id AND fb.friendId = :currentUser)
        )
        AND fb.status = 'blocked'
      )`, { currentUser: excludeUserId })
      .select([
        'user.id',
        'user.username',
        'user.display_name',
        'user.avatar_url',
        'user.email',
      ])
      .addSelect('f.status', 'friendStatus')
      .orderBy('user.created_at', 'DESC')
      .getRawMany();

    return users.map(u => {
      let direction = 'none';
      if (u.friendStatus === 'pending') {
        direction = (u.f_userId === excludeUserId) ? 'sent' : 'received';
      }
      return {
        id: u.user_id,
        username: u.user_username,
        displayName: u.user_display_name,
        avatarUrl: u.user_avatar_url,
        email: u.user_email,
        friendStatus: u.friendStatus || null,
        friendRequestDirection: direction 
      };
    });
  },

};

export const sessionsDb = {
  create: (userId: number, token: string, expiresAt?: Date) =>
    AppDataSource.getRepository(Session).save({
      userId,
      token,
      expires_at: expiresAt ?? null,
    }),
  deleteByToken: (token: string) => AppDataSource.getRepository(Session).delete({ token }),
  findByToken: (token: string) =>
    AppDataSource.getRepository(Session).findOne({ where: { token } }),
  deleteAllByUserId: (userId: number) =>
    AppDataSource.getRepository(Session).delete({ userId }),
};

export const friendsDb = {
  async getFriends(userId: number) {
    const rels = await AppDataSource.getRepository(Friendship).find({
      where: [
        { userId, status: "accepted" },
        { friendId: userId, status: "accepted" }
      ],
    });
    const repo = AppDataSource.getRepository(User);
    const users = await Promise.all(rels.map((r) => {
      const otherId = r.userId === userId ? r.friendId : r.userId;
      return repo.findOneBy({ id: otherId });
    }));
    return users.filter((u): u is User => u !== null).map(u => ({
      id: u.id,
      username: u.username,
      display_name: u.display_name || '',
      avatar_url: u.avatar_url || '',
      isOnline: u.is_online,
      lastSeen: u.lastSeen ? u.lastSeen.toISOString() : ''
    }));
  },
  sendRequest: (userId: number, friendId: number) =>
    AppDataSource.getRepository(Friendship).save({
      userId,
      friendId,
      status: "pending",
    }),
  getStatus: (userId: number, friendId: number) =>
    AppDataSource.getRepository(Friendship)
      .findOne({
        where: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
       ],
    })
    .then((r) => r?.status ?? null),
  pendingFor: (userId: number) =>
    AppDataSource.getRepository(Friendship).find({
      where: [
        { friendId: userId, status: "pending" }, 
        { userId: userId, status: "pending" }, 
      ],
    }),
  pendingBy: (userId: number) =>
    AppDataSource.getRepository(Friendship).find({
      where: { friendId: userId, status: "pending" },
    }),
  remove: (userId: number, friendId: number) =>
    AppDataSource.getRepository(Friendship).delete([
    { userId, friendId },
    { userId: friendId, friendId: userId }
  ]),
  accept: (userId: number, friendId: number) =>
    AppDataSource.getRepository(Friendship).update(
      { userId, friendId, status: "pending" },
      { status: "accepted" }
  ),
  block: async (userId: number, friendId: number) => {
    return AppDataSource.transaction(async (em) => {
      const res = await em
        .createQueryBuilder()
        .update(Friendship)
        .set({ status: 'blocked' })
        .where(
          '(userId = :userId AND friendId = :friendId) OR (userId = :friendId AND friendId = :userId)',
          { userId, friendId }
        )
        .execute();

      const affected = res.affected ?? 0;

      if (affected === 0) {
        await em
          .createQueryBuilder()
          .insert()
          .into(Friendship)
          .values([
            { userId, friendId, status: 'blocked' },
          ])
          .execute();
      }

      return { affected };
    });
  }
};

export const messagesDb = {
  async send(senderId: number, receiverId: number, content: string) {
    return AppDataSource.getRepository(Message).save({
      senderId,
      receiverId,
      content,
      read: false,
    });
  },

  async getConversation(userId: number, friendId: number) {
    return AppDataSource.getRepository(Message).find({
      where: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
      order: { createdAt: "ASC" },
    });
  },

  async markAsRead(userId: number, friendId: number) {
    return AppDataSource.getRepository(Message).update(
      { senderId: friendId, receiverId: userId, read: false },
      { read: true }
    );
  },

  async countUnread(userId: number) {
    return AppDataSource.getRepository(Message).count({
      where: { receiverId: userId, read: false },
    });
  },
};

export const notificationsDb = {
  async create(userId: number, type: string, message: string) {
    return AppDataSource.getRepository(Notification).save({
      userId,
      type,
      message,
      read: false,
    });
  },

  async getAll(userId: number) {
    return AppDataSource.getRepository(Notification).find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  },

  async countUnread(userId: number) {
    return AppDataSource.getRepository(Notification).count({
      where: { userId, read: false },
    });
  },

  async markAllAsRead(userId: number) {
    return AppDataSource.getRepository(Notification).update(
      { userId, read: false },
      { read: true }
    );
  },

  async markAsRead(id: number) {
    return AppDataSource.getRepository(Notification).update({ id }, { read: true });
  },
};

