var assert = require('assert')
var should = require('should')
game = require('../src/game.js')
var Board = game.Board
var initialBoard = game.initialBoard
describe('Board', function(){
	describe('#start', function(){
		it('should have the correct starting positions for red', function(){
			var board = initialBoard();
			board.red.piecesAt(1).should.equal(2);
			board.red.piecesAt(12).should.equal(5);
			board.red.piecesAt(17).should.equal(3);
			board.red.piecesAt(19).should.equal(5);
		}),
		it('should have the correct starting positions for black', function(){
			var board = initialBoard();
			board.black.piecesAt(24).should.equal(2);
			board.black.piecesAt(13).should.equal(5);
			board.black.piecesAt(8).should.equal(3);
			board.black.piecesAt(6).should.equal(5);
		})
	}),
	describe('#move', function(){
		it('should be able to move ', function(){
			var board = new Board();
			board.redState = {1:1};
			board.red.piecesAt(1).should.equal(1);
			board.red.progressPiece(1, 1);
			board.red.piecesAt(1).should.equal(0);
			board.red.piecesAt(2).should.equal(1)
		}),
		it('should be able to move two points', function(){
			var board = new Board();
			board.redState = {1:1};
			assert.equal(board.red.piecesAt(1), 1);
			board.red.progressPiece(1, 2);
			assert.equal(board.red.piecesAt(1), 0);
			assert.equal(board.red.piecesAt(3), 1);
		}),
		it('should be able to move splitting a stack', function(){
			var board = new Board();
			board.redState = {1:2};
			board.red.progressPiece(1, 1);
			board.red.piecesAt(1).should.equal(1);
			board.red.piecesAt(2).should.equal(1);
		}),
		it('should not be able to move when an opposing stack is blocking', function(){
			var board = new Board();
			board.blackState = {2:2};
			board.redState = {1:1};
			board.red.validMove(1, 1).should.not.be.okay;
			board.red.canMoveToTarget(2).should.not.be.okay;
			board.red.progressPiece(1, 1);
			board.red.piecesAt(1).should.equal(1);
			board.red.piecesAt(2).should.equal(0);
			board.black.piecesAt(2).should.equal(2)
		}),
		it('should not be an invlid move returns false', function(){
			var board = new Board();
			board.blackState = {2:2};
			board.redState = {1:1};
			board.red.progressPiece(1, 1).should.be.false;
		}),
		it('should be able to determine what positions each player occupies', function(){
			var board = new Board();
			board.redState = {1:1};
			board.blackState = {2:2, 10:2};
			board.bar = {red:0 , black: 1};
			board.red.ownedPositions.should.be.eql([1]);

			board.black.ownedPositions.should.be.eql([2, 10, 'bar']);
		}),
		it('should be able to determine if a player has no moves', function(){
			var board = new Board();
			board.blackState = {2:2, 10:2};
			board.redState = {1:2};
			board.red.canMoveWith(1).should.be.false;
			board.black.canMoveWith(1).should.be.true;
		}),
		it('should be able to move if off the bar', function(){
			var board = new Board();
			board.blackState = {};
			board.redState = {};
			board.bar = {red:0 , black: 1};
			board.red.canMoveWith(3).should.be.false;
			board.black.canMoveWith(3).should.be.true;
		})
		it('should be able to move if stack blocking', function(){
			var board = new Board();
			board.blackState = {4:2, 13:0};
			board.redState = {1:2, 10:2};
			board.bar = {red:0 , black: 0};
			board.red.canMoveWith(3).should.be.true;
			board.black.canMoveWith(3).should.be.false;
		}),
		it('should be able to move if stack blocking from bar', function(){
			var board = new Board();
			board.blackState = {4:2};
			board.redState = {10:2};
			board.bar = {red:1, black: 0};
			board.red.canMoveWith(4).should.be.false;
		})
	}),
	describe('#player', function(){
		it('should be possible from a player string to retreive the opponent', function(){
			'red'.opponent().should.equal('black');
			'black'.opponent().should.equal('red');
			should.strictEqual('dave'.opponent(), undefined);
		})
	})
	describe('#validMove', function(){
		it('should be invalid to move into a stack of opposing pieces', function(){
			var board = new Board();
			board.blackState = {2:2};
			board.red.canMoveToTarget(2).should.be.false;

		})
		it('should be invalid to move into a stack of opposing pieces', function(){
			var board = new Board();
			board.redState = {2:2};
			board.black.canMoveToTarget(2).should.be.false;

		})
		it('should be valid to move against a single piece', function(){
			var board = new Board();
			board.blackState = {2:1};
			board.red.canMoveToTarget(2).should.be.true;
		})
		it('should be valid to move into an empty space', function(){
			var board = new Board();
			board.blackState = {2:0};
			board.red.canMoveToTarget(2).should.be.true;
		})
		it('should be invalid to move anything but bar moves if available', function(){
			var board = new Board();
			board.bar = {red:1, black:0};
			board.red.canMovePieceAt(2).should.be.false;
			board.red.canMovePieceAt('bar').should.be.true;
		})
		it('should be valid to move anything if bar is free', function(){
			var board = new Board();
			board.redState = {1:1};
			board.bar = {red:0, black:0};
			board.red.canMovePieceAt(1).should.be.true;
		})
	})
	describe('#hitting', function(){
		it('should be possible to hit a blot', function(){
			var board = new Board();
			board.blackState = {12:1};
			board.redState = {11:1};
			board.red.progressPiece(11, 1);
			board.red.piecesAt(11).should.equal(0);
			board.bar.black.should.equal(1)
		})
		it('should be possible for black to hit a blot', function(){
			var board = new Board();
			board.blackState = {12:1};
			board.redState = {11:1};
			board.black.progressPiece(12, 1);
			board.red.piecesAt(11).should.equal(0);
			board.black.piecesAt(11).should.equal(1);
			board.bar.red.should.equal(1);
		})
	}),
	describe('#bar', function(){
		it('should empty at startup', function() {
			var board = initialBoard();
			assert.equal(board.bar.black, 0);
			board.bar.black.should.equal(0);
			board.bar.red.should.equal(0);
		})
		it('should be able to move a red piece off of the bar to create a stack', function(){
			var board = new Board();
			board.redState = {1:1};
			board.bar = {red:1, black:0};
			board.red.progressPiece('bar', 1).should.be.true;
			board.bar.red.should.equal(0);
			board.red.piecesAt(1).should.equal(2)
		})
		it('should be able to move a red piece off of the bar', function(){
			var board = new Board();
			board.bar = {red:1, black: 0};
			board.red.progressPiece('bar', 1).should.be.true;
			board.bar.red.should.equal(0);
			board.red.piecesAt(1).should.equal(1);
		}),
		it('should be able to move a red piece off of the bar using lift', function(){
			var board = new Board();
			board.bar = {red:1, black: 0};
			board.red.progressPiece('bar', 1).should.be.true;
			board.bar.red.should.equal(0);
			board.red.piecesAt(1).should.equal(1);
		}),
		it('should be able to move a red piece off of the bar to a different first six point', function(){
			var board = new Board();
			board.bar = {red: 1, black: 0};
			board.red.progressPiece('bar', 6).should.be.true
			board.bar.red.should.equal(0);
			board.red.piecesAt(6).should.equal(1);
		}),
		it('should be possible to hit a blot from entering', function(){
			var board = new Board();
			board.blackState = {1:1};;
			board.bar = {red:1, black:0};
			board.red.progressPiece('bar', 1).should.be.true;
			board.red.piecesAt(1).should.equal(1, 'Pip successfully entered');
			board.black.piecesAt(1).should.equal(0, 'Hit pip removed');
			board.bar.black.should.equal(1, 'Hit pip on bar');
		}),
		it('should not be able to pop a piece when a black stack is blocking', function(){
			var board = new Board();
			board.blackState = {1:2};
			board.bar = {red:1, black:0};
			board.red.progressPiece('bar', 1).should.be.false;
			board.bar.red.should.equal(1);
			board.red.piecesAt(1).should.equal(0);
			board.black.piecesAt(1).should.equal(2);
		}),
		it('should be possible to pop a pip from the black bar', function(){
			var board = new Board();
			board.redState = {19:1};
			board.bar = {red:2, black:2};
			board.black.progressPiece('bar', 6);
			board.black.piecesAt(19).should.equal(1);
			board.red.piecesAt(19).should.equal(0);
			board.bar.red.should.equal(3);
		})
	}),
	describe('#bearingoff', function(){
		/*Once you have moved all of your checkers onto any of the last six points on the board, you may begin bearing off  - unless your opponent knocks one of your checkers to the bar, and then you must stop bearing off until you return that checker to one of the last six points.
		 *
		 * To bear off, move a piece into the rectangular goal at the end of the board.
		 * If you can move into the goal using an exact number, and you have no checkers on the bar or points further back than the last 6, then you may bear that checker off.  (On the final point, a roll of one is needed to bear off that checker.)
		 * You may choose to make any other move instead of bearing off, if you are able.
		 * If you do not have a number that allows you to bear a checker off with an exact move, you may not bear off and must move another checker on the board instead.
		 * However, If there are no checkers to move because they are all closer to the goal than the number you rolled, you may then bear off with the checker that is farthest away from your goal, even if the number you rolled is too large for an exact move.
		 */
		it('should be able to bear off black at the end of a game', function() {
			var board = new Board();
			board.blackState = {1:1};
			board.black.canBearOff(1, 1).should.be.ok;
			board.black.progressPiece(1, 1);
			board.black.piecesAt(1).should.equal(0);
			board.home.black.should.equal(1);
		}),
		it('should not be able to bear off black with pieces outside the home zone', function() {
			var board = new Board();
			board.blackState = {1:1, 8:2};
			board.black.canBearOff(1, 1).should.not.be.ok;
		}),
		it('should not be able to bear off black with a larger move to play', function() {
			var board = new Board();
			board.blackState = {1:1, 2:2};
			board.black.canBearOff(1, 2).should.not.be.ok;
			board.black.canBearOff(2, 2).should.be.ok;
		}),
		it('should not be able to bear off black with a larger move to play, with a large dice roll', function() {
			var board = new Board();
			board.blackState = {1:1, 2:2};
			board.black.canBearOff(1, 6).should.not.be.ok;
			board.black.canBearOff(2, 6).should.be.ok;
		}),
		it('should be able to bear off red at the end of a game', function() {
			var board = new Board();
			board.redState = {24:1};
			board.red.canBearOff(24, 1).should.be.ok;
			board.red.progressPiece(24, 1);
			board.red.piecesAt(24).should.equal(0);
			board.home.red.should.equal(1);
		}),
		it('should be able to bear off successively', function() {
			var board = new Board();
			board.redState = {24:2};
			board.blackState = {1:2};

			board.black.progressPiece(1, 1);
			board.black.piecesAt(1).should.equal(1);
			board.black.canBearOff(1, 1).should.be.true;
			board.home.black.should.equal(1);

			board.red.progressPiece(24, 1);
			board.red.canBearOff(24, 1).should.be.true;
			board.red.piecesAt(24).should.equal(1);
			board.home.red.should.equal(1);
		}),
		it('should not be able to bear off if there are pieces outside of the home board', function(){
			var board = new Board();
			board.redState = {1: 1, 24:1};
			board.red.canBearOff(24, 2).should.not.be.ok;
			board.red.validMove(24, 2).should.not.be.ok;
		}),
		it('should not be able to bear off if there are pieces on the bar', function(){
			var board = new Board();
			board.redState = {1: 0, 24:1};
			board.bar.red = 1;
			board.red.canBearOff(24, 1).should.not.be.ok;
			board.red.progressPiece(24, 1);
			board.home.red.should.equal(0);
		}),
		it('should not be able to bear off a piece when another piece should be moved first', function(){
			var board = new Board();
			board.redState = {23:1, 24:1};
			board.red.validMove(24, 2).should.not.be.ok;
			board.red.validMove(23, 2).should.be.ok;
		}),
		it('should be able to bear off an exact move', function(){
			var board = new Board();
			board.redState = {22: 1, 23:1, 24:1};
			board.red.validMove(24, 2).should.not.be.ok;
			board.red.validMove(23, 2).should.be.ok;
			board.red.validMove(22, 2).should.be.ok;
		}),
		it('should not be able to bear off a piece when another piece could be moved without bearing off', function(){
			var board = new Board();
			board.redState = {21:0, 22:1, 24:1};
			board.red.validMove(24, 2).should.not.be.ok;
			board.red.validMove(22, 2).should.be.ok;
		}),
		it('should be able to bear off a piece with a larger number if it is the only piece remaining', function(){
			var board = new Board();
			board.redState = {21:0, 22:1, 24:1};
			board.red.validMove(22, 5).should.be.ok;
		}),
		it('should not be able to be able to move a piece which is on the home col', function(){
			var board = new Board()
			board.home = {red: 1, black: 3};
			board.red.validMove('home', 1).should.not.be.ok;
		})
	}),
	describe('#display-state', function(){
		it('should be able to produce a displayable summary of a board', function(){
			var board = new Board();
			board.redState = {2:2, 3:1};
			board.blackState = {23:1};
			board.home = {red: 1, black: 3};
			board.bar = {red: 2, black:4};
			assert.deepEqual(
				board.state(),
				[
					{position: 'bar', color:'red'},
					{position: 'bar', color:'red'},
					{position: 'bar', color:'black'},
					{position: 'bar', color:'black'},
					{position: 'bar', color:'black'},
					{position: 'bar', color:'black'},
					{position: 'home', color:'red'},
					{position: 'home', color:'black'},
					{position: 'home', color:'black'},
					{position: 'home', color:'black'},
					{position: 2, color:'red'},
					{position: 2, color:'red'},
					{position: 3, color:'red'},
					{position: 23, color:'black'}
				]
			)
		})
	})
})

