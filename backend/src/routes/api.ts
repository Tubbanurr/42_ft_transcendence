
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '@/services/auth.service.js';
import { z } from 'zod';

const UpdateUserApiSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().max(500).optional(),
  password: z.string().min(1).optional()
});

type UpdateUserApiBody = z.infer<typeof UpdateUserApiSchema>;

export default async function apiRoutes(fastify: FastifyInstance) 
{
  fastify.get('/test', async () => {
    return { 
      message: 'ft_transcendence backend is running!',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/demo', async () => {
    return { 
      message: 'Hot reload is working perfectly!',
      timestamp: new Date().toISOString(),
      author: 'DevOps Team + Alihan',
      version: '2.0.0',
      features: [
        'Hot reload support',
        'Clean code architecture',
        'Modular route structure',
        'TypeScript support'
      ]
    };
  });

  fastify.get('/version', async () => {
    return {
      application: {
        name: 'ft_transcendence',
        version: '1.0.0',
        description: 'Real-time multiplayer Pong game with modern web technologies'
      },
      runtime: {
        node: process.version,
        platform: process.platform,
        architecture: process.arch
      },
      environment: process.env.NODE_ENV || 'development',
      buildDate: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  });

  fastify.get('/status', async () => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'operational',
      api: {
        version: '1.0.0',
        uptime: {
          seconds: Math.floor(uptime),
          human: formatUptime(uptime)
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      },
      services: {
        database: 'connected',
        authentication: 'active',
        websocket: 'ready'
      },
      timestamp: new Date().toISOString()
    };
  });

  fastify.put<{ Body: UpdateUserApiBody }>('/user', async (request: FastifyRequest<{ Body: UpdateUserApiBody }>, reply: FastifyReply) => {
    try {
      const payload = await request.jwtVerify<{ userId: number }>();
      
      const validatedData = UpdateUserApiSchema.parse(request.body);
      
      if (Object.keys(validatedData).length === 0) {
        return reply.code(400).send({
          error: 'Validation error',
          message: 'At least one field must be provided for update'
        });
      }
      await AuthService.updateUser(payload.userId, {
        display_name: validatedData.displayName,
        email: validatedData.email,
        avatar_url: validatedData.avatarUrl,
        password: validatedData.password
      });

      const updatedUser = await AuthService.getUserById(payload.userId);

      reply.send({
        message: 'User information updated successfully',
        user: updatedUser
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.issues
        });
      }

      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(404).send({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      if (error instanceof Error && error.message.includes('Email already exists')) {
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Email already exists'
        });
      }

      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to update user information'
      });
    }
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
