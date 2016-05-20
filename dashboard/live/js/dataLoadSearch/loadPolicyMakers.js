/**********************************************
 * Loads the graphs for the Policy Makers page
 */ 

$.ajax({
    type: "GET",
    url: "http://pankretas.ijs.si:8040/get_number_of_jobs_by_dates",
    dataType: 'jsonp',
    cache: false,
    success: function (json) {
        
        var DateArray = json.get_number_of_jobs_by_dates;
        var jobDateNameFreq = [];
        
        var numberOfDates = DateArray.length;
        for (var DateN = 1; DateN < numberOfDates; DateN++) {
            var jobDate = DateArray[DateN];
            jobDateNameFreq.push({ name: new Date(jobDate[0]), value: jobDate[1] });
        }
        
        // create the histogram
        var dataset = { name: "Job Posts By Dates", yAttribute: "Number of jobs", data: jobDateNameFreq };
        dateHistogram.setData(dataset);

    //    $('#analytics-chart-jobs-by-dates').highcharts({
    //        chart: {
    //            type: 'spline',
    //            zoomType: 'x'
    //        },
    //        title: {
    //            text: 'Job Posts By Dates'
    //        },
    //        xAxis: {
    //            type: 'datetime'
    //        },
    //        yAxis: {
    //            title: {
    //                text: 'Number of jobs'
    //            }
    //        },
    //        legend: {
    //            enabled: false
    //        },
    //        plotOptions: {
    //            spline: {
    //                marker: {
    //                    enabled: true
    //                }
    //            }
    //        },
    //        plotOptions: {
    //            area: {
    //                fillColor: {
    //                    linearGradient: {
    //                        x1: 0,
    //                        y1: 0,
    //                        x2: 0,
    //                        y2: 1
    //                    },
    //                    stops: [
    //                        [0, Highcharts.getOptions().colors[2]],
    //                        [1, Highcharts.Color(Highcharts.getOptions().colors[2]).setOpacity(0).get('rgba')]
    //                    ]
    //                },
    //                marker: {
    //                    radius: 2
    //                },
    //                lineWidth: 1,
    //                color: Highcharts.getOptions().colors[2],
    //                states: {
    //                    hover: {
    //                        lineWidth: 1
    //                    }
    //                },
    //                threshold: null
    //            }
    //        },
            
    //        series: [{
    //                type: 'column',
    //                name: 'jobs',
    //                data: json.get_number_of_jobs_by_dates
    //            }]
    //    });

    }
});

$.ajax({
    type: "GET",
    url: "http://pankretas.ijs.si:8040/get_number_of_jobs_by_location_name",
    dataType: 'jsonp',
    cache: false,
    success: function (json) {
        var LocationArray = json.get_number_of_jobs_by_location_name;
        var jobLocationNameFreq = [];

        var numberOfLocations = LocationArray.length;
        var upperBoundLocation = 50;
        var sLimit = numberOfLocations < upperBoundLocation ? numberOfLocations : upperBoundLocation;
        for (var LocN = 0; LocN < sLimit; LocN++) {
            var jobLoc = LocationArray[LocN];
            jobLocationNameFreq.push({ name: jobLoc[0], value: jobLoc[1] });
        }

        // create the histogram
        var dataset = { name: "Job Posts By Locations", yAttribute: "Number of jobs", data: jobLocationNameFreq };
        locationHistogram.setData(dataset);
    }
});

$.ajax({
    type: "GET",
    url: "http://pankretas.ijs.si:8040/get_number_of_jobs_by_skill",
    dataType: 'jsonp',
    cache: false,
    success: function (json) {
        var jpSkills = json.get_number_of_jobs_by_skill;
        var jobSkillNameFreq = [];

        var numberOfSkills = jpSkills;
        var upperBoundSkills = 50;
        var sLimit = numberOfSkills < sLimit ? numberOfSkills : upperBoundSkills;
        for (var SklN = 0; SklN < sLimit; SklN++) {
            var JFPair = jpSkills[SklN];
            jobSkillNameFreq.push({ name: JFPair[0], value: JFPair[1] });
        }
        // create the histogram
        var dataset = { name: "Job Posts By Skills", yAttribute: "Number of jobs", data: jobSkillNameFreq };
        skillHistogram.setData(dataset);

        // set the info-container
        setInfoContainer(jobSkillNameFreq);
    }
});

function setInfoContainer(jobSkillNameFreq) {
    var text = "";
    // set the description
    text += "<b>Top 50 skills:</b><div style='text-align:justify;'><ol>";
    for (var SkillN = 0; SkillN < jobSkillNameFreq.length; SkillN++) {
        var skillFreq = jobSkillNameFreq[SkillN];
        text += "<a onclick=\"queryMe(\'" + skillFreq.name + "\')\">" + skillFreq.name + "</a>" + " (" + skillFreq.value + ")"
        if (SkillN != jobSkillNameFreq.length - 1) { text += ", " };
    }
    text += "</ol></div></br>";
    $("#info-container").html(text);
}