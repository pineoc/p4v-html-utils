var p4query = 'changes -s submitted -l -m 1000';
var p4user;
var p4workspace;

async function runOnload() {
  p4user = await p4vjs.getUser();
  p4workspace = await p4vjs.getClient();

  setQuery(p4query);

  document.getElementById('excuteBtn').addEventListener('click', executeQuery, false);
  document.getElementById('searchText').addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  });
  document.getElementById('querytext').addEventListener('keyup', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  });
  // set jira url
  document.getElementById('saveBtn').addEventListener('click', setJiraUrl, false);
  if (getJiraUrl()) {
    document.getElementById('url').value = localStorage.getItem('jiraUrl');
  }

  loadQueryResult();
}

async function loadQueryResult() {
  await p4vjs.p4(p4query).then((result) => {
    var queryResultContainer = result.data.map(function(e) {
      delete e.Client;
      delete e.streamStatus;
      delete e.Status;
      delete e.Type;
      delete e.oldChange;
      delete e.path;
      e.Date = moment.unix(e.Date).format('YYYY-MM-DD HH:mm:ss');
      return e;
    });
    var nrOfRows = queryResultContainer.length;

    if (nrOfRows > 0) {
      // Create dynamic table.
      let table = document.createElement('table');
      table.classList.add('table', 'is-fullwidth');

      // Retrieve column header 
      let col = []; // define an empty array
      for (let i = 0; i < nrOfRows; i++) {
        for (let key in queryResultContainer[i]) {
          if (col.indexOf(key) === -1) {
            col.push(key);
          }
        }
      }
      // Create table head 
      let tHead = document.createElement('thead');

      // Create row for table head
      let hRow = document.createElement('tr');

      // Add column header to row of table head
      for (let i = 0; i < col.length; i++) {
        var th = document.createElement('th');
        th.innerHTML = col[i];
        hRow.appendChild(th);
      }
      tHead.appendChild(hRow);
      table.appendChild(tHead);

      // Create table body 
      var tBody = document.createElement('tbody');

      // Add column header to row of table head
      for (let i = 0; i < nrOfRows; i++) {
        if (isIncludeSearchString(queryResultContainer[i].Description) === false)
          continue;
        
        // if jiraUrl setup, replace jira key to jira link text
        if (getJiraUrl()) {
          queryResultContainer[i].Description = parseJiraKeyToLink(queryResultContainer[i].Description);
        }
        // auto link
        queryResultContainer[i].Description = Autolinker.link(queryResultContainer[i].Description, {newWindow: true});

        var bRow = document.createElement('tr'); // Create row for each item 

        for (let j = 0; j < col.length; j++) {
          var td = document.createElement('td');
          td.innerHTML = queryResultContainer[i][col[j]];
          bRow.appendChild(td);
        }
        
        tBody.appendChild(bRow);

      }
      table.appendChild(tBody);

      // Finally add the newly created table with json data to a container
      let divContainer = document.getElementById('queryResultContainer');
      divContainer.innerHTML = '';
      divContainer.appendChild(table);
    } else {
      // Finally add the newly created table with json data to a container
      let divContainer = document.getElementById('queryResultContainer');
      divContainer.innerHTML = 'No Items retrieved';
    }
  });
}

function setQuery(selectedValue) {
  var inputfield = document.getElementById('querytext');
  qvalue = selectedValue;
  qvalue = qvalue.replace('$curr_user', p4user);
  qvalue = qvalue.replace('$curr_workspace', p4workspace);
  inputfield.value = qvalue;
}

function executeQuery() {
  var inputfield = document.getElementById('querytext');
  p4query = inputfield.value;
  loadQueryResult();
}

function isIncludeSearchString(desc) {
  var searchString = document.getElementById('searchText').value;
  return desc.indexOf(searchString) !== -1;
}

function setJiraUrl() {
  var urlfield = document.getElementById('url').value;
  window.localStorage.setItem('jiraUrl', urlfield);
}
function getJiraUrl() {
  return window.localStorage.getItem('jiraUrl');
}
function getHrefElement(url, text) {
  return '<a href="'+url+'" target="_blank">'+text+'</a>';
}
function parseJiraKeyToLink(desc) {
  // Ref: https://community.atlassian.com/t5/Bitbucket-questions/Regex-pattern-to-match-JIRA-issue-key/qaq-p/233319
  const jiraMatcher = /((?!([A-Z0-9a-z]{1,10})-?$)[A-Z]{1}[A-Z0-9]+-\d+)/g;
  // const jiraMatcher = /((?<!([A-Za-z]{1,10})-?)[A-Z]+-\d+)/g;
  let keys = desc.toUpperCase().match(jiraMatcher);
  // jira key matched
  keys = [...new Set(keys)]; // remove dups
  if (keys != null && keys.length > 0) {
    // jira ticket string in text
    for(var i = 0; i < keys.length; i++) {
      desc = desc.replace(keys[i], getHrefElement(getJiraUrl()+'/browse/'+keys[i], keys[i]));
    }
  }
  return desc;
}

// set Event listener to objects
window.addEventListener('load', runOnload, false);
