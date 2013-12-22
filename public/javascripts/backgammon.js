window.onload = function(){
	px = {
		1: 625,
		2: 575,
		3: 525,
		4: 475,
		5: 425,
		6: 375,
		7: 275,
		8: 225,
		9: 175,
		10: 125,
		11: 75,
		12: 25,
		24: 625,
		23: 575,
		22: 525,
		21: 475,
		20: 425,
		19: 375,
		18: 275,
		17: 225,
		16: 175,
		15: 125,
		14: 75,
		13: 25,
	}
	var pieces = d3.select("#pieces");
	console.log(pieces);
	radius = 22;
	buffer = 2;

	console.log('pieces');
	pieces = d3.select("#pieces").selectAll("circle").data([
			{location: 1, color: 'Red'},
			{location: 2, color: 'Red'},
			{location: 4, color: 'Black'},
			{location: 4, color: 'Black'}
	]);
	cx = function(p){
		console.log('cx', p);
		return px[p.location];
	}
	cy = function(p, n){
		console.log('cy', p);
		return radius + buffer;
	}
	pieces.enter()
		.append("circle")
		.attr("r", radius)
		.classed("red", function(d){ return d.color == "Red"})

	pieces
		.attr("cx", cx)
		.attr("cy", cy)


}
