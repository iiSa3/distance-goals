class Graph {

this.points = [];

addPoint(distance,time) {
  this.points.push({
    x: distance,
    y: time
  });
}

}

window.onload = function () {
var chart = new CanvasJS.Chart("chartContainer", {
  animationEnabled: true,
  theme: "light1",
  title:{
    text: "Distance travelled over time."
  },
  axisY:{
    includeZero: false
  },
  data: [{
    type: "line",
    dataPoints: this.points
  }]
});
chart.render();

}
