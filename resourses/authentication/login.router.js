const router = require('express').Router();
const User = require('../users/user.model');
const loginService = require('./login.service');
const {FORBIDDEN, BAD_REQUEST, UNAUTHORIZED, getStatusText} = require('http-status-codes');
const {JWT_SECRET_KEY, JWT_REFRESH_TOKEN_SECRET_KEY, TOKEN_EXPIRES, TOKEN_REFRESH_EXPIRES} = require('../../common/config');
const jwt = require('jsonwebtoken');
const {ErrorHandler} = require('../../helpers/errorHandler');
const {validationResult} = require('express-validator');
const {loginBodyValidation, registerBodyValidation} = require('../../validators/validator');
const catchErrors = require('../../helpers/catchErrors');

router.route('/login').post(
  loginBodyValidation(),
  catchErrors(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ErrorHandler(BAD_REQUEST, getStatusText(BAD_REQUEST));
    }
    const user = await loginService.getUserByGithubId(req.body);
    if (!user) {
      throw new ErrorHandler(FORBIDDEN, getStatusText(FORBIDDEN));
    } else {
      const token = jwt.sign({githubId: user.githubId}, JWT_SECRET_KEY, {expiresIn: TOKEN_EXPIRES});
      const refreshToken = jwt.sign({githubId: user.githubId}, JWT_REFRESH_TOKEN_SECRET_KEY,{expiresIn: TOKEN_REFRESH_EXPIRES})
      return await res.json({token, refreshToken, githubId: user.githubId, roles: user.roles});
    }
  })
);

router.route('/register').post(registerBodyValidation(), catchErrors(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ErrorHandler(BAD_REQUEST, getStatusText(BAD_REQUEST));
    }
    const candidate = await loginService.checkUser(req.body);
    if (candidate) {
      return res.status(BAD_REQUEST).json({message: 'This githubId already exists'})
    } else {
      const newUser = new User(req.body);
      await loginService.addUser(newUser);
      await res.json(User.toResponse(newUser));
    }
  })
)

router.route('/refresh-token/:refreshToken/:githubId').get(
  catchErrors(async (req, res) => {
    let token = req.params.refreshToken;
    if (token) {
      token = token.replace('Bearer ', '');
      jwt.verify(token, JWT_REFRESH_TOKEN_SECRET_KEY);
      const accessToken = jwt.sign({githubId: req.params.githubId}, JWT_SECRET_KEY, {expiresIn: TOKEN_EXPIRES});
      const refreshToken = jwt.sign({githubId: req.params.githubId}, JWT_REFRESH_TOKEN_SECRET_KEY,{expiresIn: TOKEN_REFRESH_EXPIRES})
      return await res.json({token: accessToken, refreshToken});
    }
    res
      .status(UNAUTHORIZED)
      .json({success: false, message: getStatusText(UNAUTHORIZED)});
  })
)

module.exports = router;