class SuppliedGPX {

	constructor(fileuploadselector, displaycontainer = null) {
		this.distance = 0;
		this.elevation = 0;
		this.time = 0;
		this.name = "";

		this.readFile(fileuploadselector, displaycontainer);
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
			var res = sgpx.parseGPX(contents);

			if(res) {
				dg.addToDistance(sgpx.distance);
				dg.addToElevation(sgpx.elevation);
				dg.addToTime(sgpx.time);

				dg.displayGoalMap(sgpx);

				if(displaycontainer)
					sgpx.display(displaycontainer);
			}
		};

		reader.readAsText(file);
	}

	parseGPX(contents) {
		var parser = new gpxParser();
		parser.parse(contents);

		var totalDistance = 0;
		var totalElevation = 0;
		if(parser.tracks != null && parser.tracks.length > 0) {
			for (var i = parser.tracks.length - 1; i >= 0; i--) {
				totalDistance += (parser.tracks[i].distance.total/1000);
				totalElevation += parser.tracks[i].elevation.pos;
			}
		} else {
			alert("Unable to find any tracks in this file. Are you sure it is a GPX file?");
			return false;
		}

		var times = parser.xmlSource.getElementsByTagName('time');

		var start = Date.parse(times[0].innerHTML);
		var end = Date.parse(times[times.length - 1].innerHTML);

		var diff = (end-start) / 1000; // Time difference in seconds

		if(parser.metadata.name != null)
			this.name = parser.metadata.name;
		else if(parser.tracks != null)
			this.name = parser.tracks[0].name;

		this.distance = totalDistance;
		this.elevation = totalElevation;
		this.time = diff;
		return true;
	}

	display(container) {
		var html = "<li class='supplied-gpx'> \
			<h2>" + this.name + "</h2> \
			<ul class='supplied-gpx-stats clearfix'> \
				<li><strong>Distance:</strong> " + Math.round((this.distance*100)) / 100 + " kilometers</li> \
				<li><strong>Elevation:</strong> " + Math.round(this.elevation*100)/100 + " metres</li> \
				<li><strong>Time:</strong> " + dg.formatTime(this.time) + "</li> \
			</ul> \
		</li>";

		jQuery(container).append(html);
	}
}