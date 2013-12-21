var assert = require('assert')
var _ = require('underscore')

function Board(bar, blackState, redState) {
	this.bar = typeof bar !== 'undefined' ? bar : {
		black: 0,
		red: 0
	};
	this.home = typeof bar !== 'undefined' ? bar : {
		black: 0,
		red: 0
	};
	this.blackState = typeof blackState !== 'undefined' ? blackState : {};
	this.redState = typeof redState !== 'undefined' ? redState : {};
}
String.prototype.opponent = function(){
	if (this == 'red'){
		return 'black'
	} else if (this == 'black'){
		return 'red'
	}
}

function Player(color, board) {
	this.color = color;
	this.board = board;
}
Player.prototype = {
	get state() {
		if (this.color == 'red'){
			return this.board.redState
		} else {
			return this.board.blackState
		}
	},
	get opponent(){
		return this.board[this.color.opponent()]
	},
	canMovePieceAt: function(pos){
		return this.board.canMovePieceAt(this, pos)
	},
	canMoveToTarget: function(target){
		return this.board.canMoveToTarget(this, target)
	},
	canBearOff: function(pos, roll){
		return this.board.canBearOff(this, pos, roll)
	},
	placePiece: function(target, roll){
		return this.board.placePiece(this, target, roll)
	},
	liftPiece: function(target){
		return this.board.liftPiece(this, target)
	},
	piecesAt: function(target){
		return this.board.piecesAt(this, target)
	},
	validMove: function(pos, roll){
		return this.board.validMove(this, pos, roll)
	},
	targetPosition: function (pos, roll){
		return this.board.targetPosition(this, pos, roll)
	},
	popBar: function(roll){
		return this.board.popBar(this, roll)
	}

}
	
Board.prototype = {
	get red(){
		return new Player('red', this)
	},
	get black(){
		return new Player('black', this)
	},
	moveRed: function(pos, roll){
		this.progressPiece(pos, roll)
	},
	moveBlack: function(pos, roll){
		this.progressPiece(pos, roll)
	},
	validMove: function(player, pos, roll){
		var target = player.targetPosition(pos, roll)
		var validIfBearOff = !this.wouldBearOff(target) || (player.canBearOff(pos, roll))
		return (player.canMoveToTarget(target) && 
			player.canMovePieceAt(pos) &&
			validIfBearOff
		)
	},
	popBar: function(player, roll) {
		target = player.color == 'red' ? roll : 25 - roll
		if (player.canMoveToTarget(target)){
			this.bar[player.color] -= 1;
			player.placePiece(target, roll)
		}
	},
	toString: function(){
		return 'Red: ' + JSON.stringify(this.redState) + '\nBlack: ' + JSON.stringify(this.blackState)
	},
	targetPosition: function(player, pos, roll){
		if (player.color == 'red'){
			return pos + roll
		} else if (player.color == 'black'){
			return pos - roll
		}
	},
	progressPiece: function(pos, roll){
		var player = undefined
		if (this.red.piecesAt(pos) > 0){
			owner = this.red
		} else if (this.black.piecesAt(pos) > 0){
			owner = this.black
		}
		if (owner){
			var target = owner.targetPosition(pos, roll)
			if (owner.validMove(pos, roll)){
				owner.liftPiece(pos)
				owner.placePiece(target, roll)
			}
		}

	},
	piecesAt: function(player, pos){
		var r = {
			red: this.red.state[pos],
			black: this.black.state[pos],
		}
		assert( !this.red.state[pos]|| !this.black.state[pos], 'cannot have red and black pieces on the same point\n'.concat(this.toString()))

		if (typeof player.state[pos] === "undefined"){
			player.state[pos] = 0;
		} 
		return player.state[pos];
	},
	liftPiece: function(player, pos){
		player.state[pos] -= 1; 
	},
	placePiece: function(player, target, roll){
		if (this.wouldBearOff(target)){
			// bearing off
			this.home[player.color] += 1
		} else {
			if (player.opponent.piecesAt(target) == 1){
				player.opponent.state[target] = 0
				this.bar[player.color.opponent()] += 1
			}
			player.state[target] = player.piecesAt(target) + 1;
		}
	},
	wouldBearOff: function(target){
		return (target <= 0 || target > 24)
	},
	canBearOff: function(player, pos, roll){
		var nonHomeIndices = player.color == 'red'? _.range(1, 19) : _.range(7, 25)
		var homeIndices = player.color == 'red'? _.range(19, 25) : _.range(1, 7)
		
		var nonHomeValues = _.values(_.pick(player.state, nonHomeIndices))

		var homeSubBoard = _.pick(player.state, homeIndices)

		var homeValues = []

		for (var key in homeSubBoard){
			var o = homeSubBoard[key]
			if (o){
				homeValues.push(key)
			}

		}
		f = player.color == 'red' ? _.min : _.max
		furthestPip = f(homeValues)


		return _.size(nonHomeValues) == 0 && this.bar[player.color] == 0 && furthestPip == pos
			
	},
	canMovePieceAt: function(player, pos){
		if (pos == 'bar'){
			return true
		} else {
			return this.bar[player.color] == 0
		}
	},
	canMoveToTarget: function(player, target){
		return player.opponent.piecesAt(target) < 2
	}
}

var initialBoard = function() {
	var b = new Board()
	b.blackState = {
		24: 2,
		13: 5,
		8: 3,
		6: 5,
	}
	b.redState = {
		1: 2,
		12: 5,
		17: 3,
		19: 5,
	}
	return b
}

module.exports.Board = Board;
module.exports.initialBoard = initialBoard;
