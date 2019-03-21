/**
 * Authentication Middleware
 */
export const isAuthenticated = (req, res, next) => {
  // if (!req.isAuthenticated()) {
  //   return unAuthResponse(res);
  // }
  return next();
}; 

export const redirectIfAuthenticated = (req, res, next) => {
  // if (req.isAuthenticated()) {
  //   return okResponse(res, { auth: true });
  // }
  return next();
};