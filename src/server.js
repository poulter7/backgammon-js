var game = require('./game.js')
var Chance = require('chance');
var _ = require('underscore');

currentGame = undefined
currentPlayer = undefined
currentDice = undefined

rollDice = function(){
	var x = chance.d6();
	var y = chance.d6();
	if (x === y){
		return [
			{'val':x, 'rolled':false},
			{'val':y, 'rolled':false},
			{'val':x, 'rolled':false},
			{'val':y, 'rolled':false},
		]
	}  else {
		return [
			{'val':x, 'rolled':false},
			{'val':y, 'rolled':false},
		]
	}
}

newGame = function(seed){
	if (seed){
		chance = new Chance(seed);
	} else {
		chance = new Chance();
	}
	currentGame = game.initialBoard();
	currentPlayer = 'red';
	currentDice = rollDice(); 
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

switchControl = function(){
	currentPlayer = currentPlayer.opponent();
	currentDice = rollDice();
	announcePlayer();
}
announceDice = function(){
	return io.sockets.emit("dice", {dice:currentDice, playable:canMove()});
}
announcePlayer = function(){
	return io.sockets.emit("player", currentPlayer)
}
announcePlayable = function(){
	return io.sockets.emit("playable", canMove())
}
announceState = function(){
	return io.sockets.emit("status", currentGame.state())
}
performPass = function(){
	switchControl();
	announcePlayer();
	announceState();
	announceDice();

}
performMove = function(pos, rollIndex){
	var selectedDice = currentDice[rollIndex];
	var currentPlayerPieceSelected = currentGame.owner(pos).color == currentPlayer;
	if (!selectedDice.rolled && currentPlayerPieceSelected){
		var roll = selectedDice.val;
		var success = currentGame[currentPlayer].progressPiece(pos, roll);
		if (success){
			currentDice[rollIndex].rolled = true;
		}
		var incomplete = _.contains(
			_.pluck(currentDice, 'rolled'),
			false
		);
		if (!incomplete){
			switchControl();
		}
	}
	announceState();
	return announceDice();
}

loadIO = function(server){
	var io = require('socket.io').listen(server);
	io.sockets.on('connection', function (socket) {
		socket.on("pass", performPass);
		socket.on("status", announceState);
		socket.on("player", announcePlayer);
		socket.on("playable", announcePlayable);
		socket.on("move", performMove);
		socket.on("dice", announceDice);
	});
	return io;
}

canMove = function(){
	var dice = _.pluck(_.where(currentDice, {rolled:false}), 'val');
	var moveable = _.map(
		dice, 
		function(d){
			return currentGame[currentPlayer].canMoveWith(d);
		}
	);
	return _.contains(moveable, true);
}
start = function(port, cb, seed){
	server = launchApp(loadApp(), port);
	io = loadIO(server);
	newGame(seed);
}

dropAllClients = function(){
	io.sockets.clients().forEach(function(socket){socket.disconnect(true)});
}

stop = function(cb){
	dropAllClients();
	server.close();
	cb()
}
module.exports.start = start;
module.exports.resetServer = function(seed){
	dropAllClients();
	newGame(seed);
}
module.exports.stop = stop;
module.exports.board = function(){return currentGame};
module.exports.dice = function(){return currentDice};
module.exports.setDice = function(d){currentDice = d;};
module.exports.canMove = canMove;
module.exports.player = currentPlayer;
module.exports.io = function(){return io};
