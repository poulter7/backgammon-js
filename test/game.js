var assert = require('assert')
var should = require('should')
game = require('../src/game.js')
var Board = game.Board
var initialBoard = game.initialBoard
describe('Game', function(){
	describe('#start', function(){
		it('should have the correct starting positions for red', function(){
			var board = initialBoard()
			board.red.piecesAt(1).should.equal(2)
			board.red.piecesAt(12).should.equal(5)
			board.red.piecesAt(17).should.equal(3)
			board.red.piecesAt(19).should.equal(5)
		}),
		it('should have the correct starting positions for black', function(){
			var board = initialBoard()
			board.black.piecesAt(24).should.equal(2)
			board.black.piecesAt(13).should.equal(5)
			board.black.piecesAt(8).should.equal(3)
			board.black.piecesAt(6).should.equal(5)
		})
	})
	describe('#move', function(){
		it('should be able to move ', function(){
			var board = new Board()
			board.redState = {1:1}
			board.red.piecesAt(1).should.equal(1)
			board.moveRed(1, 1)
			board.red.piecesAt(1).should.equal(0)
			board.red.piecesAt(2).should.equal(1)
		}),
		it('should be able to move two points', function(){
			var board = new Board()
			board.redState = {1:1}
			assert.equal(board.red.piecesAt(1), 1)
			board.moveRed(1, 2)
			assert.equal(board.red.piecesAt(1), 0)
			assert.equal(board.red.piecesAt(3), 1)
		}),
		it('should be able to move splitting a stack', function(){
			var board = new Board()
			board.redState = {1:2}
			board.moveRed(1, 1)
			board.red.piecesAt(1).should.equal(1)
			board.red.piecesAt(2).should.equal(1)
		}),
		it('should not be able to move when an opposing stack is blocking', function(){
			var board = new Board()
			board.blackState = {2:2}
			board.redState = {1:1}
			board.moveRed(1, 1)
			board.red.piecesAt(1).should.equal(1)
			board.red.piecesAt(2).should.equal(0)
			board.black.piecesAt(2).should.equal(2)
		}),
		it('should be able to move off the board', function(){
			var board = new Board()
		})
	})
	describe('#player', function(){
		it('should be possible from a player string to retreive the opponent', function(){
			'red'.opponent().should.equal('black')
			'black'.opponent().should.equal('red')
			should.strictEqual('dave'.opponent(), undefined)
		})
	})
	describe('#validMove', function(){
		it('should be invalid to move into a stack of opposing pieces', function(){
			var board = new Board()
			board.blackState = {2:2}
			board.red.canMoveToTarget(2).should.be.false

		})
		it('should be invalid to move into a stack of opposing pieces', function(){
			var board = new Board()
			board.redState = {2:2}
			board.black.canMoveToTarget(2).should.be.false

		})
		it('should be valid to move against a single piece', function(){
			var board = new Board()
			board.blackState = {2:1}
			board.red.canMoveToTarget(2).should.be.true
		})
		it('should be valid to move into an empty space', function(){
			var board = new Board()
			board.blackState = {2:0}
			board.red.canMoveToTarget(2).should.be.true
		})
		it('should be invalid to move anything but bar moves if available', function(){
			var board = new Board()
			board.bar = {red:1, black:0}
			board.red.canMovePieceAt(2).should.be.false
			board.red.canMovePieceAt('bar').should.be.true
		})
		it('should be valid to move anything if bar is free', function(){
			var board = new Board()
			board.redState = {1:1}
			board.bar = {red:0, black:0}
			board.red.canMovePieceAt(1).should.be.true
		})
	})
	describe('#hitting', function(){
		it('should be possible to hit a blot', function(){
			var board = new Board()
			board.blackState = {12:1}
			board.redState = {11:1}
			board.moveRed(11, 1)
			board.red.piecesAt(11).should.equal(0)
			board.bar.black.should.equal(1)
		})
		it('should be possible for black to hit a blot', function(){
			var board = new Board()
			board.blackState = {12:1}
			board.redState = {11:1}
			console.log(board)
			board.moveBlack(12, 1)
			console.log(board)
			board.red.piecesAt(11).should.equal(0)
			board.black.piecesAt(11).should.equal(1)
			board.bar.red.should.equal(1)
		})
	}),
	describe('#bar', function(){
		it('should empty at startup', function() {
			var board = initialBoard()
			assert.equal(board.bar.black, 0)
			board.bar.black.should.equal(0)
			board.bar.red.should.equal(0)
		})
		it('should be able to move a red piece off of the bar to create a stack', function(){
			var board = new Board()
			board.redState = {1:1}
			board.bar = {red:1, black:0}
			board.popRedBar(1)
			board.bar.red.should.equal(0)
			board.red.piecesAt(1).should.equal(2)
		})
		it('should be able to move a red piece off of the bar', function(){
			var board = new Board()
			board.bar = {red:1, black: 0}
			board.popRedBar(1)
			board.bar.red.should.equal(0)
			board.red.piecesAt(1).should.equal(1)
		}),
		it('should be able to move a red piece off of the bar to a different first six point', function(){
			var board = new Board()
			board.bar = {red: 1, black: 0}
			board.popRedBar(6)
			board.bar.red.should.equal(0)
			board.red.piecesAt(6).should.equal(1)
		}),
		it('should be possible to hit a blot from entering', function(){
			var board = new Board()
			board.blackState = {1:1};
			board.bar = {red:1, black:0}
			board.popRedBar(1)
			board.red.piecesAt(1).should.equal(1, 'Pip successfully entered')
			board.black.piecesAt(1).should.equal(0, 'Hit pip removed')
			board.bar.black.should.equal(1, 'Hit pip on bar')
		}),
		it('should not be able to pop a piece when a black stack is blocking', function(){
			var board = new Board()
			board.blackState = {1:2}
			board.bar = {red:1, black:0}
			board.popRedBar(1)
			board.bar.red.should.equal(1)
			board.red.piecesAt(1).should.equal(0)
			board.black.piecesAt(1).should.equal(2)
		})
	})
})

