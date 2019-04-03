// these are all the functions that handle routes (i.e. POST, GET, DELETE)
// all of these routes will be controlled by passport for ensuring proper access for users
// super helpful! https://scotch.io/tutorials/easy-node-authentication-setup-and-local

// load user model
var User = require('../models/user.js');

module.exports = function(app, passport){

	// this will serve the login page to the user first!
	// if login is successful, then the server can serve the chat page
	app.get('/', function(req, res){
		res.render('login.ejs', { message: "" });
	});
	
	// show the login page 
	app.get('/login', function(req, res){
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});
	
	// when server receives a POST request to /login, need to check form input 
	// and authenticate 
	app.post('/login', passport.authenticate('local-login', {
		failureRedirect: '/login',
		failureFlash: true
	}), function(req, res){
		// go to Chat via 'get /Chat'
		res.redirect('/Chat/');
	});
	
	// show the register page 
	app.get('/register', function(req, res){
		res.render('register.ejs', { message: req.flash('registerMessage') });	
	});
	
	// take care of registering user after form input has been submitted 
	app.post('/register', passport.authenticate('local-register', {
		successRedirect: '/Chat', //'/index', // go to chat page 
		failureRedirect: '/register',
		failureFlash: true
	}));
	
	// direct to chatroom, with Chat in the url
	app.get('/Chat', isLoggedIn, function(req, res){
		res.render('index.ejs', {
			user: req.user 	// get user name from session and pass to template
		});
	});
	
	// 关于req自动携带的method
	// https://stackoverflow.com/questions/13758207/why-is-passportjs-in-node-not-removing-session-on-logout
	app.get('/logout', function(req, res){
		// remove username from current users list 
		req.logout(); 			// this is a passport function
		res.redirect('/');  	// go back to home page 
	});
	
	// 保证一定是loggin的
	// https://stackoverflow.com/questions/18739725/how-to-know-if-user-is-logged-in-with-passport-js
	function isLoggedIn(req, res, next){
		
		// if user is authenticated, then ok
		if(req.isAuthenticated()){
			return next();
		}

		// if not authenticated, take them back to the home page 
		res.redirect('/');
	}
	
}
