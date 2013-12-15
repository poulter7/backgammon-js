var assert = require('assert')

function Board(bar, blackState, redState) {
	this.bar = typeof bar !== 'undefined' ? bar : {
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
	
Board.prototype = {
	get red(){
		var me = this
		return {
			canMovePieceAt: function(pos){
				return me.canMovePieceAt('red', pos)
			},
			canMoveToTarget: function(target){
				return me.canMoveToTarget('red', target)
			},
			placePiece: function(target){
				return me.placePiece('red', target)
			},
			liftPiece: function(target){
				return me.liftPiece('red', target)
			},
			piecesAt: function(target){
				return me.piecesAt('red', target)
			}
		}
	},
	get black(){
		var me = this
		return {
			canMovePieceAt: function(pos){
				return me.canMovePieceAt('black', pos)
			},
			canMoveToTarget: function(target){
				return me.canMoveToTarget('black', target)
			},
			placePiece: function(target){
				return me.placePiece('black', target)
			},
			liftPiece: function(target){
				return me.liftPiece('black', target)
			},
			piecesAt: function(target){
				return me.piecesAt('black', target)
			}
		}
	},
	get state(){
		return {
			red: this.redState,
			black: this.blackState
		}
	},
	moveRed: function(pos, step){
		this.progressPiece(pos, step)
	},
	moveBlack: function(pos, step){
		this.progressPiece(pos, step)
	},
	popRedBar: function(target){
		if (this.red.canMoveToTarget(target)){
			this.bar.red -= 1;
			this.red.placePiece(target)
		}
	},
	toString: function(){
		return 'Red: ' + JSON.stringify(this.redState) + '\nBlack: ' + JSON.stringify(this.blackState)
	},
	progressPiece: function(pos, step){
		var owner = undefined
		var delta = 0
		if (this.red.piecesAt(pos) > 0){
			owner = 'red'
			delta = step
		} else if (this.black.piecesAt(pos) > 0){
			owner = 'black'
			delta = -step
		}
		if (owner){
			target = pos + delta
			if (this[owner].canMoveToTarget(target)){
				this[owner].liftPiece(pos)
				this[owner].placePiece(target)
			}
		}

	},
	piecesAt: function(player, pos){
		var r = {
			red: this.state['red'][pos],
			black: this.state['black'][pos]
		}
		assert( !r.red || !r.black , 'cannot have red and black pieces on the same point\n'.concat(this.toString()))
		if (typeof r[player] === "undefined"){
			r[player] = 0;
		} 
		return r[player];
	},
	liftPiece: function(player, pos){
		console.log('lifting')
		this.state[player][pos] -= 1; 
	},
	placePiece: function(player, target){
		console.log('placing')

		if (this[player.opponent()].piecesAt(target) == 1){
			this.state[player.opponent()][target] = 0
			this.bar[player.opponent()] += 1
		}
		this.state[player][target] = this[player].piecesAt(target) + 1;
		console.log(this)
	},
	canMovePieceAt: function(player, pos){
		if (pos == 'bar'){
			return true
		} else {
			return this.bar[player] == 0
		}
	},
	canMoveToTarget: function(player, target){
		return this[player.opponent()].piecesAt(target) < 2
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
