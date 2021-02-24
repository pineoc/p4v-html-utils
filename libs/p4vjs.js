var p4vjs = new Object();
p4vjs.port = '8683';

/**
 * returns the value of an argument
 * The changelist to be submitted is passed in as a argument ?change=<changeNum>
**/
function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) 
    {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) 
        {
            return sParameterName[1];
        }
    }
}

/**
 * returns true if p4v uses dark theme to display
**/ 
function p4vdark() {
    var darkTheme = GetURLParameter("p4vtheme");
    if (darkTheme == "dark")
       return true;
    return false;
}


// a UTF-8 safe btoa implementation
function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}

// executes the HTTP request executing p4 requests
async function p4runcmd(command, form, callback) {
     var frm = '{}';
     var formJSON;
     if (form)
        formJSON = JSON.stringify(form);
     else
        formJSON = JSON.stringify(frm);

     var cmd = b64EncodeUnicode(command);
     var fm = b64EncodeUnicode(formJSON);

     var url = "http://localhost:" + p4vjs.port + "/p4v/p4?{%22arguments%22:{%22command%22:%22" + cmd + "%22,%22form%22:%22" + fm + "%22}}";

     if (callback)
     {
        fetch(url)
            .then((response) => {
               response.json().then((data) => { 
                    callback(data);
              });
          })
          .catch((err) => { 
                console.error("Failed!\n", err);
         });
     }
     else
     {
        var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
        json =  await response.json();
        return json;
     }
}

// utility implementation for properties
async function p4property(name) {
     var url = "http://localhost:" + p4vjs.port + "/p4v/prop?{%22arguments%22:{%22key%22:%22" + encodeURI(name) + "%22}}";
     var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      resp =  await response.text();
      return resp;
}

async function closewindow() 
{
      JSWindowId = GetURLParameter("windowid");
      if ( JSWindowId )
      {
          var url = "http://localhost:" + p4vjs.port + "/p4v/close?{%22arguments%22:{%22windowid%22:%22" + JSWindowId + "%22}}";
          await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      }
}

async  function p4apiversion() {
      return p4property('apiversion');
}

async  function p4charset() {
      return p4property('charset');
}

async  function p4client() {
      return p4property('client');
}

async  function p4port() {
      return p4property('port');
}

async  function p4user() {
      return p4property('user');
}

async  function p4serverroot() {
      return p4property('serverroot');
}

async  function p4serverversion() {
      return p4property('serverversion');
}

async  function p4unicode() {
      return p4property('unicode');
}

async  function p4casesensitive() {
      return p4property('casesensitive');
}

async  function p4securitylevel() {
      return p4property('securitylevel');
}

// returns the names of the Perforce built-in images
async function p4imagenames() {
     var url = "http://localhost:" + p4vjs.port + "/p4v/imgnames?{%22arguments%22:{}}";
     var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      json =  await response.json();
      return json;
}

// returns the image matching the built-in image name
async function p4image(name) {
     var url = "http://localhost:" + p4vjs.port + "/p4v/image?{%22arguments%22:{%22name%22:%22" + encodeURI(name) + "%22}}";
     var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      resp =  await response.text();
      return resp;
}

// returns the selected depot paths
async function p4selected() {
     var url = "http://localhost:" + p4vjs.port + "/p4v/selected?{%22arguments%22:{}}";
     var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      resp =  await response.text();
      return resp;
}

// send selection of depot paths
async function p4select(paths) {
     var b64paths = b64EncodeUnicode(paths);
     var url = "http://localhost:" + p4vjs.port + "/p4v/select?{%22arguments%22:{%22paths%22:%22" + b64paths + "%22}}";
     var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      resp =  await response.text();
      return (resp === "true");
}

async function p4refresh() {
     var url = "http://localhost:" + p4vjs.port + "/p4v/refreshall?{%22arguments%22:{}}";
     var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      resp =  await response.text();
      return resp;
}

async function p4openurl(myurl) {
     var b64url = b64EncodeUnicode(myurl);
     var url = "http://localhost:" + p4vjs.port + "/p4v/openurl?{%22arguments%22:{%22url%22:%22" + b64url + "%22}}";
     var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      resp =  await response.text();
      return (resp === "true");
}

async function p4enableerrdlg(enble) {
     var url = "http://localhost:" + p4vjs.port + "/p4v/errorenable?{%22arguments%22:{%22enable%22:%22" + enble + "%22}}";
     var response = await fetch(url)
            .catch((err) => {
                console.error("Failed!\n", err);
             });
      resp =  await response.text();
      return (resp === "true");
}

p4vjs.closeWindow = closewindow;
p4vjs.p4 = p4runcmd;
p4vjs.getApiVersion = p4apiversion;
p4vjs.getCharset = p4charset;
p4vjs.getClient = p4client;
p4vjs.getPort = p4port;
p4vjs.getUser = p4user;
p4vjs.getServerRootDirectory = p4serverroot;
p4vjs.getServerVersion = p4serverversion;
p4vjs.isServerUnicode = p4unicode;
p4vjs.isServerCaseSensitive = p4casesensitive;
p4vjs.getServerSecurityLevel = p4securitylevel;
p4vjs.getImageNames = p4imagenames;
p4vjs.getImage = p4image;
p4vjs.getSelection = p4selected;
p4vjs.setSelection = p4select;
p4vjs.refreshAll = p4refresh;
p4vjs.openUrlInBrowser = p4openurl;
p4vjs.setP4VErrorDialogEnabled = p4enableerrdlg;
p4vjs.useDarkTheme = p4vdark;

