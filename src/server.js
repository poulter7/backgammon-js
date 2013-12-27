var ioModule = require('socket.io')
 , game = require('./game.js')

currentGame = undefined

start = function(app, port, cb){
	currentGame = game.initialBoard()

	port = process.env.PORT || port || 5000;
	var server = app.listen(port, cb)
	io = require('socket.io').listen(server);

	return io.sockets.on('connection', function (socket) {
		socket.on("status", function() {
			return socket.emit("status", currentGame.state())
		});
	});
}
stop = function(cb){
	io.server.close();
	cb()
}
module.exports.start = start;
module.exports.stop = stop;
