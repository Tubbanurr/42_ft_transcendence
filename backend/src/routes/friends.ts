import { FastifyInstance } from 'fastify';
import { friendsDb } from '../db';
import { z } from 'zod';
import { AppDataSource } from '../database';
import { User } from '../entities/User';
import { getIO } from "../sockets";

const IdParams = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

export default async function friendsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', async (req, reply) => {
    try {
      const payload = await (req as any).jwtVerify() as { userId: number; username?: string };
      (req as any).user = payload;
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.post('/add/:id', async (request, reply) => {
    const { id: friendId } = IdParams.parse(request.params);
    const meId: number = (request as any).user.userId;

    if (meId === friendId) {
      return reply.code(400).send({ error: 'You cannot send a request to yourself' });
    }

    let fromUsername = (request as any).user.username as string | undefined;
    if (!fromUsername) {
      const me = await AppDataSource.getRepository(User).findOneBy({ id: meId });
      fromUsername = me?.username || 'user';
    }

    const existing = await friendsDb.getStatus(meId, friendId);
    const io = getIO();

    if (existing === 'pending') {
      const incoming = await friendsDb.pendingBy(meId);
      const thereIsIncomingFromFriend = incoming.some((r: any) => r.userId === friendId && r.friendId === meId);
      if (thereIsIncomingFromFriend) {
        await friendsDb.accept(friendId, meId);

        io.to(String(friendId)).emit('friend:request:accepted', {
          fromUserId: meId,
          fromUsername,
        });

        return reply.code(200).send({ message: 'Friend request accepted', friendId });
      }
    }

    if (existing === 'accepted') {
      return reply.code(409).send({ error: 'Already friends' });
    }

    await friendsDb.sendRequest(meId, friendId);

    io.to(String(friendId)).emit('friend:request:received', {
      fromUserId: meId,
      fromUsername,
    });

    return reply.code(201).send({ message: 'Friend request sent', friendId });
  });
  
  fastify.get('/friends', async (request) => {
    const meId = (request as any).user.userId;
    console.log(`👤 Kullanıcı ${meId} için arkadaş listesi isteniyor...`);
    const rels = await friendsDb.getFriends(meId);
    console.log(`📋 Bulunan arkadaşlar:`, rels);
    const friends = rels.map(friend => ({
      id: friend.id,
      username: friend.username,
      display_name: friend.display_name || '',
      avatar_url: friend.avatar_url || '',
      isOnline: friend.isOnline,
      lastSeen: friend.lastSeen,
    }));
    console.log(`📤 Döndürülen arkadaş listesi:`, { friends, count: friends.length });
    return { friends, count: friends.length };
  });

  fastify.get('/requests', async (request) => {
    const meId = (request as any).user.userId;
    const requests = await friendsDb.pendingBy(meId);
    const repo = AppDataSource.getRepository(User);
    const enriched = await Promise.all(requests.map(async (req: any) => {
      const sender = await repo.findOneBy({ id: req.userId });
      return {
        id: req.id,
        userId: req.userId,
        friendId: req.friendId,
        status: req.status,
        created_at: req.created_at,
        username: sender?.username || 'user',
        display_name: sender?.display_name || '',
        avatar_url: sender?.avatar_url || '',
      };
    }));
    return { requests: enriched, count: enriched.length };
  });

  fastify.post('/accept/:id', async (request, reply) => {
    const { id: friendId } = IdParams.parse(request.params);
    const meId = (request as any).user.userId;

    await friendsDb.accept(friendId, meId);

    let fromUsername = (request as any).user.username as string | undefined;
    if (!fromUsername) {
      const me = await AppDataSource.getRepository(User).findOneBy({ id: meId });
      fromUsername = me?.username || 'user';
    }

    const io = getIO();
    io.to(String(friendId)).emit('friend:request:accepted', {
      fromUserId: meId,
      fromUsername,
    });

    return reply.send({ message: 'Accepted', friendId });
  });

  fastify.delete('/remove/:id', async (request, reply) => {
    const { id: friendId } = IdParams.parse(request.params);
    const meId = (request as any).user.userId;

    const result = await friendsDb.remove(meId, friendId);
    if (!result.affected) {
      return reply.code(404).send({ error: "Arkadaşlık kaydı bulunamadı." });
    }

    let fromUsername = (request as any).user.username as string | undefined;
    if (!fromUsername) {
      const me = await AppDataSource.getRepository(User).findOneBy({ id: meId });
      fromUsername = me?.username || 'user';
    }

    const io = getIO();
    io.to(String(friendId)).emit('friend:removed', {
      fromUserId: meId,
      fromUsername,
    });

    return reply.code(204).send();
  });

  fastify.post('/block/:id', async (request) => {
    const { id: friendId } = IdParams.parse(request.params);
    const meId = (request as any).user.userId;
    await friendsDb.block(friendId, meId);

    const io = getIO();

    io.to(String(meId)).emit("friend:blocked", {
      fromUserId: meId,
      targetUserId: friendId,
      type: "self",
    });

    io.to(String(friendId)).emit("friend:blocked", {
      fromUserId: meId,
      targetUserId: friendId,
      type: "other",
    });

    return { message: 'Blocked', friendId };
  });

}
