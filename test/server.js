var assert = require('assert')
, should = require('should')
, _ = require('underscore')
, app_module = require('../src/server.js')
, jQuery = require('jquery')
, should = require('should')
, ioClient= require('socket.io-client')
, Browser = require("zombie")

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
		before(function(){
			app_module.start(5000);
		}),
		beforeEach(function(done){
			this.timeout(5000)
			app_module.resetServer(seed=4);
			// setup the browser and jQuery
			browser = new Browser()
			browser.visit("http://0.0.0.0:5000")
			waitFor(
				browser, 
				function(b){
					return  b.success && b.queryAll("circle").length > 0 && browser.queryAll("#dice a").length > 0
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
			browser.queryAll("#dice a").length.should.be.above(0);
		}),
		it('should be able to select a selectable piece on the board', function(){
			var circle= $('circle[pos="1"][index="1"]').first()
			circle.attr('class').should.equal('red')
			circle.d3Click()
			circle.attr('class').should.equal('red selected')
		}),
		it('should not be possible to select a piece which is not on the top of its stack', function(){
			var circle= $('circle[pos="1"][index="0"]').first()
			circle.attr('class').should.equal('red')
			circle.d3Click()
			circle.attr('class').should.equal('red')
		}),
		it("should be possible to read who's move it is", function(){
			$('#player').text().should.equal('Red')
		}),
		it.skip('should be possible to select any piece on the bar', function(){
		}),
		it.skip("shouldn't be able to select a piece which isn't yours", function(){
		}),
		it('should be possible to watch a full move complete and have the UI update the the next player', function(done){
			client = ioClient.connect(socketURL, options);
			checkGameState = function(){
				var diceStr = '#dice a';
				waitFor(
					browser,
					function(b){
						return $(diceStr).text() == '42';	// dice have updated
					},
					function(){
						// confirm that the UI has updated, new player
						
						$('#player').text().should.equal('Black')
						done();
					}
				);
			}

			checkAfter4Moves = _.after(4, checkGameState);
			client.on('status', checkAfter4Moves);
			client.emit("move", 1, 0);
			client.emit("move", 1, 1);
			client.emit("move", 12, 2);
			client.emit("move", 12, 3);

			// check the dice have updated to the next set
			// check that the player has updated
		}),
		it('should be possible to move a piece', function(done){
			this.timeout(3000)
			locationToMoveFrom = 'circle[pos="1"][index="1"]'
			locationToMoveTo   = 'circle[pos="7"][index="0"]'
			diceStr = '#dice a'

			// target should be empty
			$(locationToMoveTo).length.should.equal(0)

			var piece = $(locationToMoveFrom).first().d3Click()
			var die = $(diceStr).first().d3Click()
			$(diceStr).text().should.equal('6666')

			waitFor(
				browser, 
				function(b){return $(locationToMoveFrom).length === 0}, // wait for the refresh
				function(){
					$(locationToMoveTo).length.should.equal(1) // assert the correct move has happened
					$(diceStr).text().should.equal('6666')
					$(diceStr).eq(0).hasClass('used').should.be.true
					// should not be actionable
					$(diceStr).eq(1).hasClass('used').should.be.false
					$(diceStr).eq(2).hasClass('used').should.be.false
					$(diceStr).eq(3).hasClass('used').should.be.false
					done()
				}
			);
		})
	}),
	describe('#view', function(){
		before(function(done){
			app_module.start(5000);
			done();
		}),
		beforeEach(function(){
			app_module.resetServer(seed=4);
		}),
		after(function(done){
			app_module.stop(done);
		}),
		it('should be possible to connect to a server', function(done){
			var client = ioClient.connect(socketURL, options);
			client.on("connect", done);
		})
		it('should be possible to retreive an initial game state', function(done){
			var client = ioClient.connect(socketURL, options);
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

			var client = ioClient.connect(socketURL, options);
			client.on("connect", function(data){
				client.emit("dice");
				client.on("dice", function(dice){
					dice.should.eql(
						[
							{"val":6,"rolled":false},
							{"val":6,"rolled":false},
							{"val":6,"rolled":false},
							{"val":6,"rolled":false}
						]
					)
					done();
				});
			});
		}),
		it('should be the case that all players are notified about a status change', function(done){
			this.timeout(10000);
			var client1 = ioClient.connect(socketURL, options);

			client1.on("connect", function(data){
				var client2 = ioClient.connect(socketURL, options);

				client2.on("connect", function(data){
					// this test will only complete when done has been called twice
					success = _.after(2, done)
					client2.on("status", function(data){
						success();
					});
					client1.on("status", function(data){
						success();
					});
					client1.emit("move", 1, 2)
				});
			});

		}),
		it('should be Red to play first', function(done){
			var client = ioClient.connect(socketURL, options);
			client.on("connect", function(data){
				client.emit("player");
				client.on("player", function(player){
					player.should.equal('red')
					done();
				});
			});
		}),
		it('should be Black to play after a move', function(done){
			var client = ioClient.connect(socketURL, options);
			client.on("connect", function(data){
				client.emit("move", 1, 0)
				client.once("status", function(data){
					// check the update of the last move
					var positionSummary = _.countBy(data, _.values);
					console.log(positionSummary)
					positionSummary['1,red'].should.equal(1);
					positionSummary['7,red'].should.equal(1);

					// make some more moves
					client.emit("move", 1, 1)
					client.emit("move", 12, 2)
					client.emit("move", 12, 3)

					// check if the player changed
					client.on("player", function(player){
						console.log('player')
						player.should.equal('black');
						done();
					});


				});
			});
		}),
		it('should roll dice between moves completed', function(done){
			var client = ioClient.connect(socketURL, options);
			// 6,6,6,6 - move(1,6)  RED
			// 4,2     - move(13,4) BLACK
			// 6,6,6,6 - move(24,6) RED
			// 5,4     - move(9, 5) BLACK
			// 5,4     - move(7, 4) RED
			// 2,1     - move(2, 1) BLACK
			// 6,2     ->
			this.timeout(10000);
			var i = 0
			doneAfter5 = _.after(5, done) 
			diceCallback = function(dice){
				console.log('Roll', i)
				console.log(dice, i)
				var targets = [
					{0: {'val':6, 'rolled':true}, 1: {'val':6, 'rolled':false}, 2: {'val':6, 'rolled':false}, 3: {'val':6, 'rolled':false}},
					{0: {'val':6, 'rolled':true}, 1: {'val':6, 'rolled':true}, 2: {'val':6, 'rolled':false}, 3: {'val':6, 'rolled':false}},
					{0: {'val':6, 'rolled':true}, 1: {'val':6, 'rolled':true}, 2: {'val':6, 'rolled':true}, 3: {'val':6, 'rolled':false}},
					{0: {'val':4, 'rolled':false}, 1: {'val':2, 'rolled':false}, },
					{0: {'val':4, 'rolled':false}, 1: {'val':2, 'rolled':true}, }
				]
				dice.should.eql(targets[i])
				i += 1;
				doneAfter5()
			}
			client.on("dice", diceCallback)
			client.on("connect", function(data){
				client.emit("move", 1, 0);
				client.emit("move", 1, 1);
				client.emit("move", 12, 2);
				client.emit("move", 12, 3);
				client.emit("move", 13, 1);
			});
		}),
		it('should make no dice change if the move was invalid', function(done){
			var client = ioClient.connect(socketURL, options);
			client.on("connect", function(){
				client.emit("move", 19, 0);
				client.on("dice", function(dice){
					console.log(dice);
					dice.should.eql([
						{'val':6, 'rolled':false}, 
						{'val':6, 'rolled':false}, 
						{'val':6, 'rolled':false}, 
						{'val':6, 'rolled':false}
					])
					done();
				})
			})
		}),
		it('should not make a move out of turn', function(done){
			var client = ioClient.connect(socketURL, options);
			client.on("connect", function(){
				client.emit("move", 24, 0);
				client.on("dice", function(dice){
					console.log(dice);
					done();
				})
			})
		})
		it.skip('should be possible to capture Black piece', function(done){
			var client = ioClient.connect(socketURL, options);
			display = function(data){console.log(data)}
			client.on('connect', function(){
				client.emit("move", 1, 6)
				client.once("status", function(data){
					client.emit("move", 13, 6)
					client.once("status", function(data){
						client.emit("move", 1, 6)
						client.once("status", function(data){
							console.log(data.length)
							done();
						})
					})
				})
			})
		})
	})
})
