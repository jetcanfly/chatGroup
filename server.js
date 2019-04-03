var express = require('express');
var app = express();

// the order is very important. 注意顺序
var port = process.env.PORT || 3006;
var http = require('http').Server(app);
var io = require('socket.io')(http);
http.listen(port);

var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');  // msg flash is not supported since express 3.x

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
// var assert = require('assert');  已经过时
var mongoStore = require("connect-mongo");
var path = require('path')

// 静态内容总是放在最前面
app.use(express.static(path.join(__dirname, 'views')));

// put variable part together including database url.
var configDB = require('./config/database.js');
mongoose.connect(configDB.url);

// initialize passport strategy. For further extension. 初始化工作
// separate passport configuration into a rather dependent module.
require('./config/passport.js')(passport);


// 设置一下基本模块
app.use(cookieParser()); 		// 自动解析cookie
app.use(bodyParser()); 			// 解析request body
app.set('view engine', 'ejs');	// 使用模板

// session 存储在mongoDB
var sessionMiddleware = session({
	secret: 'LiranHasASecret',   // for cookie
	store: new (mongoStore(session))({
		url: configDB.url
	})
});

app.use(sessionMiddleware);						
app.use(passport.initialize());	   	
app.use(passport.session());	    
app.use(flash()); 		            // connect-flash 使用存储在session中的flash.

// pass app and passport to the routes 
require('./routes/routes.js')(app, passport);


// 连接 sessionMiddleware with socket.io 取得 user session info。
// https://stackoverflow.com/questions/25532692/how-to-share-sessions-with-socket-io-1-x-and-express-4-x
// surprisingly simple 
io.use(function (socket, next) {
	sessionMiddleware(socket.request, {}, next);
});

// array to store all currently logged in users 
var users = [];
io.on('connection', function (socket) {


	socket.on('userConnected', function (username) {
		if (users.indexOf(username) < 0) {
			users.push(username);
		}
		io.emit('getCurrentUsers', users);
	});

	socket.on('userHasDisconnected', function (username) {
		var indexOfUsername = users.indexOf(username);
		users.splice(1, indexOfUsername);
		io.emit('getCurrentUsers', users);
	});

	socket.on('chat message', function (msg) {
		var timestamp = new Date().toLocaleString();
		// 这里其实是向所有人广播
		// better way：向其他人广播。sender立刻更新自己的消息。
		io.emit('chat message', msg.user + ": " + msg.msg + timestamp);
	});

	socket.on('image', function (img) {
		io.emit('image', img);
	});
});

http.listen(port, function () {
	console.log('listening on *:' + port);
});

