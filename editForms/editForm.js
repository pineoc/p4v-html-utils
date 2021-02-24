var specDef;
var formType = 'branch';
var formName;

function runOnload() {
  branchName = GetURLParameter("branch");
  if (branchName) {
    formType = 'branch';
    formName = branchName;
    editForm();
    return;
  }
  clientName = GetURLParameter("workspace");
  if (clientName) {
    formType = 'client';
    formName = clientName;
    editForm();
    return;
  }
  userName = GetURLParameter("user");
  if (userName) {
    formType = 'user';
    formName = userName;
    editForm();
    return;
  }
  jobName = GetURLParameter("job");
  if (jobName) {
    formType = 'job';
    formName = jobName;
    editForm();
    return;
  }
  streamName = GetURLParameter("stream");
  if (streamName) {
    formType = 'stream';
    formName = streamName;
    editForm();
    return;
  }
}

function editForm() {
  p4vjs.p4('spec -o ' + formType).then(function (obj) {
    specDef = parseSpecDef(obj.data[0]);
    var callback = formDescriptionFetched;
    var inputfield = document.getElementById("formname");
    p4vjs.p4(formType + " -o " + formName, '', callback);
  });
}

function formDescriptionFetched(obj) {
  var formEditor = document.getElementById("formEditor");
  formEditor.innerHTML = "";
  var index = 0;
  var specarr = specDef.data;
  var arrlength = specarr.length;
  for (var i = 0; i < arrlength; i++) {
    var key = specarr[i].name;
    var row = formEditor.insertRow(index++);

    // left cell
    var cellLeft = row.insertCell(0);
    var textNode = document.createTextNode(key);
    cellLeft.appendChild(textNode);
    cellLeft.setAttribute("class", "nameFont");

    // right cell
    var cellRight = row.insertCell(1);
    if (i == 0) {
      textNode = document.createTextNode(obj.data[0][key]);
      cellRight.appendChild(textNode);
    }
    else {
      var val = obj.data[0][key];
      var prevalues = specarr[i].values;
      // if prevalue[0] is an array, the gui should present ann array of checkboxes (TBD)
      if (prevalues != undefined && typeof prevalues[0] == "string") {
        selectNode = document.createElement('SELECT');
        for (var j = 0; j < prevalues.length; j++) {
          var pvalue = prevalues[j];
          var stvalue = '';
          if (typeof pvalue == "string")
            stvalue = pvalue;
          var o = document.createElement("option");
          o.value = stvalue;
          o.text = stvalue;
          selectNode.appendChild(o);
        }
        cellRight.appendChild(selectNode);

        selectNode.value = val;
      }
      else {
        inputNode = document.createElement("INPUT");
        inputNode.setAttribute('size', specarr[i].length);
        var val = obj.data[0][key];
        if (val !== 'undefined' && val != undefined) {
          inputNode.value = val;
        }
        else {
          var dataType = specarr[i].dataType;
          if (dataType == 'wlist') {
            inputNode = document.createElement("TEXTAREA");
            inputNode.setAttribute('cols', "80");
            inputNode.setAttribute('rows', "10");

            val = '';
            for (var idx = 0; (line = obj.data[0][key + idx.toString()]) != undefined; ++idx) {
              val += line;
              val += String.fromCharCode(13);
            }
            inputNode.value = val;
          }
          else {
            inputNode.value = '';
          }
        }
        cellRight.appendChild(inputNode);
      }
    }
  }
}

function saveForm() {
  var table = document.getElementById("formEditor");
  firstcol = table.rows[0].cells[1];

  var formData = {};
  formData[specDef.data[0].name] = firstcol.childNodes[0].wholeText;
  for (var i = 1, row; row = table.rows[i]; i++) {
    var spDef = specDef.data[i];
    var dataType = spDef.dataType;

    if (dataType != 'wlist') {
      formData[spDef.name] = row.cells[1].children[0].value.trim();
    }
    else {
      var data = row.cells[1].children[0].value;
      var arrayOfLines = data.split("\n");
      var viewData = '';
      for (var lnr = 0; lnr < arrayOfLines.length; lnr++) {
        var line = arrayOfLines[lnr];
        if (line != '' && line !== 'undefined' && line != undefined) {
          viewData += "\n\t" + line.trim();
        }
      }
      formData[spDef.name] = viewData;
    }
  }
  p4vjs.p4(formType + ' -i', formData);
}