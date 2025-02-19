import { ERROR_RESPONSE, makeResponse } from '../utils/response';
import passport from 'passport';
/**
 * @function joiValidator validates request against a provided joi schema
 */
const joiValidator = (schema) => (req, res, next) => {
  const validation = schema.validate(req.body);
  if (validation.error)
    return makeResponse({ res, success: false, message: validation.error });
  next();
};

/**
 * @function validateAdminRequest validates whether the request is coming from an Admin
 */
const validateAdminRequest = (req) => {
  if (req.user.role != 'Admin') {
    throw { message: ERROR_RESPONSE.UNAUTHORIZED };
  }
};

/**
 * @function validateRequest validates whether the request is coming from an Admin or from a member of the club to which the event which is requested to be modified belongs to (For RSVP functionalities)
 */
const validateRequest = (event, user, errorMessage) => {
  if (!event.faculty.includes(user.faculty) && user.role != 'Admin') {
    throw {
      message: errorMessage,
    };
  }
};

/**
 * @function validateFCSCRequest validates whether the request is coming from an Admin or FCSC member (For FCSC web functionalities)
 */
const validateFCSCRequest = (req) => {
  if (req.user.role != 'Admin' && req.user.faculty != 'FCSC') {
    throw { message: ERROR_RESPONSE.UNAUTHORIZED };
  }
};

/**
 * @function isLogin validates login
 */
const isLogin = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    req.user = user;
    next()
  })(req, res, next)

};

export {
  joiValidator,
  validateAdminRequest,
  validateRequest,
  validateFCSCRequest,
  isLogin
};
