/**
 * submitMain(): Initializes the submit dialog 
**/
function submitMain() {
    // The changelist to be submitted is passed in as a argument ?change=<changeNum>
    // getChange will gather the change information.
    getChange().then(function(theChange) {
        // Extract the changelist fields needed for populating the file and jobs
        // checklists:
        var status = theChange.Status;
    
        if (status == "new") {
              var files = getEntries(theChange, "Files");
        }
        else {
              var files = getEntries(theChange, "depotFile");
    	}
        var jobs = getEntries(theChange, "job");
        var types = getEntries(theChange, "type");
        var revs = getEntries(theChange, "rev");
        var actions = getEntries(theChange, "action");
    
        // Store non-list items in the various fields in the HTML form.
        // The change/user/client fields are hidden -- 
        document.getElementById("description").value = theChange.Description;
        document.getElementById("change").value = theChange.Change;
        document.getElementById("user").value = theChange.User;
        document.getElementById("client").value = theChange.Client;
        document.getElementById("status").value = theChange.Status;

        // Populate the file list using the loadFileList function:
        document.getElementById("filelist").innerHTML = loadFilelist(files, "Files", true, revs, types, actions);

        // Create the job list
        loadJoblist(jobs, "Jobs", true).then(function(jobList) {
            // And then pass that value to the appropriate location in the html:
            document.getElementById("joblist").innerHTML = jobList;
        });
    });
}

/**
 * createForm(): Creates a change form that follows the formatting rules of a Perforce Changelist. 
**/
function createForm() {
    // Read pertinent field information 
    var change = document.getElementById("change").value;
    var user = document.getElementById("user").value;
    var client = document.getElementById("client").value;
    var myStatus = document.getElementById("status").value;
    var myDesc = document.getElementById("description").value;

    // Check to see if the description is empty. 
    if (!myDesc) {
        // The field was empty. Update the html document with an error message:
        document.getElementById("desc_header").innerHTML = "You must add a description to submit files:";
    } 

    // Get a list of files to be submitted:
    var myFiles = getCheckList("Files");
    
    // No files to be submitted
    if (!myFiles) {
        document.getElementById("files_header").innerHTML = "Select files to submit:";
    } else {
        // Clear any errors in the html document:
        document.getElementById("files_header").innerHTML = "&nbsp";
    }
    
    // Collect jobs:
    var myJobs = getCheckList("Jobs");
    
    var myForm = {};
    // Check to make sure we have a description and files
    if (myDesc && myFiles) {
        // And then we assemble the form. If an optional field is empty (jobs, for example)
        // Perforce ignores the field, so we don't need to check it:
        myForm["Change"] = change;
        myForm["Client"] = client;
        myForm["User"]= user;
        myForm["Status"] = myStatus;
        myForm["Description"] = myDesc;
        myForm["Files"] = myFiles;
        myForm["Jobs"] = myJobs;
        return myForm;
    } else {
        return myForm;
    }
}

/**
 * addJob(): Adds a job to the end of the job listing. 
**/
function addJob() {
    var myList = document.getElementById("joblist").innerHTML;
    
    var myJob = document.getElementById("jobAdd").value;
    
    if (myJob) {
        // Check to see if the job was already in the list:
        if (itemExists(myJob, "Jobs")) {
            alert("Job is already in the changelist.");
        } else {
            // Check if the job already exists:
            p4vjs.p4('jobs -e ' + myJob).then(function(jobCheck) {
                if (jobCheck.data.length > 0) {
                    theDesc = jobCheck.data[0].Description;
                    theStatus = jobCheck.data[0].Status;
                    // Format the description to replace newlines with spaces:
                    theDesc = '- ' + theDesc.replace(/\n/gm, ' ');
                    // If the resulting string is longer than 163 characters, truncate the string
                    // and add an ellipse. 
                    if (theDesc.length > 163) {
                        theDesc = theDesc.substring(0, 160) + '...';
                    }
                    // addListItem takes the original unordered list and adds the new job. 
                    document.getElementById("joblist").innerHTML = addListItem(myList, myJob, 'Jobs', theStatus, theDesc);
                    // Clear the add job field:
                    document.getElementById("jobAdd").value = "";
                } else {
                    // No job. Inform the user and leave the field untouched.
                    alert("Job number " + myJob + ' does not exist and can not be added.');
                }
            });
        }
    } else {
        // The add job field was empty. 
        alert("Please enter the job number to add.");
    }
}

/**
 * itemExists(theItem, theLabel): Checks an item (theItem) against a list collected by a label
 * name (theLabel) from the html document. Returns true if the item is found.
**/
function itemExists(theItem, theLabel) {
    var boxes = document.getElementsByName(theLabel + 'Box');
    for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].value == theItem) {
            return true;
        }
    }
    return false;
}

