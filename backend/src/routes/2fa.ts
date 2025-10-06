import { FastifyInstance } from 'fastify';
import { AuthService } from '@/services/auth.service';
import { authenticateUser } from '@/middleware/jwt-auth.middleware';
import { sessionsDb } from '@/db';

export default async function twoFaRoutes(fastify: FastifyInstance) {
  fastify.get('/auth/2fa/setup', { onRequest: [authenticateUser] }, async (req: any, reply: any) => {
    try {
      console.log('2FA setup request from user:', req.user);
      const payload = await req.jwtVerify() as { userId: number };
      console.log('JWT payload for setup:', payload);
      const res = await AuthService.generateTwoFactorSetup(payload.userId);
      console.log('2FA setup generated successfully');
      return reply.send({ qr: res.qr, secret: res.secret });
    } catch (error) {
      console.error('2FA setup error:', error);
      return reply.code(500).send({ error: 'Failed to generate 2FA setup' });
    }
  });

  fastify.post('/auth/2fa/verify-setup', { onRequest: [authenticateUser] }, async (req: any, reply: any) => {
    const body = req.body as { token: string };
    const payload = await req.jwtVerify() as { userId: number };
    const result = await AuthService.verifyTwoFactorSetup(payload.userId, body.token);
    if (!result) return reply.code(400).send({ error: 'Invalid token' });
    return reply.send({ message: '2FA enabled', recoveryCodes: result.recoveryCodes });
  });

  fastify.post('/auth/2fa/login', async (req: any, reply: any) => {
    const body = req.body as { twoFactorToken: string, code: string };
    try {
      const payload = reply.jwtVerify ? await reply.jwtVerify(body.twoFactorToken) : (fastify as any).jwt.verify(body.twoFactorToken) as any;
      if (!payload || !payload.twoFactorPending || !payload.userId) {
        return reply.code(401).send({ error: 'Invalid temporary token' });
      }
      const ok = await AuthService.verifyTwoFactorLogin(payload.userId, body.code);
      if (!ok) return reply.code(401).send({ error: 'Invalid code' });

      const user = await AuthService.getUserById(payload.userId);
      const token = (fastify as any).jwt.sign({ userId: payload.userId });
      
      console.log('📄 Creating session for 2FA verified user...');
      await sessionsDb.create(
        payload.userId,
        token,
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 saat
      );
      console.log('✅ Session created for 2FA verified user');
      
      return reply.send({ token, user });
    } catch (err) {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });

  fastify.get('/auth/2fa/status', { onRequest: [authenticateUser] }, async (req: any, reply: any) => {
    try {
      console.log('2FA status request from user:', req.user);
      const payload = await req.jwtVerify() as { userId: number };
      console.log('JWT payload:', payload);
      const user = await AuthService.getUserById(payload.userId);
      console.log('User found:', user ? 'Yes' : 'No');
      console.log('User 2FA enabled:', user?.two_factor_enabled);
      return reply.send({ 
        enabled: user?.two_factor_enabled || false
      });
    } catch (error) {
      console.error('2FA status check error:', error);
      return reply.code(500).send({ error: 'Failed to check 2FA status' });
    }
  });

  fastify.post('/auth/2fa/disable', { onRequest: [authenticateUser] }, async (req: any, reply: any) => {
    try {
      console.log('2FA disable request from user:', req.user);
      const payload = await req.jwtVerify() as { userId: number };
      console.log('JWT payload for disable:', payload);
      const result = await AuthService.disableTwoFactor(payload.userId);
      console.log('2FA disable result:', result);
      if (!result) return reply.code(400).send({ error: 'Failed to disable 2FA' });
      return reply.send({ message: '2FA disabled successfully' });
    } catch (error) {
      console.error('2FA disable error:', error);
      return reply.code(500).send({ error: 'Failed to disable 2FA' });
    }
  });
}
