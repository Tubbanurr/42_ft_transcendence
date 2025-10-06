import "reflect-metadata";
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { oauthRoutes } from "./routes/oauth";
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import apiRoutes from './routes/api.js';
import uploadRoutes from './routes/upload.js';
import friendsRoutes from './routes/friends.js';
import usersRoutes from './routes/users.js';
import authMiddleware from "./middleware/jwt-auth.middleware.js";
import { initDatabase } from './database.js';
import tournamentRoutes  from "./routes/tournament.js";
import { registerSockets } from "./sockets";
import chatRoutes from './routes/chat.js';
import notificationsRoutes from './routes/notifications.js';
import { registerGameRoutes } from "./routes/game.js";
import twoFaRoutes from './routes/2fa.js';

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: true,
  credentials: true
});

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required!');
  process.exit(1);
}
fastify.register(jwt, {
  secret: JWT_SECRET,
  sign: { expiresIn: '24h' }
});

fastify.register(authMiddleware);
fastify.register(twoFaRoutes, { prefix: '/api' });
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/'
});

fastify.register(healthRoutes, { prefix: '/api/health' });
fastify.register(apiRoutes, { prefix: '/api' });
fastify.register(uploadRoutes, { prefix: '/api/upload' });
fastify.register(friendsRoutes, { prefix: '/api/friends' });
fastify.register(usersRoutes, { prefix: '/api/users' });
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(oauthRoutes, { prefix: '/api/oauth' });
fastify.register(tournamentRoutes, { prefix: "/api/tournaments" });
fastify.register(chatRoutes, { prefix: '/api/chat' });
fastify.register(notificationsRoutes, { prefix: '/api/notifications' });
fastify.register(registerGameRoutes, { prefix: '/api/games' });


const start = async () => {
  try {
    console.log('🗄️ Initializing database...');
    await initDatabase();
    console.log('✅ Database initialized successfully');

    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';

    registerSockets(fastify);

    await fastify.listen({ port, host });

    console.log(`🚀 Backend server running on http://${host}:${port}`);
    console.log(`📊 Health check available at http://${host}:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  }
};

start();
