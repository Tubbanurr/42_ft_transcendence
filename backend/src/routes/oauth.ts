import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/auth.service.js";
import { sessionsDb } from "../db.js";

export async function oauthRoutes(fastify: FastifyInstance) {
  fastify.get("/google", async (_: any, reply: any) => {
    console.log('🔄 OAuth Google login started');
    console.log('🔑 Client ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('🔗 Redirect URI:', process.env.GOOGLE_REDIRECT_URI);
    
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI!)}&scope=openid%20email%20profile&prompt=select_account%20consent&access_type=offline&include_granted_scopes=true`;
    console.log('🌐 Redirecting to:', redirectUrl);
    reply.redirect(redirectUrl);
  });

  fastify.get("/google/callback", async (req: any, reply: any) => {
    try {
      console.log('🔄 OAuth callback started');
      console.log('📝 Query params:', req.query);
      
      const code = (req.query as any).code;
      const error = (req.query as any).error;
      
      if (error) {
        console.log('❌ OAuth error from Google:', error);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return reply.redirect(`${frontendUrl}/?error=${encodeURIComponent(error)}`);
      }
      
      if (!code) {
        console.log('❌ Missing authorization code');
        return reply.code(400).send({ error: "Missing code" });
      }

      console.log('🔑 Authorization code received, exchanging for token...');

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
          grant_type: "authorization_code",
        }),
      });
      
      if (!tokenRes.ok) {
        console.log('❌ Token exchange failed:', tokenRes.status, tokenRes.statusText);
        const errorData = await tokenRes.text();
        console.log('❌ Token error details:', errorData);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return reply.redirect(`${frontendUrl}/?error=token_exchange_failed`);
      }
      
      const tokenData = await tokenRes.json();
      console.log('✅ Token received successfully');

      console.log('👤 Fetching user profile from Google...');
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      
      if (!userRes.ok) {
        console.log('❌ Profile fetch failed:', userRes.status, userRes.statusText);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return reply.redirect(`${frontendUrl}/?error=profile_fetch_failed`);
      }
      
      const profile = await userRes.json();
      console.log('✅ Profile received:', { 
        id: profile.id, 
        email: profile.email, 
        name: profile.name,
        given_name: profile.given_name,
        family_name: profile.family_name,
        picture: profile.picture
      });

      console.log('💾 Finding or creating user in database...');
      const safeUser = await AuthService.findOrCreateOAuthUser(profile);
      console.log('✅ User processed:', { id: safeUser.id, email: safeUser.email, display_name: safeUser.display_name });

      console.log('🧹 Cleaning old sessions...');
      await sessionsDb.deleteAllByUserId(safeUser.id);
      console.log('✅ Old sessions cleaned');

      await AuthService.updateUserOnlineStatus(safeUser.id, true);
      console.log('🟢 User marked as online:', safeUser.username);

      if (safeUser.two_factor_enabled) {
        console.log('🔐 User has 2FA enabled, creating temporary token...');
        
        const tempToken = jwt.sign(
          { 
            userId: safeUser.id, 
            email: safeUser.email, 
            twoFactorPending: true 
          },
          process.env.JWT_SECRET!,
          { expiresIn: "10m" }
        );

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        console.log('🔄 Redirecting to frontend with 2FA requirement...');
        return reply.redirect(`${frontendUrl}/?requires2fa=true&tempToken=${tempToken}`);
      }

      console.log('🔐 Generating JWT token...');
      const jwtToken = jwt.sign(
        { userId: safeUser.id, email: safeUser.email, name: safeUser.display_name },
        process.env.JWT_SECRET!,
        { expiresIn: "24h" }
      );

      console.log('📄 Creating session for OAuth user...');
      await sessionsDb.create(
        safeUser.id,
        jwtToken,
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );
      console.log('✅ Session created for OAuth user');

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const userEncoded = encodeURIComponent(JSON.stringify(safeUser));
      console.log('🔄 Redirecting to frontend with token...');
      reply.redirect(`${frontendUrl}/?token=${jwtToken}&user=${userEncoded}`);
      
    } catch (error) {
      console.error('💥 OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      reply.redirect(`${frontendUrl}/?error=oauth_callback_failed`);
    }
  });
  
  fastify.post("/logout", async (req: any, reply: any) => {
    try {
      console.log('🔄 OAuth logout started');
      
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        console.log('🗑️ Token received for logout:', token ? 'present' : 'missing');
      }
      
      const googleLogoutUrl = 'https://accounts.google.com/logout';
      
      reply.send({ 
        message: 'Logout successful',
        googleLogoutUrl: googleLogoutUrl
      });
      
    } catch (error) {
      console.error('💥 Logout error:', error);
      reply.code(500).send({ error: 'Logout failed' });
    }
  });
}
