game = require('./game.js')

currentGame = undefined
currentPlayer = undefined

rollDice = function(){
}

newGame = function(){
	currentGame = game.initialBoard();
	currentPlayer = 'red';
	currentDice = [6,6,6,6];
}

module.exports.newGame = newGame;

var ioModule = require('socket.io')
 , lessMiddleware = require('less-middleware')
 , express = require('express')
 , exphbs  = require('express3-handlebars')
 , http = require('http')
 , path = require('path')

loadApp = function(){
	var app = express();
	// all environments
	app.configure(function () {
		app.use(lessMiddleware({
			src: __dirname + '/../public',
			compress: true
		}));

		app.use(express.static(__dirname + '/../public'));
	});

	app.engine('html', exphbs({defaultLayout: 'main', extname: '.html'}));
	app.set('view engine', 'html');

	app.get('/', function (req, res) {
			res.render('index');
	});

	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, '../public')));
	// development only
	if ('development' == app.get('env')) {
		app.use(express.errorHandler());
	}
	return app
}

launchApp = function(app, port){
	port = process.env.PORT || port || 5000;
	return app.listen(port)
}

loadIO = function(server){
	var io = require('socket.io').listen(server);

	io.sockets.on('connection', function (socket) {
		socket.on("status", function() {
			return socket.emit("status", currentGame.state())
		});
		socket.on("player", function() {
			return socket.emit("player", currentPlayer)
		});
		socket.on("move", function(pos, roll) {
			currentGame.progressPiece(pos, roll)
			currentPlayer = currentPlayer.opponent();
			socket.emit("status", currentGame.state())
			return socket.emit("dice", currentDice)
		});
		socket.on("dice", function(){
			return socket.emit("dice", currentDice);
		});
	});
	return io;
}

start = function(port, cb){
	server = launchApp(loadApp(), port);
	io = loadIO(server);
	newGame();
}

stop = function(cb){
	io.server.close();
	cb()
}
module.exports.start = start;
module.exports.stop = stop;
