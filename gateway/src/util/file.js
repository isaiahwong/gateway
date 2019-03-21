import fs from 'fs';

export function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, { encoding: 'utf-8' }, (err, file) => {
      if (err) {
        return reject(err);
      }
      return resolve(file);
    });
  });
}