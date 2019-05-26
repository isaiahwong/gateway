/* eslint-disable max-len */
import i18n from '../libs/i18n';

const { translations } = i18n;

// Attach translation function to req object
export default function language(req, res, next) {
  res.t = function reqTranslation() {
    // eslint-disable-next-line prefer-rest-params
    return i18n.t(...arguments, req.language);
  };

  next();
}

export function getUserLanguage(req, res, next) {
  if (req.query.lang) { // In case the language is specified in the request url, use it
    req.language = translations[req.query.lang] ? req.query.lang : 'en';
  }
  else {
    req.language = 'en';
  }
  return next();


  // TODO Get From user

  // else if (req.locals && req.locals.user) { // If the request is authenticated, use the user's preferred language
  //   req.language = _getFromUser(req.locals.user, req);
  //   return next();
  // }
  // else if (req.session && req.session.userId) { // Same thing if the user has a valid session
  //   return User.findOne({
  //     _id: req.session.userId,
  //   }, 'preferences.language')
  //     .lean()
  //     .exec()
  //     .then((user) => {
  //       req.language = _getFromUser(user, req);
  //       return next();
  //     })
  //     .catch(next);
  // } else { // Otherwise get from browser
  //   req.language = _getFromUser(null, req);
  //   return next();
  // }
}
