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
    //{ location: [ number, number ], timestamp: number, title: string, skillset: [string, string, string], id: string  }   
    var jobsAllInfo = [];
    var jobResults = json.jp_result;
    for (var JobN = 0; JobN < jobResults.length; JobN++) {
        var job = jobResults[JobN];
        var timestamp = Date.parse(job.datePosted);
        var location = [job.long, job.lat];
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
    
    var numberOfJobs = jobsAllInfo.length;
    // update the statistics for job posts
    $('#infoStatJobPosts').html("<b>" + numberOfJobs + "</b>");
    
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

    // create an array of skill-name, frequency pairs
    var numberOfSkills = Object.keys(skillsFreq).length;
    
    // update the statistics for job posts
    $('#infoStatSkills').html("<b>" + numberOfSkills + "</b>");
    
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
    var numberOfLocations = Object.keys(locationFreq).length;
    // update the location statistics
    $('#infoStatLocations').html("<b>" + numberOfLocations + "</b>");
  
    
    //-------------------------------------------------------
    // Calculates the location frequency histogram
    //-------------------------------------------------------

    //reload jobs tables
    var jobDataTable = $('#top-jobs').DataTable();
    jobDataTable.destroy();
    
    //-------------------------------------------------------
    // Fill top jobs table
    //-------------------------------------------------------

    var jobTableUpperbound = 100;
    var sLimit = numberOfJobs < jobTableUpperbound ? numberOfJobs : jobTableUpperbound;
    var dataSet = [];
    for (var JobN = 0; JobN < sLimit; JobN++) {
        var jobPost = jobResults[JobN];
        
        var jobTitle = jobPost.jobTitle;
        // remove start <strong> tag
        jobTitle = jobTitle.replace(/<strong>/g, '');
        jobTitle = jobTitle.replace(/&lt;strong&gt;/g, '');
        
        // remove end <strong> tag
        jobTitle = jobTitle.replace(/<\/strong>/g, '');
        jobTitle = jobTitle.replace(/&lt;\/strong&gt;/g, '');

        var jobPostInfo = [];
        jobPostInfo[0] = "<a href=\"" + jobPost.url + "\">" + jobTitle + "</a>";
        jobPostInfo[1] = jobPost.datePosted;
        jobPostInfo[2] = jobPost.hiringOrganization;
        jobPostInfo[3] = jobPost.skillsTxt;
        jobPostInfo[4] = jobPost.locationName;
        jobPostInfo[5] = jobPost.parentName;
        
        dataSet.push(jobPostInfo);
    }
    
    $('#top-jobs').DataTable({
        data: dataSet,
        columns: [
            { title: "Job Title" },                
            { title: "Posting Date" },
            { title: "Hiring Organization" },
            { title: "Skills" },
            { title: "Location" },
            { title: "Country" }
        ],
        pageLength: 5,
        autoWidth: false
    });
}