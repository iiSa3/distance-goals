class SuppliedGPX {

	constructor(fileuploadselector, displaycontainer = null) {
		this.readFile(fileuploadselector, displaycontainer);

		this.distance = 0;
		this.elevation = 0;
		this.avgSpeed = 0;
		this.name = "";
	}

	readFile(selector, displaycontainer = null) {
		
		var file = jQuery(selector)[0].files[0];
		if (!file) {
			return;
		}

		var reader = new FileReader();
		var sgpx = this;

		reader.onload = function(e) {
			var contents = e.target.result;
			sgpx.parseGPX(contents);

			dg.addToDistance(sgpx.distance);
			dg.addToElevation(sgpx.elevation);
			dg.recalculateSpeed();

			dg.displayGoalMap(sgpx);

			if(displaycontainer)
				sgpx.display(displaycontainer);
		};

		reader.readAsText(file);
	}

	parseGPX(contents) {
		var parser = new gpxParser();
		parser.parse(contents);

		var totalDistance = 0;
		var totalElevation = 0;
		if(parser.tracks != null) {
			for (var i = parser.tracks.length - 1; i >= 0; i--) {
				totalDistance += Math.round((parser.tracks[i].distance.total/1000) * 100) / 100;
				totalElevation += Math.round(parser.tracks[i].elevation.pos * 100) / 100;
			}
		}

		if(parser.metadata.name != null)
			this.name = parser.metadata.name;
		else if(parser.tracks != null)
			this.name = parser.tracks[0].name;

		this.distance = totalDistance;
		this.elevation = totalElevation;
		this.avgSpeed = 0;
		return true;
	}

	display(container) {
		var html = "<li class='supplied-gpx'> \
			<h2>" + this.name + "</h2> \
			<ul class='supplied-gpx-stats clearfix'> \
				<li><strong>Distance:</strong> " + this.distance + " kilometers</li> \
				<li><strong>Elevation:</strong> " + this.elevation + " metres</li> \
				<li><strong>Average Speed:</strong> " + this.avgSpeed + "mph</li> \
			</ul> \
		</li>";

		jQuery(container).append(html);
	}
}