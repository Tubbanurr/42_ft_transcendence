import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { AppDataSource, initDatabase } from '../database.js';
import { User } from '../entities/User';

export default async function healthRoutes(fastify: FastifyInstance) {

  fastify.get('/', async () => ({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }));

  fastify.get('/database', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      await initDatabase();

      const tableNames = AppDataSource.entityMetadatas.map(meta => meta.tableName);
      const userCount = await AppDataSource.getRepository(User).count();

      return reply.code(200).send({
        status: 'OK',
        tables: tableNames,
        userCount
      });

    } catch (error) {
      return reply.code(500).send({
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  fastify.get('/system', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const memoryUsage = process.memoryUsage();

      return reply.code(200).send({
        status: 'OK',
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime(),
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
          },
          cpuUsage: process.cpuUsage(),
          environment: process.env.NODE_ENV || 'development'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      return reply.code(500).send({
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
