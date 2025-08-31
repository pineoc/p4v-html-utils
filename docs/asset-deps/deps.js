// deps.js
/// Selection helpers ---------------------------------------------------------

// p4vjs.getSelection() -> "p4:///files/...,p4:///files/..." 형태 문자열을 배열로 변환
async function getSelectedUris() {
  try {
    const raw = (await p4vjs.getSelection()) || "";
    return raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
  } catch (e) {
    // p4vjs 미존재 환경 등은 빈 배열
    return [];
  }
}

// 파일 URI만 필터링
function filterFileUris(uris) {
  return uris.filter(u => u.startsWith("p4:///files/"));
}

// p4:///files/… -> //… (Perforce depot path)
function toDepotPath(uri) {
  const m = uri.match(/^p4:\/\/\/files\/(.+)$/);
  return m ? `//${m[1]}` : null;
}

// //…/Content/Path/Asset.uasset -> /Game/Path/Asset
// //…/Content/Path/Map.umap    -> /Game/Path/Map
function toUnrealAssetPath(depotPath) {
  // Content 이후의 경로만 추출
  const idx = depotPath.toLowerCase().indexOf("/content/");
  if (idx === -1) return null;
  const afterContent = depotPath.substring(idx + "/content/".length);

  // 확장자 제거(.uasset/.umap)
  const withoutExt = afterContent.replace(/\.(uasset|umap)$/i, "");

  // /Game prefix 부여, 윈도우 백슬래시 방지
  return "/Game/" + withoutExt.replace(/\\/g, "/");
}

/// UI helpers ---------------------------------------------------------------

function $(sel) {
  return document.querySelector(sel);
}

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => (el[k] = v));
  children.forEach((c) => el.appendChild(c));
  return el;
}

function renderSelectionList(depotPaths) {
  const list = createEl("ul");
  depotPaths.forEach((p) => {
    list.appendChild(createEl("li", { textContent: p }));
  });
  return list;
}

function renderDepsTree(node) {
  const li = document.createElement("li");
  li.textContent = node.name || node.asset || node;
  if (node.dependencies && node.dependencies.length > 0) {
    const ul = document.createElement("ul");
    node.dependencies.forEach((child) => {
      ul.appendChild(renderDepsTree(child));
    });
    li.appendChild(ul);
  }
  return li;
}

/// P4V / backend calls ------------------------------------------------------

async function loadMeta(depotPath) {
  try {
    const result = await p4vjs.p4(`fstat "${depotPath}"`);
    return result.data || result; // 환경별 반환 형태 대응
  } catch (e) {
    return { error: "Unable to load metadata" };
  }
}

async function loadDepsForAsset(unrealAssetPath) {
  try {
    const resp = await fetch(
      `http://localhost:5000/deps?asset=${encodeURIComponent(unrealAssetPath)}`
    );
    return await resp.json();
  } catch (e) {
    return { error: "Failed to load dependency data" };
  }
}

/// Page orchestration -------------------------------------------------------

let lastSelectionKey = ""; // 실시간 갱신을 위한 변경 감지

async function refreshFromSelection() {
  // 1) 현재 선택 가져오기
  const uris = filterFileUris(await getSelectedUris());
  const depotPaths = uris.map(toDepotPath).filter(Boolean);

  // 변경 없으면 스킵
  const key = depotPaths.join("|");
  if (key === lastSelectionKey) return;
  lastSelectionKey = key;

  // 2) 상단: 선택 파일 리스트 렌더
  const selectedBox = $("#selectedBox");
  selectedBox.innerHTML = "";
  if (depotPaths.length === 0) {
    selectedBox.appendChild(createEl("p", { textContent: "No selection" }));
    $("#depsRoot").innerHTML = "";
    return;
  }
  selectedBox.appendChild(renderSelectionList(depotPaths));

  // 3) 파일별 메타/디펜던시 렌더
  const root = $("#depsRoot");
  root.innerHTML = "";

  for (const depotPath of depotPaths) {
    const unrealPath = toUnrealAssetPath(depotPath);

    const card = createEl("div", { className: "box" });
    const title = createEl("h3", {
      className: "title is-6",
      textContent: depotPath,
    });

    // 메타데이터
    const metaPre = createEl("pre", { textContent: "Loading metadata..." });
    loadMeta(depotPath).then((meta) => {
      metaPre.textContent =
        meta && !meta.error
          ? JSON.stringify(meta, null, 2)
          : (meta && meta.error) || "Unable to load metadata";
    });

    // 디펜던시
    const depsWrap = createEl("div", { textContent: "Loading dependencies..." });
    if (unrealPath) {
      loadDepsForAsset(unrealPath).then((tree) => {
        if (!tree || tree.error) {
          depsWrap.textContent = (tree && tree.error) || "Failed to load dependency data";
          return;
        }
        depsWrap.textContent = "";
        const ul = document.createElement("ul");
        ul.appendChild(renderDepsTree(tree));
        depsWrap.appendChild(ul);
      });
    } else {
      depsWrap.textContent =
        "Not an Unreal asset path (expected .../Content/*.uasset or *.umap)";
    }

    card.appendChild(title);
    card.appendChild(createEl("h4", { className: "subtitle is-6", textContent: "Metadata" }));
    card.appendChild(metaPre);
    card.appendChild(createEl("h4", { className: "subtitle is-6", textContent: "Dependencies" }));
    card.appendChild(depsWrap);
    root.appendChild(card);
  }
}

// P4V 선택 변경 감지: 이벤트가 있으면 사용, 없으면 폴링
function attachRealtimeSelectionWatcher() {
  let hasBoundEvent = false;

  // 1) 이벤트 기반 (가능한 경우)
  try {
    // 일부 배포본에서 제공될 수 있는 커스텀 이벤트 이름들 시도
    const handler = () => refreshFromSelection();
    ["p4vjs.selectionChanged", "selectionChanged", "p4v-selection"]
      .forEach(evt => {
        window.addEventListener(evt, handler, false);
        hasBoundEvent = true;
      });
  } catch (e) { /* noop */ }

  // 2) 폴링 기반 (fallback)
  if (!hasBoundEvent) {
    setInterval(refreshFromSelection, 500); // 0.5초 주기
  }
}

// 초기화
async function runOnload() {
  await refreshFromSelection();
  attachRealtimeSelectionWatcher();
}

window.addEventListener("load", runOnload, false);
