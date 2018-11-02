class SuppliedGPX {
	constructor(fileuploadselector, displaycontainer = null) {
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
			sgpx.parseGPX(contents);

			dg.addToDistance(this.distance);
			dg.addToElevation(this.elevation);
			dg.recalculateSpeed();

			if(displaycontainer)
				sgpx.display(displaycontainer);
		};

		reader.readAsText(file);
	}

	parseGPX(contents) {
		this.distance = 75;
		console.log("Init " + this.distance);
		this.elevation = 500;
		this.avgSpeed = 17;

		console.log(contents);
		return true;
	}

	display(container) {
		console.log(this.distance);
		var html = "<li class='supplied-gpx'> \
			<h2>Example Ride</h2> \
			<ul class='supplied-gpx-stats clearfix'> \
				<li><strong>Distance:</strong> " + this.distance + " miles</li> \
				<li><strong>Elevation:</strong> " + this.elevation + " metres</li> \
				<li><strong>Average Speed:</strong> " + this.avgSpeed + "mph</li> \
			</ul> \
		</li>";

		jQuery(container).append(html);
	}
}