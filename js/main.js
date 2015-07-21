var CURRENTENDPOINT = 'http://sissvoc.ereefs.info/sissvoc/ereefs';
var details_opened = true;
var input;
/**
 * Function to hide or show the details tab on the right
 * depending on the actual state
 */

$('#arrow').click(function(){
	toggleDetails();

});

function toggleDetails(){
	$('#arrow').css('transform', function(){ return details_opened ? 'rotate(0deg)' : 'rotate(180deg)'})
	
	$('#details').css('margin-right', function(){ return details_opened ? '-475px' : '0'});
	details_opened = !details_opened;
}

function findNodeAndParents(node){
	console.log(node.name);
	
	var children_found = false;

	// Iterate the children and _children (hidden ones)
	if (node.children || node._children){
		var children = node.children ? node.children : node._children; 
		
		for (var i = 0; i < children.length; i++){
			if (findNodeAndParents(children[i])){
				children_found = true;
			}
		}
		if (children_found){
			openNode(node);
			
		}else{
			collapseNode(node);
		}
	}
	/**
	 * Then check if the current node's name match the input partially or fully.
	 * If it matches, then it will be added to the stack. Due to the nature of this
	 * algorithm the first nodes to be checked are the leaves and then their parents.
	 *
	 * If it does not match, then it must return the value of children_found, in order
	 * to open push the parents to the stack as well.
	 */
	
	if (doesNodeNameContainInput(node)){
		
		openNode(node);
		
		return true;

	}else{
		return children_found;
	}
	
}



/**
 * node._children is used to collapse the children of that parent, so in this case
 * it is necessary to get these ._children to the .children attribute.
 */

function openNode(node){
	if(node._children){
		node.children = node._children;
		node._children = null;	
	}
}

function collapseNode(node){
	if(node.children){
		node._children = node.children;
		node.children = null;	
	}
}

function doesNodeNameContainInput(node){
	if (node.name.toLowerCase().indexOf(input.toLowerCase()) >= 0)
		return true;
	else
		return false;
}

/**
 *  This function will catch the event of a user changing the input #filter
 *  a list of parents will be created in order to identify which are the parents that match
 *  the string typed. If it matches, then it is added in order for it to work to deeper levels. 
 */
// d3.select('#filter').on('input', function(){
d3.select('#filter_button').on('click', filterElementByInput)
d3.select('body').on('keydown', filterElementByInput);

function filterElementByInput(){
	input = String(d3.select('#filter').property('value'));
	console.log(d3.event.keyCode);
	if(d3.event.keyCode != 13 && d3.event.keyCode != 0){
		return false;
	}
	if (input == ''){
		input = 'eReefs';
	}

	var parents = []
	var broader_matches = 0;

	findNodeAndParents(root);
	update(root);
	//call update on the stack

	var circle = d3.selectAll('g circle');
	circle.classed('filtered', false);
	circle.filter(function(d){
		if (input == '' || input == 'eReefs')
			return false;

		if(d.name.toLowerCase().indexOf(input.toLowerCase()) >= 0){
			console.log(d);
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
	}).classed('filtered', true);

	console.log('parents'+parents)

	var text = d3.selectAll('g text');
	text.style('opacity', '0.6');
	text.filter(function(d){
		
		if(d.name.toLowerCase().indexOf(input.toLowerCase()) >= 0){			
			return true;
		}
		if (d.parent !== undefined){
			if (parents.indexOf(d.parent.name) >= 0){ 
				return true;
			}	
		}
		
		return false;
	}).style('opacity', '1');
}

/**
 * Prepare the tree to be built
 */

var margin = {top: 20, right: 30, bottom: 20, left: 100},
    width = 1050 - margin.right - margin.left,
    height = 900 - margin.top - margin.bottom;

var i = 0,
    duration = 750,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("#visualisation").append("svg")
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

d3.select(self.frameElement).style("height", "900px");

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 180; });

  // Update the nodes.
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });
  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .attr('data-name', function(d){ return d.name })
      .on("click", click);

  nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) {

      	if(d.name.indexOf(' Group') >= 0){
  			return "rgb(85, 165, 255);";
  		}
      	if (d._children){
      		return "rgb(48, 180, 136);";
      	}
      	return '#fff';
      
      });

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
      .style("fill", function(d) {

      	if(d.name.indexOf(' Group') >= 0){
  			return "rgb(85, 165, 255);";
  		}
      	if (d._children){
      		return "rgb(48, 180, 136);";
      	}
      	return '#fff';
      
      });

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
function click(d){
 	if (d.children){
		d._children = d.children;
		d.children = null;
	}else{
		d.children = d._children;
		d._children = null;
	}

	/**
	 * if it is a group (generated by the clustering method), don't try to get information about it
	 */
	if (d.about !== undefined){
		$('#content').empty();
		
		
		var resourceUri = d.about;
		
		var promise = $.ajax({
					url : CURRENTENDPOINT + "/resource.json",
					data : {
						uri : resourceUri,
						_view : "all"
					},
					type : "GET"
				}).done(function(itemDetails){
					prepareToShowDetail(resourceUri, itemDetails, d);
				});

		
		//call sissvoc
	}
	

	if(!d.children && !d._children){

		
		if (!details_opened){
			toggleDetails();
		}
	}
	update(d);
}

