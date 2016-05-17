/**
 * Creates the histogram objects
 */ 

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
