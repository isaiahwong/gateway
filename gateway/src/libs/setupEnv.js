import path from 'path';
import fs from 'fs';

export function config(pathUrl = path.join(__dirname, '..', '..', '.env')) {
  if (!fs.existsSync(pathUrl)) {
    // eslint-disable-next-line no-param-reassign
    pathUrl = './.env';
  }
  // Initialise Environment Variable
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: pathUrl });
  global.__PROD__ = process.env.NODE_ENV === 'production';
  global.__DEV__ = process.env.NODE_ENV === 'development';
  global.__TEST__ = process.env.NODE_ENV === 'test';
}
