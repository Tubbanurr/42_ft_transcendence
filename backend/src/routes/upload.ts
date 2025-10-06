import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { AuthService } from '@/services/auth.service.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pump = promisify(pipeline);

const AvatarUrlSchema = z.object({
  avatarUrl: z.string()
    .max(500, 'Avatar URL too long')
    .optional()
    .nullable()
    .refine((url) => {
      if (!url) return true;
      return url.startsWith('http') || url.startsWith('/uploads/');
    }, 'Please enter a valid URL or path')
});

type AvatarUrlBody = z.infer<typeof AvatarUrlSchema>;

export default async function uploadRoutes(fastify: FastifyInstance) {
  
  await fastify.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });

  fastify.put<{ Body: AvatarUrlBody }>('/avatar-url', async (request: FastifyRequest<{ Body: AvatarUrlBody }>, reply: FastifyReply) => {
    try {
      const payload = await (request as any).jwtVerify() as { userId: number };
      
      const validatedData = AvatarUrlSchema.parse(request.body);
      
      await AuthService.updateUser(payload.userId, { 
        avatar_url: validatedData.avatarUrl 
      });

      const updatedUser = await AuthService.getUserById(payload.userId);

      reply.send({
        message: 'Avatar URL updated successfully',
        avatarUrl: validatedData.avatarUrl,
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

      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to update avatar URL'
      });
    }
  });

  fastify.post('/avatar', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await (request as any).jwtVerify() as { userId: number };
      
      const data = await (request as any).file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'No file uploaded',
          message: 'Please select a file to upload'
        });
      }

      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          error: 'Invalid file type',
          message: 'Only JPG, PNG, and GIF files are allowed'
        });
      }

      const fileExtension = path.extname(data.filename || '').toLowerCase() || 
                           (data.mimetype === 'image/jpeg' ? '.jpg' : 
                            data.mimetype === 'image/png' ? '.png' : '.gif');

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `avatar-${payload.userId}-${timestamp}-${randomString}${fileExtension}`;
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
      const filePath = path.join(uploadDir, fileName);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      await pump(data.file, fs.createWriteStream(filePath));

      const avatarUrl = `/uploads/avatars/${fileName}`;

      await AuthService.updateUser(payload.userId, { 
        avatar_url: avatarUrl 
      });

      const updatedUser = await AuthService.getUserById(payload.userId);

      reply.send({
        message: 'Avatar uploaded successfully',
        avatarUrl: avatarUrl,
        fileName: fileName,
        fileSize: data.file.readableLength || 0,
        user: updatedUser
      });

    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(404).send({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      fastify.log.error(error);
      reply.code(500).send({
        error: 'Internal server error',
        message: 'Failed to upload avatar'
      });
    }
  });
}
