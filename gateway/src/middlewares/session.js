import connectRedis from 'connect-redis';
import expressSession from 'express-session';

const IS_PROD = process.env.NODE_ENV === 'production';
const DURATION = 1 * 60 * 60; // In seconds

const RedisStore = connectRedis(expressSession);

// Session Intializer
const sessionConfig = {
  name: process.env.COOKIE_NAME || '_trapM0n3yB3nny',
  secret: process.env.SESSION_SECRET || '********SSSSSSEEEEECCCRRREEET',
  saveUninitialized: false,
  resave: false,
  store: new RedisStore({
    host: process.env.SESSION_STORE_HOST,
    port: process.env.SESSION_STORE_PORT,
    ttl: DURATION
  }),
  cookie: {
    secure: false,
    httpOnly: false
  }
};

export default function session() {
  if (IS_PROD) {
    sessionConfig.proxy = true;
    sessionConfig.cookie.secure = true; // serve secure cookies
    sessionConfig.cookie.httpOnly = true;
  }
  return expressSession(sessionConfig);
}
