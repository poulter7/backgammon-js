var ioModule = require('socket.io')
 , game = require('./game.js')

currentGame = undefined

start = function(port, cb){
	io = ioModule.listen(port, cb);
	currentGame = game.initialBoard()

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
