class DistanceGoals {

	constructor() {
		var dg = this;
		this.settings = {
			selectors: {
				fileselector: "#gpxfile",
				fileconfirm: "#gpxconfirm",
				gpxcontainer: "#gpxlist"
			}
		};

		this.uploadedGPXFiles = [];
		this.totalDistance = 0;
		this.totalElevation = 0;
		this.avgSpeed = 0;

		this.initMap();

		jQuery(this.settings.selectors.fileconfirm).on('click', function(event) {
			event.preventDefault();

			var gpx = new SuppliedGPX(dg.settings.selectors.fileselector, dg.settings.selectors.gpxcontainer);
			dg.uploadedGPXFiles.push(gpx);

			return false;
		});
	}

	initMap() {
		var map = L.map('map').setView([51.505, -0.09], 13);

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

		L.marker([51.5, -0.09]).addTo(map)
			.bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
			.openPopup();
	}

	addToDistance(amount) {
		this.distance += amount;
	}

	addToElevation(amount) {
		this.elevation += amount;
	}

	recalculateSpeed() {
		var total = 0;
		this.uploadedGPXFiles.forEach(function(ele) {
			total += ele.avgSpeed;
		});

		this.avgSpeed = total / this.uploadedGPXFiles.length;
	}
}

var dg;
jQuery(document).ready(function() {
	dg = new DistanceGoals();
})