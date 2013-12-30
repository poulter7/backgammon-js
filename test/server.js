var assert = require('assert')
var should = require('should')
var _ = require('underscore')
var app_module = require('../src/server.js')

var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://0.0.0.0:5000';
var Browser = require("zombie");
var options ={
	transports: ['websocket'],
	'force new connection': true
};

waitFor = function(browser, precondition, callback){
	var condition = precondition(browser);
	if (precondition(browser)){
		callback(browser)
		return;
	}
	setTimeout(
		function() {
			waitFor(browser, precondition, callback)
		}, 
		100
	);
}

var browser = undefined
describe('Game', function(){
	describe('#view', function(){
		before(function(done){
			app_module.start(5000);
			browser = new Browser()
			done();
		}),
		after(function(done){
			app_module.stop(done);
		}),
		it('should be able to get to main page', function(done){
			this.timeout(5000);
			browser
				.visit("http://0.0.0.0:5000")
				.then(function(){
					browser.success.should.be.ok;
				})
				.then(done)
		}),
		it('should be able to see main board', function(done){
			this.timeout(5000)
			finishedLoading = function(b){
				return  b.success && b.queryAll("circle").length > 0;
			};
			postLoading = function(b){
				b.queryAll("circle").length.should.be.equal(30);
				done();
			};

			browser.visit("http://0.0.0.0:5000");

			waitFor(
				browser,
				finishedLoading,
				postLoading
			);
		}),
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
