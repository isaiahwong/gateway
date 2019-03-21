import path from 'path';

export const config = function (pathUrl = path.join(__dirname, '..', '..', '.env')) {
  // Initialise Environment Variable
  require('dotenv').config({ path: pathUrl });
  process.env['IS_PROD'] = process.env.NODE_ENV === 'production';
  process.env['IS_DEV'] = process.env.NODE_ENV === 'development';
  process.env['IS_TEST'] = process.env.NODE_ENV === 'test';
};