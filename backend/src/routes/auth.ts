import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sessionsDb } from '../db.js';
import crypto from 'crypto';

import { AuthService } from '../services/auth.service.js';
import { RegisterSchema, LoginSchema } from '../schemas/index.js';


interface RegisterBody {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

interface LoginBody {
  username: string;
  password: string;
}

function createAccessToken(fastify: FastifyInstance, user: { id: number; username: string }) 
{
  return fastify.jwt.sign({
    userId: user.id,
    username: user.username,
    type: 'access',
    iss: 'ft_transcendence',
    aud: 'ft_transcendence',
    jti: crypto.randomUUID(),
  });
}

export default async function authRoutes(fastify: FastifyInstance) 
{
  fastify.get('/debug', async () => {
    const stats = {
      message: 'Auth debug endpoint working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      auth_service_status: 'active',
      database_connection: 'healthy',
      jwt_service: 'enabled',
      available_endpoints: [
        'POST /register',
        'POST /login', 
        'POST /logout',
        'POST /refresh',
        'GET /me'
      ]
    };
    return stats;
  });

  fastify.post<{ Body: RegisterBody }>('/register', async (request, reply) => {
    try {
      const validatedData = RegisterSchema.parse(request.body);
      const user = await AuthService.createUser(validatedData);


      reply.code(201).send({ message: 'User registered successfully', user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.issues });
      }
      if (error instanceof Error && error.message.includes('already exists')) {
        return reply.code(409).send({ error: 'User already exists', message: error.message });
      }
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error', message: 'Failed to register user' });
    }
  });

  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    try {
      const validatedData = LoginSchema.parse(request.body);
      const user = await AuthService.authenticateUser(validatedData);
      if (!user) return reply.code(401).send({ error: 'Authentication failed', message: 'Invalid username or password' });

      if (user.two_factor_enabled) {
        const twoFactorToken = fastify.jwt.sign({
          userId: user.id,
          twoFactorPending: true,
          type: 'two_factor_pending'
        }, { expiresIn: '10m' });
        
        return reply.send({ 
          message: '2FA required', 
          requiresTwoFactor: true,
          twoFactorToken 
        });
      }

      await AuthService.updateUserOnlineStatus(user.id, true);
      const token = createAccessToken(fastify, user);
      await sessionsDb.create(user.id, token);

      reply.send({ message: 'Login successful', user: { ...user, is_online: true }, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation error', details: error.issues });
      }
      fastify.log.error(error);
      reply.code(500).send({ error: 'Internal server error', message: 'Failed to login' });
    }
  });

  fastify.post('/logout', async (request, reply) => {
    try {
      const payload = await request.jwtVerify<{ userId: number }>();
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await sessionsDb.deleteByToken(token);
      }
      await AuthService.updateUserOnlineStatus(payload.userId, false);
      reply.send({ message: 'Logout successful' });
    } catch {
      reply.code(401).send({ error: 'Authentication required', message: 'Please provide a valid token' });
    }
  });

  fastify.post('/refresh', async (request, reply) => {
    try {
      const payload = await request.jwtVerify<{ userId: number }>();
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Authentication required', message: 'Authorization header missing' });
      }
      const oldToken = authHeader.substring(7);
      const session = await sessionsDb.findByToken(oldToken);
      if (!session) return reply.code(401).send({ error: 'Invalid session', message: 'Token is not associated with a valid session' });

      const user = await AuthService.getUserById(payload.userId);
      if (!user) return reply.code(404).send({ error: 'User not found', message: 'User profile not found' });

      const newToken = createAccessToken(fastify, user);
      await sessionsDb.deleteByToken(oldToken);
      await sessionsDb.create(user.id, newToken);

      reply.send({ message: 'Token refreshed successfully', token: newToken, user });
    } catch {
      reply.code(401).send({ error: 'Authentication required', message: 'Please provide a valid token' });
    }
  });

  fastify.post('/logout-all', async (request, reply) => {
    try {
      const payload = await request.jwtVerify<{ userId: number }>();
      const result = await sessionsDb.deleteAllByUserId(payload.userId);
      await AuthService.updateUserOnlineStatus(payload.userId, false);
      reply.send({ message: 'Logged out from all devices successfully', sessionsRemoved: result.affected });
    } catch {
      reply.code(401).send({ error: 'Authentication required', message: 'Please provide a valid token' });
    }
  });

  fastify.get('/me', async (request, reply) => {
    try {
      const payload = await request.jwtVerify<{ userId: number }>();
      const user = await AuthService.getUserById(payload.userId);

      if (!user) {
        return reply.code(404).send({ error: 'User not found', message: 'User profile not found' });
      }
      reply.send({ user });
    } catch {
      reply.code(401).send({ error: 'Authentication required', message: 'Please provide a valid token' });
    }
  });
}
