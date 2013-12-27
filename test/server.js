var assert = require('assert')
var should = require('should')
server = require('../src/server.js')

var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://0.0.0.0:5000';
var options ={
	transports: ['websocket'],
	'force new connection': true
};

describe('Game', function(){
	describe('#view', function(){
		before(function(done){
			//server.start(done);
			var express = require('express');
			var app = express();
			server.start(app, 5000, done)

		})
		after(function(done){
			server.stop(done);
		})
		it('should be possible to connect to a server', function(done){
			var client = io.connect(socketURL, options);
			client.on("connect", function(data){
				done()
			});
		})
		it('should be possible to retreive an initial game state', function(done){
			var client = io.connect(socketURL, options);
			var connected = false
			client.on("connect", function(data){
				client.emit("status")
			});
			game = require('../src/game.js')

			client.on("status", function(data){
				assert.deepEqual(
					data,
					game.initialBoard().state()
				)
				done()
			});
		})
	})
})
