/* eslint-disable prefer-rest-params */
/* eslint-disable import/no-dynamic-require */
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

// Port to retrieving from database
export const localePath =
  __PROD__
    ? path.join(__dirname, 'locales/')
    : path.join(__dirname, '../../locales/');

const i18n = {
  strings: null,
  translations: {},
  t, // eslint-disable-line no-use-before-define
};

// Store translations
export const _translations = {};

function _loadTranslations(locale, _localePath = localePath) {
  const files = fs.readdirSync(path.join(_localePath, locale));
  _translations[locale] = {};

  files.forEach((file) => {
    if (path.extname(file) !== '.json') return;
    let parsed = {};

    try {
      const localeJSON = fs.readFileSync(path.join(_localePath, locale, file));
      parsed = JSON.parse(localeJSON);
    }
    catch (err) {
      console.warn(err);
    }
    finally {
      // We use require to load and parse a JSON file
      _.merge(_translations[locale], parsed);
    }
  });
}

function t(stringName) {
  let vars = arguments[1];
  let locale;

  if (_.isString(arguments[1])) {
    vars = null;
    locale = arguments[1];
  }
  else if (arguments[2]) {
    locale = arguments[2];
  }

  const i18nNotSetup = !i18n.strings && !i18n.translations[locale];

  if (!locale || i18nNotSetup) {
    locale = 'en';
  }

  let string;

  if (i18n.strings) {
    string = i18n.strings[stringName];
  }
  else {
    string = i18n.translations[locale] && i18n.translations[locale][stringName];
  }

  const clonedVars = _.clone(vars) || {};

  clonedVars.locale = locale;

  if (string) {
    try {
      return _.template(string)(clonedVars);
    }
    catch (_error) {
      return `Error processing the string "${stringName}". Please see Help > Report a Bug.`;
    }
  }
  else {
    let stringNotFound;

    if (i18n.strings) {
      stringNotFound = i18n.strings.stringNotFound;
    }
    else if (i18n.translations[locale]) {
      stringNotFound = i18n.translations[locale] && i18n.translations[locale].stringNotFound;
    }

    try {
      return _.template(stringNotFound)({
        string: stringName,
      });
    }
    catch (_error) {
      return 'Error processing the string "stringNotFound". Please see Help > Report a Bug.';
    }
  }
}

export function setupLanguage(_localePath = localePath) {
  // Fetch English strings so we can merge them with missing strings in other languages
  _loadTranslations('en', _localePath);

  // load all other languages
  fs.readdirSync(_localePath).forEach((file) => {
    if (file === 'en' || fs.statSync(path.join(_localePath, file)).isDirectory() === false) return;
    _loadTranslations(file);

    // Merge missing strings from english
    _.defaults(_translations[file], _translations.en);
  });

  // Add translations to shared
  i18n.translations = _translations;
}

export const langCodes = Object.keys(_translations);

export default i18n;
