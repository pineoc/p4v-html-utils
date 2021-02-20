var formType = 'branch';

function setFormType(frmtpe) {
  formType = frmtpe;
}
function editForm() {
  p4vjs.p4('spec -o ' + formType).then(function (obj) {
    var formName = document.getElementById("formname").value;
    url = "editform.html?" + formType + "=" + formName;
    console.log(url);
    window.open(url);
  });
}