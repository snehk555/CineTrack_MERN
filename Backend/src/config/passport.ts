import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import { addWelcomeEmailJob } from '../queues/emailQueue.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // 1. Check if user already exists by googleId
        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }

        // 2. Check if user exists by email
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error('No email found from Google'), false);
        }

        user = await User.findOne({ email });
        if (user) {
          // Link google ID to existing account
          user.googleId = profile.id;
          if (!user.avatarUrl && profile.photos?.[0]?.value) {
            user.avatarUrl = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // 3. Create new user
        const baseUsername = profile.displayName.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
        let username = baseUsername;
        let counter = 1;
        while (await User.exists({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        user = await User.create({
          name: profile.displayName,
          email,
          username,
          googleId: profile.id,
          avatarUrl: profile.photos?.[0]?.value,
          role: 'user',
        });

        // Trigger welcome email via BullMQ
        addWelcomeEmailJob({ name: user.name, email: user.email, userId: user._id.toString() }).catch(() => null);

        logger.info(`New user registered via Google: ${email}`);
        return done(null, user);
      } catch (error) {
        logger.error('Google OAuth Error:', error);
        return done(error as Error, false);
      }
    }
  )
);

export default passport;
