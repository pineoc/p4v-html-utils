var jenkinsUrl;

async function loadDashboard() {
  jenkinsUrl = window.localStorage.getItem('jenkinsUrl') || '';
  if (jenkinsUrl) {
    document.getElementById('jenkinsUrl').value = jenkinsUrl;
  }
  document.getElementById('saveJenkinsUrl').addEventListener('click', function () {
    jenkinsUrl = document.getElementById('jenkinsUrl').value;
    window.localStorage.setItem('jenkinsUrl', jenkinsUrl);
    loadBuildStatus();
  });

  loadOpenFiles();
  loadWorkspaceUsage();
  loadBuildStatus();
  setInterval(loadBuildStatus, 60000);
}

async function loadOpenFiles() {
  try {
    var result = await p4vjs.p4('opened -m 100');
    var data = result.data || [];
    var container = document.getElementById('openFiles');
    if (data.length === 0) {
      container.innerHTML = '<p>No opened files.</p>';
      return;
    }
    var table = document.createElement('table');
    table.classList.add('table', 'is-fullwidth', 'is-striped');
    var tbody = document.createElement('tbody');
    data.forEach(function (item) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.textContent = item.depotFile || item.clientFile || item.path;
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.innerHTML = '';
    container.appendChild(table);
  } catch (e) {
    document.getElementById('openFiles').innerHTML = 'Failed to load open files';
  }
}

async function loadWorkspaceUsage() {
  try {
    var roots = await p4vjs.getDepotRoots();
    var labels = [];
    var sizes = [];
    for (var i = 0; i < roots.length; i++) {
      var root = roots[i];
      try {
        var res = await p4vjs.p4('sizes -s ' + root + '/...');
        var size = 0;
        if (res.data) {
          res.data.forEach(function (d) {
            if (d.fileSize) {
              size += parseInt(d.fileSize, 10);
            } else if (d.size) {
              size += parseInt(d.size, 10);
            }
          });
        }
        labels.push(root);
        sizes.push(size);
      } catch (err) {
        labels.push(root);
        sizes.push(0);
      }
    }
    var ctx = document.getElementById('workspaceChart').getContext('2d');
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: sizes,
            backgroundColor: ['#f14668', '#209cee', '#23d160', '#ffdd57', '#00d1b2', '#ff851b', '#b86bff']
          }
        ]
      },
      options: {
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  } catch (e) {
    document.getElementById('workspaceChart').replaceWith('Failed to load workspace usage');
  }
}

async function loadBuildStatus() {
  if (!jenkinsUrl) {
    document.getElementById('buildStatus').innerHTML = 'Jenkins URL not configured';
    return;
  }
  try {
    var res = await fetch(jenkinsUrl);
    if (!res.ok) {
      document.getElementById('buildStatus').innerHTML = 'Failed to fetch build status';
      return;
    }
    var data = await res.json();
    var html = '';
    html += '<p>Job: ' + (data.fullDisplayName || '') + '</p>';
    html += '<p>Status: ' + (data.result || (data.building ? 'BUILDING' : 'UNKNOWN')) + '</p>';
    if (data.timestamp) {
      html += '<p>Time: ' + new Date(data.timestamp).toLocaleString() + '</p>';
    }
    if (data.changeSet && data.changeSet.items) {
      html += '<p>Changes: ' + data.changeSet.items.length + '</p>';
    }
    document.getElementById('buildStatus').innerHTML = html;
  } catch (e) {
    document.getElementById('buildStatus').innerHTML = 'Error fetching build status';
  }
}

window.addEventListener('load', loadDashboard, false);
