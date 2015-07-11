var details_opened = true;
/**
 * Function to hide or show the details tab on the right
 * depending on the actual state
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
			if(parents.indexOf(d.name.toLowerCase) < 0){
				parents.push(d.name.toLowerCase());
				broader_matches++;
			}
			
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

	

	circle.style('opacity', '0.2');
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
	}).style('opacity', '1');

	console.log(a);
	if (broader_matches == 1 || parents.length == 1){
		zoom(a.datum());	
	}else{
		zoom(root_global);
	}
	
	
});
var margin = {top: 20, right: 120, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 800 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function initialise(data, error){
  if (error) throw error;

  root = data;
  root.x0 = height / 2;
  root.y0 = 0;

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);
  update(root);
}

d3.select(self.frameElement).style("height", "800px");

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes…
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", click);

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeEnter.append("text")
      .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select("circle")
      .attr("r", 4.5)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  nodeUpdate.select("text")
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select("circle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      });

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}


/**
 *  Prepare data to be inserted in array. This is just a workaround
 */

var data_processed = {};

$.get(
    "http://sissvoc.ereefs.info/sissvoc/ereefs/collection.json?_page=0&_pageSize=50",
    {},
    prepareData
);

function prepareData(data){
	console
	var data_processed = {'name': 'eReefs', 'children': []};

	for(var i = 0; i < data['result']['items'].length; i++){
		var child = navigate(data['result']['items'][i]);
		if (child != null){
			data_processed['children'].push(child);
		}else{
			console.log(data['result']['items'][i]);
		}

	}

	console.dir(data_processed);
	initialise(data_processed, null);
}

/**
 * Recursive function which navigates the objects trying to find children
 * and returning them in the right format. It skips child which does not
 * have prefLabel.
 */

function navigate(object){
	//console.dir(object);
	if (typeof object === 'string' || object instanceof String){
		return null;
	}
	if ('prefLabel' in object){
		var current_object = {'name': object['prefLabel'], 'children': []};

		if('member' in object){
			for(var j = 0; j < object['member'].length; j++){
				var child = navigate(object['member'][j]);
				if (child !== null){
					current_object['children'].push(child);	
				}
				
			}
		}
		if (current_object['children'].length == 0){
			delete current_object['children'];
		}
		return current_object;

	}else{
		return null 
	}
}



