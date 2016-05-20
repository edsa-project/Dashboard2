/*******************************************************
 * Search functions for the Policy Makers.
 */ 



/**
 * Query the selected skill. Used in the info-container.
 */ 
function queryMe(skillName) {
    console.log(skillName)
    $("#skill-search").tagsinput("removeAll");
    $("#location-search").tagsinput("removeAll");
    
    $("#skill-search").tagsinput("add", { name: skillName });
    searchOptions("Policy Makers");
}

/**
 * search success Function for Policy makers
 */ 
function searchSuccess(json) {
    var jobpoints = [];
    var jobpointswithtime = [];
    //{ location: [ number, number ], timestamp: number, title: string, skillset: [string, string, string], id: string  }   
    var jobsAllInfo = [];
    var jobResults = json.jp_result;
    for (var JobN = 0; JobN < jobResults.length; JobN++) {
        var job = jobResults[JobN];
        var timestamp = Date.parse(job.datePosted);
        var location = [job.long, job.lat];
        jobpoints.push({ location: location });
        jobpointswithtime.push({ location: location, timestamp: timestamp });
        jobsAllInfo.push({ location: location, timestamp: timestamp, skillset: job.skills, id: job.jobPostingUri });
    }
    
    
    //-------------------------------------------------------
    // Draws the job clusters on the map
    //-------------------------------------------------------
    europe.DrawPoints(jobsAllInfo);
    // remove the .loader
    $("#map-load-container").removeClass("loading");
    
    //-------------------------------------------------------
    // Calculates the number-of-jobs per date histogram
    //-------------------------------------------------------
    
    // get the job dates by frequency
    var jobsDateFreq = {};
    for (var JobN = 0; JobN < jobResults.length; JobN++) {
        var jobDateFull = new Date(jobResults[JobN].datePosted);
        var jobDateShort = new Date(jobDateFull.getFullYear(), jobDateFull.getMonth(), jobDateFull.getDate());
        
        if (jobsDateFreq[jobDateShort] != null) {
            jobsDateFreq[jobDateShort] += 1;
        } else {
            jobsDateFreq[jobDateShort] = 1;
        }
    }
    // prepare the time for sorting
    var dateKeys = [];
    var dateJPSortedKeys = {};
    for (var dKey in jobsDateFreq) {
        var dateKeyJPTime = Date.parse(dKey);
        dateKeys.push(dateKeyJPTime);
        dateJPSortedKeys[dateKeyJPTime] = dKey;
    }
    dateKeys.sort();
    
    // construct the sorted list of lobs and time
    var jobsByDates = [];
    var jobDateNameFreq = [];
    for (var DateN = 0; DateN < dateKeys.length; DateN++) {
        var dkeyJPT = dateKeys[DateN];
        var dKey = dateJPSortedKeys[dkeyJPT];
        jobDateNameFreq.push({ name: new Date(Date.parse(dKey)), value: jobsDateFreq[dKey] });
        jobsByDates.push([Date.parse(dKey), jobsDateFreq[dKey]]);
    }
    console.log(jobDateNameFreq);

    var numberOfJobs = jobsAllInfo.length;
    // update the statistics for job posts
    $('#infoStatJobPosts').html("<b>" + numberOfJobs + "</b>");
    
    // TODO: creates the histogram for the date - number of jobs data
    // create the histogram
    var dataset = { name: "Job Posts By Dates", yAttribute: "Number of jobs", data: jobDateNameFreq };
    dateHistogram.setData(dataset);

    //// TODO: replace this histogram with one from d3
    ////////////////////////////////////////////////////
    //$('#analytics-chart-jobs-by-dates').highcharts({
    //    chart: {
    //        zoomType: 'x'
    //    },
    //    title: {
    //        text: 'Job Posts By Dates'
    //    },
    //    xAxis: {
    //        type: 'datetime',

    //    },
    //    yAxis: {
    //        title: {
    //            text: 'Numbef of jobs'
    //        }
    //    },
    //    legend: {
    //        enabled: false
    //    },
    //    plotOptions: {
    //        area: {
    //            fillColor: {
    //                linearGradient: {
    //                    x1: 0,
    //                    y1: 0,
    //                    x2: 0,
    //                    y2: 1
    //                },
    //                stops: [
    //                    [0, Highcharts.getOptions().colors[2]],
    //                    [1, Highcharts.Color(Highcharts.getOptions().colors[2]).setOpacity(0).get('rgba')]
    //                ]
    //            },
    //            marker: {
    //                radius: 2
    //            },
    //            lineWidth: 1,
    //            color: Highcharts.getOptions().colors[2],
    //            states: {
    //                hover: {
    //                    lineWidth: 1
    //                }
    //            },
    //            threshold: null
    //        }
    //    },
        
    //    series: [{
    //            type: 'column',
    //            name: 'jobs',
    //            data: jobsByDates
    //        }]
    //});
    //////////////////////////////////////////////////

    //-------------------------------------------------------
    // Calculates the skill frequency histogram
    //-------------------------------------------------------

    // get the skill frequency
    var skillsFreq = {};
    for (var JobN = 0; JobN < jobResults.length; JobN++) {
        var jobSkills = jobResults[JobN].skills;
        for (var SklN = 0; SklN < jobSkills.length; SklN++) {
            var skill = jobSkills[SklN];
            if (skillsFreq.hasOwnProperty(skill)) {
                skillsFreq[skill] += 1;
            } else {
                skillsFreq[skill] = 1;
            }
        }
    }
    // sort skills by it's frequency
    var jobSkills = [];
    for (var key in skillsFreq) {
      jobSkills.push([key, skillsFreq[key]]);
    }
    jobSkills.sort(function (a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });

    // create an array of skill-name, frequency pairs
    var numberOfSkills = jobSkills.length;

    //var jobSkillName = [];
    //var jobSkillFreq = [];
    var jobSkillNameFreq = [];
    // the upper bound for skill representations
    var upperBoundSkills = 50;

    var sLimit = numberOfSkills < upperBoundSkills ? numberOfSkills : upperBoundSkills;
    for (var SkillN = 0; SkillN < sLimit; SkillN++) {
        var JFPair = jobSkills[SkillN];
        jobSkillNameFreq.push({ name: JFPair[0], value: JFPair[1] });
        //jobSkillName.push(JFPair[0]);
        //jobSkillFreq.push(JFPair[1]);
    }
    
    
    // update the statistics for job posts
    $('#infoStatSkills').html("<b>" + numberOfSkills + "</b>");
    
    // TODO: creates the histogram for the frequency - skill data
    // create the histogram
    var dataset = { name: "Job Posts By Skills", yAttribute: "Number of jobs", data: jobSkillNameFreq };
    skillHistogram.setData(dataset);

    // TODO: replace this histogram with one from d3
    /////////////////////////////////////////
 //   $('#analytics-chart-skills-by-frequency').highcharts({
 //       chart:
 //{
 //           type: 'column'
 //       },
 //       title: {
 //           text: 'Job Posts By Skills'
 //       },
        
 //       xAxis: {
 //           categories: jobSkillName,
 //           crosshair: true
 //       },
 //       yAxis: {
 //           min: 0,
 //           title: {
 //               text: 'Number of jobs'
 //           }
 //       },
 //       legend: {
 //           enabled: false
 //       },
 //       plotOptions: {
 //           column: {
 //               pointPadding: 0.2,
 //               borderWidth: 0
 //           }
 //       },
 //       series: [{
 //               name: 'Skills',
 //               data: jobSkillFreq,
 //               color: Highcharts.getOptions().colors[6]
 //           }]
 //   });
    /////////////////////////////////////////
    
    //-------------------------------------------------------
    // Calculates the location frequency histogram
    //-------------------------------------------------------

    // get the location frequency
    var locationFreq = {};
    for (var j = 0; j < jobResults.length; j++) {
        var jobLocation = jobResults[j].locationName;
        if (locationFreq.hasOwnProperty(jobLocation)) {
            locationFreq[jobLocation] += 1;
        } else {
            locationFreq[jobLocation] = 1;
        }
    }
    
    // sort job locations by their frequency
    var jobLocations = [];
    for (var key in locationFreq) {
       jobLocations.push([key, locationFreq[key]]);
    }
    jobLocations.sort(function (a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });

    var numberOfLocations = jobLocations.length;
    //var jobLocationName = [];
    //var jobLocationFreq = [];
    var jobLocationNameFreq = [];

    // the upper bound for location representation
    var upperBoundLocation = 50;
    
    var lLimit = numberOfLocations < upperBoundLocation ? numberOfLocations : upperBoundLocation;
    for (var LocN = 0; LocN < lLimit; LocN++) {
        var jobLoc = jobLocations[LocN];
        jobLocationNameFreq.push({ name: jobLoc[0], value: jobLoc[1] });
        //jobLocationName.push(jobLoc[0]);
        //jobLocationFreq.push(jobLoc[1]);
    }

    // update the location statistics
    $('#infoStatLocations').html("<b>" + numberOfLocations + "</b>");

    // TODO: creates the histogram for the freq - location data
    // create the histogram
    var dataset = { name: "Job Posts By Locations", yAttribute: "Number of jobs", data: jobLocationNameFreq };
    locationHistogram.setData(dataset);

    // TODO: replace this histogram with one from d3
    /////////////////////////////////////////
 //   $('#analytics-chart-location-by-frequency').highcharts({
 //       chart:
 //{
 //           type: 'column'
 //       },
 //       title: {
 //           text: 'Job Posts By Locations'
 //       },
        
 //       xAxis: {
 //           categories: jobLocationName,
 //           crosshair: true
 //       },
 //       yAxis: {
 //           min: 0,
 //           title: {
 //               text: 'Number of jobs'
 //           }
 //       },
 //       legend: {
 //           enabled: false
 //       },
 //       plotOptions: {
 //           column: {
 //               pointPadding: 0.2,
 //               borderWidth: 0
 //           }
 //       },
 //       series: [{
 //               name: 'Locations',
 //               data: jobLocationFreq,
 //               color: Highcharts.getOptions().colors[3]
 //           }]
 //   });
    /////////////////////////////////////////					
}