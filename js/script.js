var width = 1000,
	height = 800,
	radius = 5;
	
var orange = d3.rgb(255, 161, 51);	

var force = d3.layout.force()
	.charge(-500)
	.linkDistance(200)
	.size([width, height]);

var svg = d3.select(".container").append("svg")
	.attr("width", width)
	.attr("height", height);
		
var nodes = [],
    links = [];


function createLinks(relationshipType, people, sourceIndex) {
    if(people && people.length > 0) {
        for(var p in people) {
            var targetIndex = -1;
            for(var j in nodes) {
                
                if(people[p] == (nodes[j].Name + " " + nodes[j].FamilyName + " (" + nodes[j].AKA + ")") )  {
                    targetIndex = nodes[j].Index;
                    break;
                }
                else if (people[p] == (nodes[j].Name + " " + nodes[j].FamilyName)) {
                    targetIndex = nodes[j].Index;
                    break;
                }
                else if (people[p] == nodes[j].Name) {
                    targetIndex = nodes[j].Index;
                    break;
                }
            }
            if (targetIndex != -1) {
                links.push({ "type": relationshipType, 
                         "target": +targetIndex, 
                         "source": +sourceIndex });
            }
        };
    } 
}

function csvToArr(csvData) {
	return d3.csv.parseRows(csvData.replace(/\s*;\s*/g, ","))[0];
}

d3.csv("http://www.sfu.ca/~ssumal/Inda/data/indaData.csv", function(csv, index) { 

    nodes.push({"Index": index,
                "Name": csv.Name,
                "AKA": csv.AKA,
                "FamilyName": csv.FamilyName,
                "Importance": +csv.Importance,
                "Gender": csv.Gender });

    return {
        "Index": index,
    	"Name": csv.Name,
      	"AKA": csv.AKA,
        "FamilyName": csv.FamilyName,
        "Importance": +csv.Importance,
        "Gender": csv.Gender,
        "ParentOf": csvToArr(csv.ParentOf),
        "SpouseOrBetrothed": csvToArr(csv.SpouseOrBetrothed),
        "InloveWith": csvToArr(csv.InloveWith),
        "ChildOf": csvToArr(csv.ChildOf),
        "Siblings": csvToArr(csv.Siblings),
        "AcademyClassmates": csvToArr(csv.AcademyClassmates),
        "CousinsWith": csvToArr(csv.CousinsWith),
        "RunnerFor": csvToArr(csv.RunnerFor),
        "PimRyala":  csvToArr(csv.PimRyala),
        "KodlMarines": csvToArr(csv.KodlMarines),
        "AcademyTeacherFor": csvToArr(csv.AcademyTeacherFor),
    };
	
}, function(error, rows){
    console.log(rows);

    for(var i in rows) {
        createLinks("ParentOf", rows[i].ParentOf,i);
        createLinks("SpouseOrBetrothed", rows[i].SpouseOrBetrothed,i);
        createLinks("InloveWith", rows[i].InloveWith,i);
        createLinks("ChildOf", rows[i].ChildOf,i);
        createLinks("Siblings", rows[i].Siblings,i);
        createLinks("AcademyClassmates", rows[i].AcademyClassmates,i);
        createLinks("AcademyTeacherFor", rows[i].AcademyTeacherFor,i);
        createLinks("CousinsWith", rows[i].CousinsWith,i);
        createLinks("RunnerFor", rows[i].RunnerFor,i);
        createLinks("PimRyala", rows[i].PimRyala,i);
        createLinks("KodlMarines", rows[i].KodlMarines,i);
    }
    force
        .nodes(nodes)
        .links(links)
        .start();

    var linkItems = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("class", "link")
        .style("stroke-width", function(d) { return Math.sqrt(d.value); });

    var nodeItems = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("r", radius)
        .call(force.drag);
            
    nodeItems.append("circle")      
        .attr("r", radius);
    
    nodeItems.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
		.style("fill", orange)
        .text(function(d) {return d.Name});

    force.on("tick", function() {
        linkItems.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
   
        nodeItems.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .attr("cx", function(d) { return d.x = Math.max(radius*2, Math.min(width - radius*2, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius*2, Math.min(height - radius*2, d.y)); });
    });
	

});


    

