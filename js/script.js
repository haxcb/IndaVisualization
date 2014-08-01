var width = 800,
	height = 500,
	radius = 5;

var force = d3.layout.force()
	.charge(-500)
	.linkDistance(50)
	.size([width, height]);

var svg = d3.select(".container").append("svg")
	.attr("width", width)
	.attr("height", height);
		
var dataNodes = [],
	dataLinks = [];


d3.csv("http://www.sfu.ca/~ssumal/Inda/data/indaData.csv", function(csv) { 
    return {
    	"Name": csv.Name,
      	"AKA": csv.AKA,
        "FamilyName": csv.FamilyName,
        "Importance": +csv.Importance,
        "Gender": csv.Gender,
        "ParentOf": d3.csv.parseRows(csv.ParentOf.replace(/\s*;\s*/g, ","))[0],
        "SpouseOrBetrothed": csv.SpouseOrBetrothed,
        "InloveWith": d3.csv.parseRows(csv.InloveWith.replace(/\s*;\s*/g, ","))[0],
        "ChildOf": d3.csv.parseRows(csv.ChildOf.replace(/\s*;\s*/g, ","))[0],
        "Siblings": d3.csv.parseRows(csv.Siblings.replace(/\s*;\s*/g, ","))[0],
        "AcademyClassmates": d3.csv.parseRows(csv.AcademyClassmates.replace(/\s*;\s*/g, ","))[0],
        "CousinsWith": d3.csv.parseRows(csv.CousinsWith.replace(/\s*;\s*/g, ","))[0],
        "RunnerFor": csv.RunnerFor,
        "PimRyala":  +csv.PimRyala,
        "KodlMarines":  +csv.KodlMarines,
        "AcademyTeacherFor":  d3.csv.parseRows(csv.AcademyTeacherFor.replace(/\s*;\s*/g, ","))[0],
    };
}, function(error, rows){
	if(window.console){
		window.console.log(rows);
		console.log(JSON.stringify(error, null, "\t"));
	}
});
	