/**
 * addListItem(theList, theItem, theLabel, theStatus, theDesc): 
**/
function addListItem(theList, theItem, theLabel, theStatus, theDesc) {
    // Alternate colors for each job entry
    var boxes = document.getElementsByName(theLabel + 'Box').length;
    if (boxes % 2) {
        var rowClass = " class=\"alt-row\" ";
    } else {
        var rowClass = "";
    }

    theList = theList + '<li ' + rowClass + '><label for=\"R' + theLabel + (boxes + 1)
     + '\"><input id=\"R' + theLabel + (boxes + 1) + '\" type=\"checkbox\" checked=\"checked\"'
     + ' name=\"' + theLabel + 'Box\" ' + 'value=\"' + theItem + '\" />'
     + theItem + ' <font color=\"#999999\"> (' + theStatus + ') </font>'
     + theDesc + '</li>\n';
    return theList;
}
/**
 * getCheckList(theField): Passing the name of a checklist ('jobs' or 'files') 
 * returns a newline delimited list, each line padded with a tab 
**/
function getCheckList(theField) {
    var boxes = document.getElementsByName(theField + 'Box');
    var result = "";
    for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) {
            result = result + "\n\t" + boxes[i].value;
        }
    }
    return result;
}

/**
 * loadFilelist(theList, theLabel, theState, theRev, theType, theAction):
**/
function loadFilelist(theList, theLabel, theState, theRev, theType, theAction) {
    var checkList = "";
    if (theState) {
        theCheck = "checked=\"checked\"";
    } else {
        theCheck = "";
    }
    for (var i = 0; i < theList.length; i++) {
        // Create alternating rows 
        if (i % 2) {
            var rowClass = " class=\"alt-row\" ";
        } else {
            var rowClass = "";
        }
        
        // Construct the unordered list entry with the structure:
        //
        //     <li {class="alt-row"}>
        //     <label for="RFiles1234" \>
        //     <input id="RFiles1234" type="checkbox" {checked="checked"} 
        //         name="FilesBox value="{file path}" />
        //     {file path}#123 <font color="#999999"> ({file type}) {file action}
        //     </font></label></li>
        
         checkList = checkList + '<li ' + rowClass + '><label for=\"R' + theLabel + i
         + '\"><input id=\"R' + theLabel + i + '\" type=\"checkbox\" ' + theCheck
         + ' name=\"' + theLabel + 'Box\" ' + 'value=\"' + theList[i] + '\" />'
         + theList[i] + '#' + theRev[i] + '<font color=\"#999999\"> (' + theType[i] + ') '
         + theAction[i] + '</font></label></li>\n';
    }
    return checkList;
}

/**
 * loadJoblist(theList, theLabel, theState): Pullx job items using individual commands. 
**/
async function loadJoblist(theList, theLabel, theState) {
    var checkList = "";
    if (theState) {
        theCheck = "checked=\"checked\"";
    } else {
        theCheck = "";
    }
    for (var i = 0; i < theList.length; i++) {
        // alternative row colors
        if (i % 2) {
            var rowClass = " class=\"alt-row\" ";
        } else {
            var rowClass = "";
        }
        
        var theJob = await p4vjs.p4('jobs -e ' + theList[i]);
        theDesc = theJob.data[0].Description;
        theStatus = theJob.data[0].Status;
        // Format the description to replace newlines with spaces:
        theDesc = '- ' + theDesc.replace(/\n/gm, ' ');
        // If the resulting string is longer than 163 characters, truncate the string and add an ellipse. 
        if (theDesc.length > 163) {
            theDesc = theDesc.substring(0, 160) + '...';
        }
        
        // Construct the unordered list entry with the structure:
        //
        //     <li {class="alt-row"}>
        //     <label for="RJobs1234" \>
        //     <input id="RJobs1234" type="checkbox" {checked="checked"} 
        //         name="JobsBox value="{file path}" />
        //     {job number} <font color="#999999"> ({job status}) </font>
        //     {job description} </label></li>
        //
        
        checkList = checkList + '<li ' + rowClass + '><label for=\"R' + theLabel + i
         + '\"><input id=\"R' + theLabel + i + '\" type=\"checkbox\" ' + theCheck
         + ' name=\"' + theLabel + 'Box\" ' + 'value=\"' + theList[i] + '\" />'
         + theList[i] + ' <font color=\"#999999\"> (' + theStatus + ') </font>'
         + theDesc + '</label></li>\n';
    }
    return checkList;
}

