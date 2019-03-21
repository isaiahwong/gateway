/* eslint-disable import/no-dynamic-require */
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

// Port to retrieving from database
export const localePath = path.join(__dirname, '../../locales/');

const i18n = {
  strings: null,
  translations: {},
  t, // eslint-disable-line no-use-before-define
};

// Store translations
export const _translations = {};

function _loadTranslations(locale) {
  const files = fs.readdirSync(path.join(localePath, locale));

  _translations[locale] = {};

  files.forEach((file) => {
    if (path.extname(file) !== '.json') return;

    // We use require to load and parse a JSON file
    _.merge(_translations[locale], require(path.join(localePath, locale, file)));
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

export function setupLanguage() {
  // Fetch English strings so we can merge them with missing strings in other languages
  _loadTranslations('en');

  // load all other languages
  fs.readdirSync(localePath).forEach((file) => {
    if (file === 'en' || fs.statSync(path.join(localePath, file)).isDirectory() === false) return;
    _loadTranslations(file);

    // Merge missing strings from english
    _.defaults(_translations[file], _translations.en);
  });

  // Add translations to shared
  i18n.translations = _translations;
}

export const langCodes = Object.keys(_translations);

export default i18n;
