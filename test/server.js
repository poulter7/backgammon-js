var assert = require('assert')
var should = require('should')
var _ = require('underscore')
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
				done();
			});
		})
		it('should be possible to retreive an initial game state', function(done){
			var client = io.connect(socketURL, options);
			game = require('../src/game.js');

			client.on("connect", function(data){
				client.emit("status");
			});
			client.on("status", function(data){
				var positionSummary = _.countBy(data, _.values)
				assert.deepEqual(
					data,
					game.initialBoard().state()
				);
				positionSummary['1,red'].should.equal(2);
				done();
			});
		}),
		it('should be possible to retrieve the current dice roll', function(done){
			var client = io.connect(socketURL, options);
			game = require('../src/game.js');

			client.on("connect", function(data){
				client.emit("dice");
				client.on("dice", function(dice){
					assert.deepEqual(
						dice,
						[6,6,6,6]
					)
					done();
				});
			});
		}),
		it('should be Red to play first', function(done){
			var client = io.connect(socketURL, options);
			client.on("connect", function(data){
				client.emit("player");
				client.on("player", function(player){
					player.should.equal('red')
					done();
				});
			});
		}),
		it('should be Black to play after a move', function(done){
			var client = io.connect(socketURL, options);
			client.on("connect", function(data){
				client.emit("move", 1, 2)
				client.on("status", function(data){
					client.emit("player")
					var positionSummary = _.countBy(data, _.values);
					positionSummary['1,red'].should.equal(1);
					positionSummary['3,red'].should.equal(1);
					client.on("player", function(player){
						player.should.equal('black')
						done();
					});
				});
			});
				
		})
	})
})
