var assert = require('assert')
, should = require('should')
, _ = require('underscore')
, app_module = require('../src/server.js')
, jQuery = require('jquery')
, should = require('should')
, io = require('socket.io-client')
, Browser = require("zombie");

var browser = undefined
var socketURL = 'http://0.0.0.0:5000'
var options = {
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

describe('Game', function(){
	describe('#play', function(){
		before(function(done){
			// setup the browser and jQuery
			this.timeout(10000);
			app_module.start(5000);
			browser = new Browser()
			browser.visit("http://0.0.0.0:5000")
			waitFor(
				browser, 
				function(b){
					return  b.success && b.queryAll("circle").length > 0;
				}, function(){
					$ = jQuery(browser.window)
					$.fn.d3Click = function () {
						this.each(function (i, e) {
							var evt = browser.window.document.createEvent("MouseEvents");
							evt.initMouseEvent("click", true, true, browser.window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

							e.dispatchEvent(evt);
						});
					};
					done();
				}
			)
		}),
		after(function(done){
			app_module.stop(done);
		}),
		it('should be able to access main page', function(){
			browser.success.should.be.ok;
		}),
		it('should be able to see main board', function(){
			browser.queryAll("circle").length.should.be.equal(30);
		}),
		it('should be able to select a selectable piece on the board', function(){
			var circle= $('circle[pos="1"][index="1"]').first()
			circle.attr('class').should.equal('red')
			circle.d3Click()
			circle.attr('class').should.equal('red selected')
		})
		it('should not be possible to select a piece which is not on the top of its stack', function(){
			var circle= $('circle[pos="1"][index="0"]').first()
			circle.attr('class').should.equal('red')
			circle.d3Click()
			circle.attr('class').should.equal('red')
		})
	})
	describe('#view', function(){
		before(function(done){
			app_module.start(5000);
			done();
		}),
		after(function(done){
			app_module.stop(done);
		}),
		it('should be possible to connect to a server', function(done){
			var client = io.connect(socketURL, options);
			client.on("connect", done);
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

			doneOnce = _.once(done)
			client.on("connect", function(data){
				client.emit("dice");
				client.on("dice", function(dice){
					assert.deepEqual(
						dice,
						[6,6,6,6]
					)
					doneOnce();
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
			var onceDone = _.once(done);
			client.on("connect", function(data){
				client.emit("move", 1, 2)
				client.on("status", function(data){
					client.emit("player");
					var positionSummary = _.countBy(data, _.values);
					positionSummary['1,red'].should.equal(1);
					positionSummary['3,red'].should.equal(1);
					client.on("player", function(player){
						console.log('player')
						player.should.equal('black');
						onceDone();
					});
				});
			});
		})
	})
})