function prepareToShowDetail(resourceUri, itemDetails, node){
	console.log();
	var prefLabel = node.name;
		
	if (prefLabel.indexOf(',') >= 0){
		var prefLabel = node.name.split(", ");	
	}
	var details = renderSearchResultItem(resourceUri, processSkosLabel(prefLabel), itemDetails);
	$('#content').append(details);
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
		
		/**
		 * Generate the name correctly depending if it is an array or an single string
		 */
		var name;
		if (typeof object['prefLabel'] === 'string' || object['prefLabel'] instanceof String){
			name = object['prefLabel'];
		}else{
			name = object['prefLabel'].join(', ');
		}

		var current_object = {'name': name, 'about': object['_about'], 'children': []}; // creates new object to receive the elements

		/**
		 * if the element has member (children), then it will call the method recursively
		 * and then with the children done it will push the children and its children to
		 * the array.
		 */
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
		}else{
			

			current_object['children'] = cluster(current_object['children']);
		}

		return current_object;

	}else{
		console.log(object);
		return null 
	}
}

/**
 * Function to cluster information when there are too many children inside
 * a single node.
 */

function cluster(children){
	var MAX_CHILDREN = 14;
	var result = [];
	children.sort(function(a, b){
				if (a.name < b.name)
					return -1;
				if (a.name > b.name)
					return 1;
				return 0;
			});
	if (children.length > MAX_CHILDREN){
		var parents = Math.ceil(children.length/MAX_CHILDREN); // get how many parents there will be.
		
		

		for (var i = 0; i < parents; i++){ // for each parent, create its children
			var group = {};
			var begin = i*MAX_CHILDREN;
			var end = begin+MAX_CHILDREN-1;
			
			end = end < children.length ? end : children.length-1; // check to avoid inexistent position
			group['name'] = children[begin].name.charAt(0).toUpperCase()+'-'+children[end].name.charAt(0).toUpperCase() + ' Group'; // creates the name for the cluster
			group['children'] = children.slice(begin, end+1); //make a copy of the array
			group['children'].sort(function(a, b){
				if (a.name < b.name)
					return -1;
				if (a.name > b.name)
					return 1;
				return 0;
			});
			// console.log(children[begin].name);
			// console.log(children[end].name);
			// console.log(group);
			result.push(group);
		}
		
		// Cluster the cluster of parents when there are more than the maximum allowed.
		if (parents > MAX_CHILDREN){
			result = cluster(result);
		}

		return result;


	}else{
		return children;	
	}
	
	}

