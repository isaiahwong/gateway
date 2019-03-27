import path from 'path';

export const config = function (pathUrl = path.join(__dirname, '..', '..', '.env')) {
  // Initialise Environment Variable
  require('dotenv').config({ path: pathUrl });
  global['__PROD__'] = process.env.NODE_ENV === 'production';
  global['__DEV__'] = process.env.NODE_ENV === 'development';
  global['__TEST__'] = process.env.NODE_ENV === 'test';
};