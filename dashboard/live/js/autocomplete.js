
/**
 * Functionality of the autocomplete skill search.
 * 
 * Uses typeahead.js: https://twitter.github.io/typeahead.js/
 * and Bootstrap Tags Input: http://bootstrap-tagsinput.github.io/bootstrap-tagsinput/examples/
 */ 

$(function () {
    // skillset gathered from the provided data map_dump.csv
    var skillset = ['Python', 'Advanced computing', 'Programming', 'Computational systems', 'Coding', 'Cloud computing', 'Databases', 
        'Data management', 'Data engineering', 'Data mining', 'Data formats', 'Linked data', 'Information extraction', 'Stream processing', 
        'Enterprise process', 'Business intelligence', 'Data anonymisation', 'Semantics', 'Schema', 'Data licensing', 'Data quality', 
        'Data governance', 'Data science', 'Big data', 'Open data', 'Machine learning', 'Social network analysis', 'Inference', 'Reasoning', 
        'Process mining', 'Linear algebra', 'Calculus', 'Mathematics', 'Statistics', 'Probability', 'RStudio', 'Data analytics', 
        'Data analysis', 'Data visualisation', 'Infographics', 'Interaction', 'Data mapping', 'Data stories', 'Data journalism', 'D3js', 
        'Tableau'];
    
    // skills typeahead and tags 
    var skills = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: $.map(skillset, function (skill) { return { name: skill }; })
    }); skills.initialize();
    
    $("#skill-search").tagsinput({
        itemValue: "name",
        typeaheadjs: {
            name: "skills",
            displayKey: 'name',
            source: skills.ttAdapter()
        }
    });

});