/**
 * checkAll(theName, theChecked): Utility function that takes a value returned 
 * from a clicked checkbox and toggles all of the checkboxes for the associated
 * checklist.
**/
function checkAll(theName, theChecked) {
    var toToggle = document.getElementsByName(theName + 'Box');
    for (var i = 0; i < toToggle.length; i++) {
        toToggle[i].checked = theChecked;
    }
}

/**
 * saveChange(): Handles the submit button.
**/
function saveChange() {
    var result = saveForm();
    if (result.error) {
        alert("Perforce error: " + result.error);
    }
}

/**
 * saveForm(): saves the form, and closes 
**/
async function saveForm() {
    var form = createForm();
    var result = await p4vjs.p4('change -i', form);
    if (!result.error) {
        p4vjs.closeWindow();
    }
    return result;
}

/**
 * setFixes(): Set the job state upon submit.
**/
async function setFixes() {
    var myJobs = getCheckList("Jobs");
    myJobs = myJobs.split("\n\t");
    if (myJobs.length > 0) {
        var jobOpt = document.getElementById("jobstatus_submit").value;
        if (jobOpt === "same") {
            jobOpt = "none";
        };
        var chgNum = document.getElementById("change").value;
        for (var i = 0; i < myJobs.length; i++) {
            if (myJobs[i].length > 0) {
                await p4vjs.p4('fix -c ' + chgNum + ' -s ' + jobOpt + ' ' + myJobs[i]);
            }
        }
    }
}

/**
 * getSubmitOptions(): The "check out files after submit" checkbox to create 
 * the "-f" arguments for submitting the change.
**/
function getSubmitOptions() {
    var fileOpt = "";
    switch (document.getElementById("fileoption_submit").value) {
        case 'Submit all selected files':
        fileOpt = "submitunchanged";
        break;
        case 'Don\'t submit unchanged files':
        fileOpt = "leaveunchanged";
        break;
        case 'Revert unchanged files':
        fileOpt = "revertunchanged";
        break;
    }
    if (document.getElementById("recheckout").checked) {
        fileOpt = fileOpt + "+reopen";
    }
    var options = " -f " + fileOpt;
    return options;
}

/**
 * Gets all occurrences of an incrementing key sequence from the specified JSON data object.
 * This method looks for properties in the specified data object starting at key+index where
 * index starts at zero and increments until no property is found by key+index in data.
 * 
 * 
 * @param data - Object to index into for specified key
 * @param key - incrementing key sequence
 *
 * @return - non-null but possibly empty array of value found by the specified incrementing key
**/
function getEntries(data, key) {
    var entries = [];
    if (data && key) {
        if (data[key]) {
            // For handling data from commands like p4 opened
            entries.push(data[key]);
        } else {
            // For handling data from commands like p4 describe
            var index = 0;
            while (data[key + index]) {
                entries.push(data[key + index]);
                index++;
            }
        }
    }
    return entries;
}

/**
 * Loads the changelist passed in as an argument.
 * 
 * @return - object literal of current changelist data
**/
async function getChange() {
    var changelist = {};
    try {
        var clNumber =  GetURLParameter("change");
        document.getElementById("header").innerHTML = "Submit change: " + clNumber;
        if (clNumber == "default") {
            btn = document.getElementById("delete");
            btn.style.display = "none";

	        var changelistData = await p4vjs.p4("change -o");
            if (changelistData) {
                changelist = changelistData;
            }         
        } 
        
        if (clNumber && parseInt(clNumber) > 0) {
            var changelistData = await p4vjs.p4("describe " + clNumber);
            if (changelistData) {
                changelist = changelistData;
                if (changelistData.data[0]['shelved'] == undefined)
                {
                   btn = document.getElementById("delete");
                   btn.style.display = "none";
                }
                else
                {
                   btn = document.getElementById("submit");
                   btn.style.display = "none";
                }
            }
        }
    } catch(e) {
        changelist = {};
    }
    return (changelist.data && changelist.data[0]) ? changelist.data[0] : {};
}

/**
* Submit the changelist with the specified files, jobs,
* and description and close the submit dialog.
**/
function submitChanges() {
    var chgNum = document.getElementById("change").value;
    var onSubmit = getSubmitOptions();
    setFixes();

    var form = createForm();
    p4vjs.p4('submit -f submitunchanged -i', form).then(function(result) {
       p4vjs.closeWindow();
   });
}

/**
 * Delete all shelved files in the ChangeList, a prerequisite for Submitting.
**/
function deleteShelved() {
    var chgNum = document.getElementById("change").value;

    p4vjs.p4('shelve -f -d -c ' + chgNum).then(function(result) {
       p4vjs.refreshAll();

       sbtn = document.getElementById("submit");
       sbtn.style.display = "initial";
       dbtn = document.getElementById("delete");
       dbtn.style.display = "none";
    });
}

