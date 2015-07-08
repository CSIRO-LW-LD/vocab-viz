var margin = 60,
	diameter = window.innerWidth;

if (window.innerWidth > window.innerHeight){
	diameter = window.innerHeight;
}
var color = d3.scale.linear()
		.domain([-1, 5])
		.range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
		.interpolate(d3.interpolateHcl);

var pack,
	svg,
	focus,
	circle,
	node,
	root_global,
	transition,
	text,
	details_opened = true;

initialiseOrUpdate();

/**
 * Catch event when user starts to type
 */

$('#arrow').click(function(){
	$(this)
		.css('transform', function(){ return details_opened ? 'rotate(0deg)' : 'rotate(180deg)'})
	$('#details').css('right', function(){ return details_opened ? '-480px' : '0'});
	details_opened = !details_opened;

});

/**
 *  This function will catch the event of a user changing the input #filter
 *  a list of parents will be created in order to identify which are the parents that match
 *  the string typed. If it matches, then it is added in order for it to work to deeper levels. 
 */
d3.select('#filter').on('input', function(){
	var input = String(this.value);
	var parents = []
	var broader_matches = 0;

	text.style('opacity', '0');
	text.filter(function(d){
		if(d.name.toLowerCase().indexOf(input.toLowerCase()) >= 0){
			parents.push(d.name.toLowerCase());
			broader_matches++;
			return true;
		}
		if (d.parent !== undefined){
			if (parents.indexOf(d.parent.name) >= 0){ 
				parents.push(d.name);
				return true;
			}	
		}
		
		return false;
	}).style('opacity', '1');
	console.log(parents)

	

	circle.style('display', 'none');
	var a = circle.filter(function(d){
		if(d.name.toLowerCase().indexOf(input.toLowerCase()) >= 0){
			// d.style('fill-opacity', 1);
			return true;
		}
		if (d.parent !== undefined){
			if (parents.indexOf(d.parent.name) >= 0){
				return true;
			}	
		}
		return false;
	}).style('display', 'block');

	console.log(a);
	if (broader_matches == 1){
		zoom(a.datum());	
	}else{
		zoom(root_global);
	}
	
	
});

function initialiseOrUpdate(){
	console.log('initialiseOrUpdate');

	pack = d3.layout.pack().padding(2)
		.size([diameter - margin, diameter - margin])
		.value(function(d) { return d.size; })

	if (svg === undefined){
		svg = d3.select("body").append("svg").attr("width", '100%')
			.attr("height", '100%')
		.append("g")
	}

	svg = d3.select("g")
		.attr("transform", "translate(" + diameter / 2 + "," + diameter / 2 + ")");
	
}
	

/**
 *  Resize function and event caught by d3.
 *  First it will find the dimension from the 
 */
function resize(){
	diameter = window.innerWidth
	if (window.innerWidth > window.innerHeight){
		diameter = window.innerHeight;
	}
	console.log(diameter)

	focus = root_global
	initialiseOrUpdate();

	zoomToRoot();
	transition.selectAll("text")
		.filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
			.style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
			.each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
			.each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
}

d3.select(window).on('resize', resize);

var initialiseWithData = function(error, root){
	if (error) throw error;

	root_global = root;
	focus = root;
	nodes = pack.nodes(root);
	var view;

	circle = svg.selectAll("circle")
			.data(nodes)
		.enter().append("circle")
			.attr("class", function(d) { return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root"; })
			.attr("data-title", function(d){ return d.name })
			.attr('data-parent-title', function(d){ return d.parent ? d.parent.name : null })
			.style("fill", function(d) { return d.children ? color(d.depth) : null; })
			.on("click", function(d) { 
				console.log(d.name);
				var class_value = d3.select(this).attr("class");
				if (focus !== d && class_value.indexOf("leaf") < 0){
					zoom(d);
					d3.event.stopPropagation();
				}else{
					if (class_value.indexOf("leaf") >= 0){
						d3.event.stopPropagation();
						alert("here a box will popup with useful information");
					}
				}
			});

	text = svg.selectAll("text")
			.data(nodes)
		.enter().append("text")
			.attr("data-title", function(d){ return d.name })
			.attr("class", "label")
			.style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
			.style("display", function(d) { return d.parent === root ? null : "none"; })
			.text(function(d) { return d.name; });

	node = svg.selectAll("circle,text");


	d3.select("body")
			.style("background", color(-1))
			.on("click", function() { zoom(root); });

	console.log(root);
	zoomToRoot();

	
}
function zoom(d) {
	var focus0 = focus; focus = d;

	transition = d3.transition()
			.duration(d3.event.altKey ? 7500 : 750)
			.tween("zoom", function(d) {
				var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
				return function(t) { zoomTo(i(t)); };
			});
		
	transition.selectAll("text")
		.filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
			.style("fill-opacity", function(d) { return d.parent === focus ? 1 : 0; })
			.each("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
			.each("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
}

function zoomTo(v) {
	var k = diameter / v[2]; view = v;
	node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
	circle.attr("r", function(d) { return d.r * k; });
}

function zoomToRoot(){
	zoomTo([root_global.x, root_global.y, root_global.r * 2 + margin]);
}
d3.json("data.json", initialiseWithData);

d3.select(self.frameElement).style("height", diameter + "px");

