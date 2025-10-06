import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sessionsDb } from '../db';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      userId: number;
      username: string;
    };
  }
}

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    console.log('🔐 Auth middleware - URL:', request.url);
    console.log('🔐 Auth middleware - Headers:', request.headers.authorization);
    
    await request.jwtVerify();

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Auth middleware - No authorization header');
      return reply.code(401).send({
        error: 'Authentication required',
        message: 'Authorization header missing or invalid'
      });
    }

    const token = authHeader.substring(7);
    console.log('🔍 Auth middleware - Token:', token.substring(0, 20) + '...');

    const session = await sessionsDb.findByToken(token);
    console.log('📊 Auth middleware - Session found:', !!session);
    
    if (!session) {
      console.log('❌ Auth middleware - No session found for token');
      return reply.code(401).send({
        error: 'Invalid session',
        message: 'Token is not associated with a valid session'
      });
    }

    console.log('✅ Auth middleware - Authentication successful');
  } catch (err) {
    console.log('❌ Auth middleware - JWT verification failed:', err);
    reply.code(401).send({
      error: 'Authentication required',
      message: 'Please provide a valid token'
    });
  }
}

export default async function authMiddleware(fastify: FastifyInstance) {
  fastify.decorate('authenticate', authenticateUser);
}
