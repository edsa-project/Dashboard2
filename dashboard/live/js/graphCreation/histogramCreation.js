/**
 * Creates the histogram objects
 */ 

// creates the location histogram
var dateHistogram = new Histogram({
    histogramContainer: "#analytics-chart-jobs-by-dates",
    histogramName:      "date",
    xAxisType:          "timestamp",
    zoomable:           true,
    margin: { top: 50, left: 80, bottom: 30, right: 30 }
});

// creates the skill histogram
var skillHistogram = new Histogram({
    histogramContainer: "#analytics-chart-skills-by-frequency",
    histogramName:      "skill"
});

// creates the location histogram
var locationHistogram = new Histogram({
    histogramContainer: "#analytics-chart-location-by-frequency",
    histogramName:      "location"
});
