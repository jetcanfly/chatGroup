// 已经登录的情况下，对于任何request，首先invoke deserialization
// 没有登录的情况下，首先验证
// 验证之后有个cb，是verified函数，在strategy.js内，strategy.success之后就req.login



var LocalStrategy = require('passport-local').Strategy;
// load user model
var User = require('../models/user.js');

module.exports = function (passport) {

	// 非常重要, some basic workflow.
	// http://toon.io/understanding-passportjs-authentication-flow/

	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});

	passport.use('local-register', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
		function (req, username, password, done) {

			process.nextTick(function () {

				User.findOne({ 'local.username': username }, function (err, user) {

					if (err) {
						return done(err);
					}

					if (user) {
						return done(null, false, req.flash('registerMessage', 'Sorry, that username already exists')); // check template for register error message!
					} else {

						var newUser = new User();

						newUser.local.username = username;
						newUser.local.password = newUser.generateHash(password);

						newUser.save(function (err) {
							if (err) {
								throw err;
							}
							return done(null, newUser);
						});
					}
				});
			});

		}));

	passport.use('local-login', new LocalStrategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true
	},
		function (req, username, password, done) {

			User.findOne({ 'local.username': username }, function (err, user) {
				if (err) {
					return done(err);
				}

				if (!user) {
					return done(null, false, req.flash('loginMessage', 'Sorry, that user is not registered!'));
				}

				if (!user.validPassword(password)) {
					return done(null, false, req.flash('loginMessage', 'Wrong password!'));
				}

				return done(null, user);
			});
		}));


}