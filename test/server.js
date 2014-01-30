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

Browser.prototype.keydown = function(targetSelector, keyCode) {
  keyCode = keyCode.charCodeAt(0)
  var event = this.window.document.createEvent('HTMLEvents');
  event.initEvent('keydown', true, true);
  event.which = keyCode;
  if (targetSelector === this.window){
	  var target = this.window
  } else{
	  var target = this.window.document.querySelector(targetSelector);
  }
  target && target.dispatchEvent(event);
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
loadPage = function(cb, skipWaitingDice){
	var browser = new Browser();
	browser.debug = true;
	browser.visit("http://0.0.0.0:5000")
	waitFor(
		browser, 
		function(b){
			var piecesOK = false;
			var diceOK = false;
			var pageLoaded = b.success

			if (pageLoaded){
				piecesOK = (b.queryAll("circle")|| []).length > 0;
				diceOK = (b.queryAll("#dice a") || []).length > 0;
				if (skipWaitingDice){
					diceOK = true;
				}
			}
			return pageLoaded && diceOK && piecesOK
		}, function(){
			$ = jQuery(browser.window)
			$.fn.d3Click = function () {
				this.each(function (i, e) {
					var evt = browser.window.document.createEvent("MouseEvents");
					evt.initMouseEvent("click", true, true, browser.window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

					e.dispatchEvent(evt);
				});
			};
			$.fn.pieceAt = function(pos, index){
				return $('circle[pos="'+pos+'"][index="'+index+'"]').first()	
			};
			$.fn.diceAt = function(pos){
				return $('#dice a').eq(pos)
			}
			if (cb){
				cb();
			}
		}
	)
	return browser
}
describe('Game', function(){
	describe('#launchapp', function(){
		it.skip("Should be possible to restart and have a different intial dice", function(done){
			require('../app.js')
			t = chance.seed === parseInt(chance.seed)
			t.should.equal.true;
			app_module.stop(done);
		})
	}),
	describe('#spacedicetrigger', function(){
		before(function(){
			app_module.start(5000);
			app_module.io().set('log level', 0);
		}),
		beforeEach(function(done){
			this.timeout(5000);
			app_module.resetServer(seed=5, autodiceroll=false);
			// setup the browser and jQuery
			browser = loadPage(done, skipWaitingDice=true);
		}),
		after(function(done){
			app_module.stop(done);
		}),
		it("Should be possible to force a player to roll the dice, clicking a link", function(done){
			$('#dice a').length.should.equal(1);
			$('#dice a').text().should.equal("Perform roll");
			$('#playable a').length.should.equal(0)
			browser.clickLink("#diceroll");

			// roll should have been performed
			waitFor(
				browser,
				function(){
					return $('#dice a').text() == '21'
				},
				function(){
					client = ioClient.connect(socketURL, options);
					client.emit("move", 1, 0);
					client.emit("move", 1, 1);
					waitFor(
						browser,
						function(){
							return $('#dice a').text() == "Perform roll";
						},
						function(){done();}
					)
				}
			)
		}),
		it("Cannot pass if you haven't rolled", function(){
			app_module.performPass().should.equal.false

		}),
		it("Should be possible to force a player to roll the dice, using spacebar", function(done){
			browser.keydown(browser.window, ' ');
			waitFor(
				browser,
				function(){
					return $('#dice a').text() == '21'
				},
				function(){done()}
			)

		}),
		it("Should be able to see a notification that a roll is neccessary", function(){
			$('#dice a').text().should.equal("Perform roll")
		})
	}),
	describe('#diceselect', function(){
		before(function(){
			app_module.start(5000);
			app_module.io().set('log level', 0);
		}),
		beforeEach(function(done){
			this.timeout(5000);
			app_module.resetServer(seed=5);
			// setup the browser and jQuery
			browser = loadPage(done);
		}),
		after(function(done){
			app_module.stop(done);
		}),
		it("should be possible to trigger a roll with a key press", function(done){
			$('body').pieceAt(1, 1).d3Click()
			browser.keydown(browser.window, '2');

			firstDiceSelected = function(){
				return $('body').diceAt(0).hasClass('used')
			}
			firstDiceSelected().should.be.false;
			waitFor(browser, firstDiceSelected, function(){done()});
		}),
		it("should be possible to trigger a roll with a key press, for none dupe dice", function(done){
			$('body').pieceAt(1, 1).d3Click()
			browser.keydown(browser.window, '1');
			secondDiceSelected = function(){
				return $('body').diceAt(1).hasClass('used')
			}
			waitFor(browser, secondDiceSelected, function(){done()});
		}),
		it("Shouldn't display a notification for rolling when a roll isn't neccessary", function(){
			$('#dice a').text().should.not.equal("Perform roll")
		})
	}),
	describe('#play', function(){
		before(function(){
			app_module.start(5000);
			app_module.io().set('log level', 0);
		}),
		beforeEach(function(done){
			this.timeout(5000);
			app_module.resetServer(seed=4);
			// setup the browser and jQuery
			browser = loadPage(done);
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
			var circle= $('circle[pos="1"][index="1"]').first();
			circle.attr('class').should.equal('red');
			circle.d3Click();
			circle.attr('class').should.equal('red selected');
		}),
		it('should not be possible to select a piece which is not on the top of its stack', function(){
			var circle= $('circle[pos="1"][index="0"]').first();
			circle.attr('class').should.equal('red');
			circle.d3Click();
			circle.attr('class').should.equal('red');
		}),
		it("should be possible to read who's move it is", function(){
			$('#player').text().should.equal('Red');
			$('#playable a').length.should.equal(0);
		}),
		it.skip('should be possible to select any piece on the bar', function(){
		}),
		it.skip("shouldn't be able to select a piece which isn't yours", function(){
		}),
		it("should be possible to skip a turn if no piece can be moved", function(done){
			this.timeout(5000);
			var c = app_module.board();
			c.redState = {1:15};
			c.blackState = {7:15};
			app_module.canMove().should.be.false;
			browser = loadPage(function(){
				$('#playable a').length.should.equal(1);
				$('#playable').text().should.equal('Cannot move - skip turn');
				browser.click('#playlink');
				browser = loadPage(function(){
					$('#playable a').length.should.equal(0);
					$('#player').text().should.equal('Black');
					$('#dice a').text().should.equal('42');
					done();
				});
			});
		}),	
		it("should be possible to skip a turn if no - server direct", function(done){
			this.timeout(5000);
			var c = app_module.board();
			c.redState = {1:15};
			c.blackState = {7:15};
			app_module.performPass().should.equal.true
			browser = loadPage(function(){
				$('#dice a').text().should.equal('42');
				$('#playable').text().should.equal('')
				app_module.performPass().should.equal.false;
				done();
			});
		}),	
		it("should be possible to skip a turn if no piece can be moved but only one dice is left", function(done){
			this.timeout(5000);
			var c = app_module.board();
			c.redState = {1:15};
			c.blackState = {7:15};
			app_module.setDice([{val:3, rolled:true}, {val:6, rolled:false}])
			app_module.canMove().should.be.false;
			browser = loadPage(function(){
				$('#playable a').length.should.equal(1);
				$('#playable').text().should.equal('Cannot move - skip turn');
				done();
			});
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
		}),
		it("should be possible to trigger a roll with a key press, for dupe dice", function(done){
			this.timeout(5000);
			$('body').pieceAt(1, 1).d3Click()
			diceStr = '#dice a';
			browser.keydown(browser.window, '6');

			firstDiceSelected = function(){
				return $('body').diceAt(0).hasClass('used')
			}
			secondDiceSelected = function(){
				return $('body').diceAt(1).hasClass('used')
			}
			firstDiceSelected().should.be.false;
			waitFor(browser, firstDiceSelected, function(){
				$('body').pieceAt(1, 0).d3Click()
				browser.keydown(browser.window, '6');
				waitFor(browser, secondDiceSelected, function(){done()})
			});
		})
	}),
	describe('#view', function(){
		before(function(done){
			app_module.start(5000);
			app_module.io().set('log level', 0);
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
						{dice:[
							{"val":6,"rolled":false},
							{"val":6,"rolled":false},
							{"val":6,"rolled":false},
							{"val":6,"rolled":false}
						], playable: true}
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
		it('should not be able to use the same die twice', function(done){
			var client = ioClient.connect(socketURL, options);
			client.on("connect", function(){
				client.emit("move", 1, 0);
				client.once("status", function(data1){
					var pos1 = _.countBy(data1, _.values);
					pos1['1,red'].should.equal(1);
					pos1['7,red'].should.equal(1);
					client.emit("move", 1, 0);

					client.once("status", function(data2){
						var pos2 = _.countBy(data2, _.values);
						pos2['1,red'].should.equal(1);
						pos2['7,red'].should.equal(1);
						done();
					})
				})
			})
		}),
		it('should not be able to move a black piece when it is red to move', function(done){
			var client = ioClient.connect(socketURL, options);
			client.on("connect", function(){
				client.emit("move", 24, 0);
				client.on("status", function(board){
					var pos = _.countBy(board, _.values);
					pos.should.eql(
						{
							'1,red': 2,
							'12,red': 5,
							'17,red': 3,
							'19,red': 5,
							'6,black': 5,
							'8,black': 3,
							'13,black': 5,
							'24,black': 2
						}
					)
					done();
				});

			})
		}),
		it('should be Black to play after a move', function(done){
			var client = ioClient.connect(socketURL, options);
			client.on("connect", function(data){
				client.emit("move", 1, 0)
				client.once("status", function(data){
					// check the update of the last move
					var positionSummary = _.countBy(data, _.values);
					positionSummary['1,red'].should.equal(1);
					positionSummary['7,red'].should.equal(1);

					// make some more moves
					client.emit("move", 1, 1)
					client.emit("move", 12, 2)
					client.emit("move", 12, 3)

					// check if the player changed
					client.on("player", function(player){
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
				var targets = [
					{dice:[{'val':6, 'rolled':true}, {'val':6, 'rolled':false}, {'val':6, 'rolled':false}, {'val':6, 'rolled':false}], playable:true},
					{dice:[{'val':6, 'rolled':true}, {'val':6, 'rolled':true},  {'val':6, 'rolled':false}, {'val':6, 'rolled':false}], playable:true},
					{dice:[{'val':6, 'rolled':true}, {'val':6, 'rolled':true},  {'val':6, 'rolled':true},  {'val':6, 'rolled':false}], playable:true},
					{dice:[{'val':4, 'rolled':false},{'val':2, 'rolled':false}], playable:true },
					{dice:[{'val':4, 'rolled':false},{'val':2, 'rolled':true} ], playable:true }
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
					dice.should.eql(
						{
							dice:[
								{'val':6, 'rolled':false}, 
								{'val':6, 'rolled':false}, 
								{'val':6, 'rolled':false}, 
								{'val':6, 'rolled':false}
							],
							playable: true
						}
					)
					done();
				})
			})
		}),
		it('should be possible determine that a move can be made', function(){
			var c = app_module.board();
			c.redState = {2:15};
			c.blackState = {7:15};
			console.log(app_module.board());
			console.log(app_module.dice());
			app_module.canMove().should.be.true;
		})
		it('should be possible determine that no move can be made', function(){
			var c = app_module.board();
			c.redState = {1:15};
			c.blackState = {7:15};
			console.log(app_module.board());
			console.log(app_module.dice());
			app_module.canMove().should.be.false;
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
							done();
						})
					})
				})
			})
		})
	})
})
