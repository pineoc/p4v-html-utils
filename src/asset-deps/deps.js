async function runOnload() {
  let selectedFile = '';
  try {
    const sel = await p4vjs.getSelection();
    if (sel && sel.files && sel.files.length > 0) {
      selectedFile = sel.files[0];
    }
  } catch (e) {
    // ignore if p4vjs is not available
  }
  if (selectedFile) {
    document.getElementById('filePath').textContent = selectedFile;
    await loadMeta(selectedFile);
    await loadDeps(selectedFile);
  }
}

async function loadMeta(file) {
  try {
    const result = await p4vjs.p4(`fstat "${file}"`);
    document.getElementById('metadata').textContent = JSON.stringify(result.data, null, 2);
  } catch (e) {
    document.getElementById('metadata').textContent = 'Unable to load metadata';
  }
}

async function loadDeps(file) {
  try {
    const resp = await fetch(`http://localhost:5000/deps?asset=${encodeURIComponent(file)}`);
    const data = await resp.json();
    const container = document.getElementById('depsContainer');
    container.innerHTML = '';
    const tree = buildTree(data);
    const ul = document.createElement('ul');
    ul.appendChild(tree);
    container.appendChild(ul);
  } catch (e) {
    document.getElementById('depsContainer').textContent = 'Failed to load dependency data';
  }
}

function buildTree(node) {
  const li = document.createElement('li');
  li.textContent = node.name || node.asset || node;
  if (node.dependencies && node.dependencies.length > 0) {
    const ul = document.createElement('ul');
    node.dependencies.forEach(function (child) {
      ul.appendChild(buildTree(child));
    });
    li.appendChild(ul);
  }
  return li;
}

window.addEventListener('load', runOnload, false);
