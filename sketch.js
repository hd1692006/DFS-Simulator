let nodes = [];
let edges = [];
let mode = "node";
let isRunning = false;
let selectedNode = null;
let isPaused = false;
let isDirected = false;
let runSpeed = 500;
let traveler = {
  x: 0,
  y: 0,
  active: false,
  currentId: null, // Lưu ID đỉnh người đang đứng
};

// Hàm di chuyển mượt giữa 2 đỉnh
async function animateTravel(fromId, toId) {
  let startNode = nodes.find((n) => n.id === fromId);
  let endNode = nodes.find((n) => n.id === toId);
  if (!startNode || !endNode) return;

  traveler.active = true;
  traveler.currentId = null; // Đang bay trên đường nên không đứng ở đỉnh nào cụ thể

  let steps = 30;
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    traveler.x = lerp(startNode.x, endNode.x, t);
    traveler.y = lerp(startNode.y, endNode.y, t);
    await new Promise((res) => setTimeout(res, 20));
  }

  traveler.active = false;
  traveler.currentId = toId; // Đã đến đích, đứng yên tại đây
}

function setup() {
  let container = document.getElementById("canvas-parent");
  let rect = container.getBoundingClientRect(); // Lấy khung thực tế
  // Tạo canvas khớp khít với khung bên phải
  let cnv = createCanvas(rect.width, rect.height);
  cnv.parent("canvas-parent");
  textAlign(CENTER, CENTER);
  textSize(16);
}

function windowResized() {
  let container = document.getElementById("canvas-parent");
  let rect = container.getBoundingClientRect();
  resizeCanvas(rect.width, rect.height);
}

function draw() {
  background(255);
  // Vẽ cạnh
  strokeWeight(2);
  // Trong hàm draw(), tìm đoạn vẽ cạnh:
  for (let i = 0; i < edges.length; i++) {
    let e = edges[i];
    let u = nodes.find((n) => n.id === e.u);
    let v = nodes.find((n) => n.id === e.v);

    if (!u || !v) continue;

    let reverseIdx = edges.findIndex((re) => re.u === e.v && re.v === e.u);
    let isTwoWay = isDirected && reverseIdx !== -1;

    if (isTwoWay) {
      // Luôn so sánh ID để cạnh 1->2 và 2->1 có dir khác nhau
      // Nhưng quan trọng là hàm drawCurveEdge bên dưới phải xử lý dir này
      let dir = e.u < e.v ? 1 : -1;
      drawCurveEdge(u, v, dir);
    } else {
      stroke(180);
      line(u.x, u.y, v.x, v.y);
      if (isDirected) drawArrow(u.x, u.y, v.x, v.y);
    }
  }

  // Vẽ dây khi đang tạo cạnh
  if (mode === "edge" && selectedNode !== null) {
    stroke(52, 152, 219, 150);
    line(selectedNode.x, selectedNode.y, mouseX, mouseY);
  }

  // Vẽ đỉnh
  for (let n of nodes) {
    stroke(44, 62, 80);
    fill(n.color);
    circle(n.x, n.y, 40);

    fill(n.color === "#ffffff" ? 0 : 255);
    noStroke();
    textSize(16);
    textAlign(CENTER, CENTER);
    text(n.id, n.x, n.y);
  }

  // Hiển thị hướng dẫn
  let status = document.getElementById("statusText").innerText;

  if (isRunning && isPaused) {
    let currentStatusText = document.getElementById("statusText").innerText;

    // Kiểm tra dấu hiệu kết thúc hoàn toàn (giống các bước trước)
    let isAlgorithmFinished =
      currentStatusText.includes("Kết quả") ||
      currentStatusText.includes("Tổng") ||
      currentStatusText.includes("Đường đi tìm thấy") ||
      currentStatusText.includes("Không tìm thấy đường đi");

    if (isAlgorithmFinished) {
      push();
      textAlign(CENTER, CENTER);
      textStyle(BOLD);

      // Vẽ nền mờ cho thông báo kết thúc để dễ nhìn
      noStroke();
      fill(0, 0, 0, 150);
      rectMode(CENTER);
      rect(width / 2, 45, 450, 60, 10);

      // Thông báo kết thúc chính
      fill("#f39c12"); // Màu cam
      textSize(26);
      text("🏁 THUẬT TOÁN ĐÃ KẾT THÚC", width / 2, 35);

      // Hướng dẫn nhỏ ở dưới
      textSize(18);
      fill(255);
      text("Nhấn SPACE để chạy thuật toán tiếp", width / 2, 60);
      pop();
    } else {
      push();
      textAlign(CENTER, CENTER);
      fill(231, 76, 60, 180); // Màu đỏ hơi trong suốt
      textSize(30);
      text("⌨ Nhấn SPACE để tiếp tục...", width / 2, 30);
      pop();
    }
  }
  let drawX,
    drawY,
    shouldDraw = false;

  if (traveler.active) {
    // Trường hợp đang di chuyển
    drawX = traveler.x;
    drawY = traveler.y;
    shouldDraw = true;
  } else if (traveler.currentId !== null) {
    // Trường hợp đứng yên tại một đỉnh
    let currentNode = nodes.find((n) => n.id === traveler.currentId);
    if (currentNode) {
      drawX = currentNode.x;
      drawY = currentNode.y;
      shouldDraw = true;
    }
  }

  if (shouldDraw) {
    push();
    textSize(50);
    textAlign(CENTER, CENTER);
    // Vẽ emoji dịch lên trên đỉnh một chút để không che số ID
    text("🏃", drawX, drawY - 25);
    pop();
  }
}

// Vẽ mũi tên
function drawArrow(x1, y1, x2, y2) {
  let angle = atan2(y2 - y1, x2 - x1);

  let arrowSize = 10;

  // lùi vào khỏi node
  let offset = 20;
  let x = x2 - offset * cos(angle);
  let y = y2 - offset * sin(angle);

  push();
  translate(x, y);
  rotate(angle);

  fill(0);
  noStroke();

  triangle(0, 0, -arrowSize, arrowSize / 2, -arrowSize, -arrowSize / 2);

  pop();
}

// Vẽ đường cong
function drawCurveEdge(u, v, dir) {
  let dx = v.x - u.x;
  let dy = v.y - u.y;
  let len = sqrt(dx * dx + dy * dy);
  if (len === 0) return;

  // TÍNH TOÁN CỐ ĐỊNH:
  // Dù đang vẽ u->v hay v->u, ta luôn lấy vector pháp tuyến của chiều "ID nhỏ -> ID lớn"
  // Điều này đảm bảo hệ trục tọa độ không bị lật 180 độ.

  let nx, ny;
  if (u.id < v.id) {
    nx = -dy / len;
    ny = dx / len;
  } else {
    // Nếu vẽ từ ID lớn về ID nhỏ, ta lấy đối của vector pháp tuyến ngược lại
    // để nó vẫn cùng hướng với thằng ID nhỏ -> ID lớn
    nx = dy / len;
    ny = -dx / len;
  }

  let curveOffset = 60; // Độ cong

  // Bây giờ dir = 1 và dir = -1 sẽ thực sự đẩy cx, cy về 2 phía khác nhau
  let cx = (u.x + v.x) / 2 + nx * curveOffset * dir;
  let cy = (u.y + v.y) / 2 + ny * curveOffset * dir;

  stroke(180);
  noFill();
  beginShape();
  vertex(u.x, u.y);
  quadraticVertex(cx, cy, v.x, v.y);
  endShape();

  drawArrow(cx, cy, v.x, v.y);
}

function hasReverseEdge(u, v) {
  return edges.some((e) => e.u === v && e.v === u);
}

// BIỂU DIỄN ĐỒ THỊ
function updateDataView(type = "matrix") {
  const display = document.getElementById("data-display");
  if (!display || nodes.length === 0) return;

  let n = nodes.length;
  let m = edges.length;
  let content = "";

  if (type === "matrix") {
    // content = `MA TRẬN KỀ:\n${n}\n`;
    for (let i = 1; i <= n; i++) {
      let row = [];
      for (let j = 1; j <= n; j++) {
        let hasEdge = edges.some((e) =>
          isDirected
            ? e.u === i && e.v === j
            : (e.u === i && e.v === j) || (e.u === j && e.v === i),
        );
        row.push(hasEdge ? 1 : 0);
      }
      content += row.join(" ") + "\n";
    }
  } else if (type === "incidence") {
    // content = `MA TRẬN LIÊN THÔNG:\n${n} ${m}\n`;
    for (let i = 1; i <= n; i++) {
      let row = [];
      for (let j = 0; j < m; j++) {
        let e = edges[j];
        if (isDirected) {
          if (e.u === i) row.push(1);
          else if (e.v === i) row.push(-1);
          else row.push(0);
        } else {
          row.push(e.u === i || e.v === i ? 1 : 0);
        }
      }
      content += row.join(" ") + "\n";
    }
  } else if (type === "adjList") {
    // content = `DANH SÁCH KỀ:\n${n}\n`;
    nodes.forEach((node) => {
      let neighbors = [];
      edges.forEach((e) => {
        if (e.u === node.id) neighbors.push(e.v);
        if (!isDirected && e.v === node.id) neighbors.push(e.u);
      });
      neighbors = [...new Set(neighbors)].sort((a, b) => a - b);
      let neighborsText = neighbors.length > 0 ? neighbors.join(" ") : "∅";
      content += `${node.id}: ${neighborsText}\n`;
    });
  } else if (type === "edgeList") {
    // content = `DANH SÁCH CẠNH:\n${n} ${m}\n`;
    let displayEdges = [];

    if (!isDirected) {
      // --- ĐỒ THỊ VÔ HƯỚNG ---
      // 1. Chuẩn hóa: Đảm bảo u luôn nhỏ hơn v
      // 2. Loại bỏ trùng lặp (nếu lỡ tay nối 1-2 và 2-1)
      let uniqueEdges = new Set();
      edges.forEach((e) => {
        // 🔥 ÉP HOÁN ĐỔI: Đỉnh nhỏ luôn là u, đỉnh lớn luôn là v
        let u = Math.min(e.u, e.v);
        let v = Math.max(e.u, e.v);

        let key = u + "-" + v;
        if (!uniqueEdges.has(key)) {
          uniqueEdges.add(key);
          displayEdges.push({ u: u, v: v }); // Thêm cặp đã hoán đổi vào mảng
        }
      });
    } else {
      // --- ĐỒ THỊ CÓ HƯỚNG ---
      // Giữ nguyên u, v vì chiều nối là quan trọng
      displayEdges = [...edges];
    }

    // --- LOGIC SẮP XẾP CHUNG ---
    // Ưu tiên sort đỉnh đầu (u) tăng dần.
    // Nếu đỉnh đầu bằng nhau, sort đỉnh cuối (v) tăng dần.
    displayEdges.sort((a, b) => {
      if (a.u !== b.u) return a.u - b.u;
      return a.v - b.v;
    });

    // Xuất nội dung ra bảng
    displayEdges.forEach((e) => {
      content += `${e.u} ${e.v}\n`;
    });
  }
  display.innerText = content;
}

// LOAD ĐỒ THỊ MẪU
function loadSampleGraph() {
  if (isRunning) return;

  let mode = prompt(
    "Chọn cách tạo đồ thị:\n1. Sinh từ genDataStatistic.py \n2. Sinh ngẫu nhiên\nNhập 1 hoặc 2:",
  );

  if (mode === "1") {
    let numVertices = prompt(
      "Nhập số đỉnh để sinh đồ thị (Chọn số chẵn >= 4):",
    );
    if (numVertices === null) return;

    let n = parseInt(numVertices);
    if (isNaN(n) || n < 4) {
      alert("Vui lòng nhập số chẵn lớn hơn hoặc bằng 4!");
      return;
    }

    alert("Hãy chạy genDataStatistic.py để sinh đồ thị với " + n + " đỉnh");

    loadJSON(
      "graph_data.json?t=" + Date.now(),
      function (dataFromFile) {
        if (!dataFromFile.nodes || dataFromFile.nodes.length === 0) return;

        nodes = [];
        edges = [];

        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        dataFromFile.nodes.forEach((node) => {
          if (node.x < minX) minX = node.x;
          if (node.x > maxX) maxX = node.x;
          if (node.y < minY) minY = node.y;
          if (node.y > maxY) maxY = node.y;
        });

        let graphW = maxX - minX || 1;
        let graphH = maxY - minY || 1;

        const paddingTop = 150;
        const paddingSide = 60;
        const paddingBottom = 60;

        let availableW = width - paddingSide * 2;
        let availableH = height - paddingTop - paddingBottom;

        let scaleX = availableW / graphW;
        let scaleY = availableH / graphH;
        const autoScale = Math.min(scaleX, scaleY);

        let startX = paddingSide + (availableW - graphW * autoScale) / 2;
        let startY = paddingTop + (availableH - graphH * autoScale) / 2;

        dataFromFile.nodes.forEach((n) => {
          nodes.push({
            id: n.id,
            x: (n.x - minX) * autoScale + startX,
            y: (n.y - minY) * autoScale + startY,
            color: "#ffffff",
          });
        });

        dataFromFile.edges.forEach((e) => {
          edges.push({ u: e.u, v: e.v });
        });

        rebuildGraph();
        if (nodes.length > 0) playerPos = { x: nodes[0].x, y: nodes[0].y };
        addLog(
          `Đã nạp đồ thị ${dataFromFile.nodes.length} đỉnh sau khi chạy genDataStatistic.py`,
          true,
        );
      },
      function (err) {
        alert("Không tìm thấy file graph_data.json!");
      },
    );
  } else if (mode === "2") {
    nodes = [];
    edges = [];

    // 1. Số đỉnh ngẫu nhiên (8-16)
    let n = floor(random(8, 17));

    // --- 2. TÍNH TÂM VÙNG TRẮNG ---
    let centerX = width / 2;
    let centerY = height / 2 + 50;

    // 🔥 3. KHỞI TẠO ĐỈNH (Dùng Grid ảo để thưa ngay từ đầu)
    let cols = 5;
    let rows = 4;
    let slots = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) slots.push({ c, r });
    }
    slots.sort(() => Math.random() - 0.5);

    for (let i = 0; i < n; i++) {
      let slot = slots[i % slots.length];
      nodes.push({
        id: i + 1,
        x: centerX + (slot.c - 2) * (width / 7) + random(-40, 40),
        y: centerY + (slot.r - 1.5) * (height / 6) + random(-40, 40),
        color: "#ffffff",
        vx: 0,
        vy: 0,
      });
    }

    // 🔥 4. THUẬT TOÁN LỰC ĐẨY (ÉP LỆCH TRỤC)
    for (let iter = 0; iter < 150; iter++) {
      nodes.forEach((node) => {
        node.vx = 0;
        node.vy = 0;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          let u = nodes[i];
          let v = nodes[j];
          let dx = u.x - v.x;
          let dy = u.y - v.y;
          let d = sqrt(dx * dx + dy * dy) || 1;

          if (d < 160) {
            let force = ((160 - d) / d) * 0.6;
            u.vx += dx * force;
            u.vy += dy * force;
          }

          // Ép lệch trục ít nhất 50px để tránh thẳng hàng tuyệt đối
          if (abs(dx) < 50) u.vx += (dx >= 0 ? 1 : -1) * 8;
          if (abs(dy) < 50) u.vy += (dy >= 0 ? 1 : -1) * 8;
        }
      }
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.35;
        node.vy *= 0.35;
        node.x = constrain(node.x, 120, width - 120);
        node.y = constrain(node.y, 200, height - 100);
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          let u = nodes[i];
          let v = nodes[j];

          if (dist(u.x, u.y, v.x, v.y) < 30) {
            u.x += random(-10, 10);
            u.y += random(-10, 10);
            v.x += random(-10, 10);
            v.y += random(-10, 10);
          }
        }
      }
    }

    // 🔥 5. NỐI CẠNH (KIỂM TRA ĐỈNH CHẶN ĐƯỜNG)
    edges = [];
    let attempts = 0;

    // 5.1 Tạo cây khung (Spanning Tree) để liên thông
    let connected = [nodes[0]];
    let remaining = nodes.slice(1);
    while (remaining.length > 0) {
      let uIdx = floor(random(connected.length));
      let vIdx = floor(random(remaining.length));
      let u = connected[uIdx];
      let v = remaining[vIdx];

      // CHỈ NỐI NẾU KHÔNG CÓ ĐỈNH NÀO NẰM GIỮA U VÀ V
      if (isPathClearOfNodes(u, v, nodes)) {
        edges.push({ u: u.id, v: v.id });
        connected.push(v);
        remaining.splice(vIdx, 1);
      }
      attempts++;
      if (attempts > 500) break; // Tránh treo máy
    }

    // 5.2 Thêm cạnh ngẫu nhiên (Tỉ lệ 1.3n)
    let targetEdges = floor(n * 1.3);
    let extraAttempts = 0;
    while (edges.length < targetEdges && extraAttempts < 1000) {
      let u = nodes[floor(random(n))];
      let v = nodes[floor(random(n))];

      if (u.id !== v.id) {
        let exists = edges.some(
          (e) =>
            (e.u === u.id && e.v === v.id) || (e.v === u.id && e.u === v.id),
        );
        if (!exists && dist(u.x, u.y, v.x, v.y) > 140) {
          // KIỂM TRA ĐỈNH CHẶN ĐƯỜNG + GÓC ĐẸP
          if (
            isPathClearOfNodes(u, v, nodes) &&
            checkDoubleAngle(u, v, edges)
          ) {
            edges.push({ u: u.id, v: v.id });
          }
        }
      }
      extraAttempts++;
    }

    rebuildGraph();
    addLog(`Đã sinh đồ thị ${n} đỉnh`, true);
  }
}

function isPathClearOfNodes(u, v, allNodes) {
  for (let node of allNodes) {
    if (node.id === u.id || node.id === v.id) continue;

    // Tính khoảng cách từ đỉnh 'node' đến đoạn thẳng u-v
    let d = distToSegment(node.x, node.y, u.x, u.y, v.x, v.y);

    // Nếu khoảng cách < 30px, coi như đỉnh này đang nằm trên/rất sát đường nối u-v
    // 30px là đủ để chứa cái hình tròn của đỉnh (radius 15-20)
    if (d < 30) return false;
  }
  return true;
}

// Hàm kiểm tra góc giữa các cạnh để tránh dính nhau
function checkDoubleAngle(u, v, currentEdges) {
  const minAngle = 35; // Tăng góc tối thiểu lên 35 độ cho thưa hẳn

  // Kiểm tra tại đỉnh u
  if (!isAngleClear(u, v, currentEdges, minAngle)) return false;
  // Kiểm tra tại đỉnh v
  if (!isAngleClear(v, u, currentEdges, minAngle)) return false;

  return true;
}

function isAngleClear(pivot, target, currentEdges, minAngle) {
  let newAngle = atan2(target.y - pivot.y, target.x - pivot.x);

  for (let e of currentEdges) {
    let other = null;
    if (e.u === pivot.id) other = nodes.find((n) => n.id === e.v);
    else if (e.v === pivot.id) other = nodes.find((n) => n.id === e.u);

    if (other) {
      let existingAngle = atan2(other.y - pivot.y, other.x - pivot.x);
      let diff = abs(degrees(newAngle - existingAngle)) % 360;
      if (diff > 180) diff = 360 - diff;
      if (diff < minAngle) return false;
    }
  }
  return true;
}

// BỔ SUNG LOGIC ĐIỀU KHIỂN CHẠY AUTO/STEP
function toggleSpeedControl() {
  document.getElementById("speedControl").style.display =
    document.getElementById("runMode").value === "auto" ? "block" : "none";
}

async function waitForStep() {
  const mode = document.getElementById("runMode").value;
  // Chế độ Auto
  if (mode === "auto") {
    let speed = document.getElementById("runSpeed").value;
    return new Promise((res) => setTimeout(res, 2000 - speed)); // Speed càng cao chạy càng nhanh
  }
  // Chế độ Step-by-step: Đợi nhấn Space
  isPaused = true;
  return new Promise((res) => {
    const check = () => {
      if (!isPaused) res();
      else requestAnimationFrame(check);
    };
    check();
  });
}

// --- HỆ THỐNG ĐIỀU KHIỂN ---
function addLog(msg, highlight = false) {
  let logBox = document.getElementById("log-box");
  if (!logBox) return;
  let spanClass = highlight ? "class='log-highlight'" : "";
  logBox.innerHTML += `<div class="log-entry"><span ${spanClass}>> ${msg}</span></div>`;
  logBox.scrollTop = logBox.scrollHeight;
}

function updateStatus(m) {
  document.getElementById("statusText").innerText = m;
}

function keyPressed() {
  if (key === " ") {
    isPaused = false; // Nhấn Space thì chạy tiếp 1 bước
  }
}

// --- THUẬT TOÁN ---

async function startDFS() {
  if (isRunning || nodes.length === 0) return;

  let s = parseInt(document.getElementById("startNode").value);
  if (isNaN(s) || !nodes[s - 1]) return alert("Gốc không hợp lệ");

  isRunning = true;
  resetColors();
  traveler.currentId = s;
  lastPos = s;
  addLog(`-- BẮT ĐẦU DFS TỪ ĐỈNH ${s} --`, true);

  let chuaxet = new Array(nodes.length + 1).fill(true);
  let stack = [];
  let stackUI = [];
  let dfsOrder = [];

  stack.push(s);
  stackUI.push(s);
  updateStackUI([...stackUI]);
  addLog(`PUSH đỉnh ${s} vào stack`);

  chuaxet[s] = false;
  dfsOrder.push(s);

  nodes[s - 1].color = "#e74c3c";
  traveler.currentId = s;
  updateStatus(`Đang thăm đỉnh ${s}`);
  addLog(`Thăm đỉnh ${s}`);

  await waitForStep();

  while (stack.length > 0) {
    let u = stack.pop();
    stackUI.pop();
    updateStackUI([...stackUI]);
    addLog(`POP đỉnh ${u} khỏi stack`);

    let neighbors = [...nodes[u - 1].adj].sort((a, b) => a - b);
    let found = false;

    for (let v of neighbors) {
      if (chuaxet[v]) {
        addLog(`Đi từ đỉnh ${u} → ${v}`);

        chuaxet[v] = false;
        dfsOrder.push(v);

        nodes[v - 1].color = "#e74c3c";

        stack.push(u);
        stackUI.push(u);
        addLog(`PUSH đỉnh ${u} vào stack`);

        stack.push(v);
        stackUI.push(v);
        addLog(`PUSH đỉnh ${v} vào stack`);

        updateStackUI([...stackUI]);

        // animation
        await animateTravel(u, v);
        traveler.currentId = v;

        updateStatus(`Đang thăm đỉnh ${v}`);
        addLog(`Thăm đỉnh ${v}`);

        await waitForStep();

        found = true;
        break;
      }
    }

    if (!found) {
      nodes[u - 1].color = "#2ecc71";
      addLog(`Xong đỉnh ${u}`);

      // 🔥 quay lui
      if (stack.length > 0) {
        let prev = stack[stack.length - 1];

        await animateTravel(u, prev);
        traveler.currentId = prev;

        addLog(`Quay lui từ đỉnh ${u} về ${prev}`);
        updateStatus(`Quay lui từ đỉnh ${u} về ${prev}`);

        await waitForStep();
      }

      updateStackUI([...stack]);
    }
  }

  addLog(`Kết quả: DFS(${s}) = ${dfsOrder.join(", ")}`, true);
  updateStatus(`Kết quả: DFS(${s}) = ${dfsOrder.join(", ")}`);

  updateStackUI([]);
  await waitForStep();
  isRunning = false;
}

async function findComponents() {
  if (isRunning || nodes.length === 0) return;

  isRunning = true;
  resetColors();
  addLog("-- TÌM THÀNH PHẦN LIÊN THÔNG --", true);

  let chuaxet = new Array(nodes.length + 1).fill(true);
  let count = 0;
  let colors = ["#9b59b6"];
  let lastPos = null;

  let startIdx = parseInt(document.getElementById("startNode").value);
  if (isNaN(startIdx) || !nodes[startIdx - 1]) startIdx = 1;

  let checkOrder = [startIdx];
  for (let i = 1; i <= nodes.length; i++) {
    if (i !== startIdx) checkOrder.push(i);
  }

  for (let i of checkOrder) {
    if (chuaxet[i]) {
      count++;

      let stack = [];
      let stackUI = [];

      // 🔥 PUSH đỉnh đầu
      stack.push(i);
      stackUI.push(i);
      updateStackUI([...stackUI]);
      addLog(`PUSH đỉnh ${i} vào stack`);

      chuaxet[i] = false;

      traveler.currentId = i;
      updateStatus(`TPLT ${count} bắt đầu từ ${i}`);
      addLog(`-- TPLT ${count} --`, true);

      nodes[i - 1].color = colors[(count - 1) % colors.length];
      addLog(`Đỉnh ${i} ∈ TPLT ${count}`);
      await waitForStep();

      while (stack.length > 0) {
        let u = stack.pop();
        stackUI.pop();
        updateStackUI([...stackUI]);
        addLog(`POP đỉnh ${u} khỏi stack`);

        let neighbors = [...nodes[u - 1].adj].sort((a, b) => a - b);
        let found = false;

        for (let v of neighbors) {
          if (chuaxet[v]) {
            addLog(`Đi từ đỉnh ${u} → ${v}`);

            // 🔥 đánh dấu ngay khi thăm
            chuaxet[v] = false;

            // 🔥 PUSH lại u rồi PUSH v
            stack.push(u);
            stackUI.push(u);
            addLog(`PUSH đỉnh ${u} vào stack`);

            stack.push(v);
            stackUI.push(v);
            addLog(`PUSH đỉnh ${v} vào stack`);

            updateStackUI([...stackUI]);

            nodes[v - 1].color = colors[(count - 1) % colors.length];

            await animateTravel(u, v);
            traveler.currentId = v;

            addLog(`Đỉnh ${v} ∈ TPLT ${count}`);
            await waitForStep();

            found = true;
            break;
          }
        }

        if (!found) {
          nodes[u - 1].color = "#2ecc71";
          addLog(`Xong đỉnh ${u}`);

          if (stack.length > 0) {
            let prev = stack[stack.length - 1];

            await animateTravel(u, prev);
            traveler.currentId = prev;

            addLog(`Quay lui từ đỉnh ${u} về ${prev}`);
            await waitForStep();
          }
        }
      }

      updateStatus(`XONG TPLT ${count}`);
      await waitForStep();
    }
  }

  updateStatus(`Tổng: ${count} thành phần liên thông`);
  addLog(`Tổng: ${count} thành phần liên thông`, true);

  updateStackUI([]);
  await waitForStep();
  isRunning = false;
}

async function findPath() {
  if (isRunning || nodes.length === 0) return;

  let s = parseInt(document.getElementById("startNode").value);
  let e = parseInt(document.getElementById("endNode").value);

  if (isNaN(s) || !nodes[s - 1] || isNaN(e) || !nodes[e - 1]) {
    return alert("Đỉnh không hợp lệ");
  }

  isRunning = true;
  resetColors();
  addLog(`-- TÌM ĐƯỜNG ĐI TỪ ĐỈNH ${s} ➔ ${e} --`, true);
  updateStatus(`Đang tìm đường đi từ đỉnh ${s} → ${e}`);

  let chuaxet = new Array(nodes.length + 1).fill(true);
  let parent = new Array(nodes.length + 1).fill(null);

  let stack = [];
  let stackUI = [];

  let lastPos = s;
  let found = false;

  // 🔥 push đỉnh đầu
  stack.push(s);
  stackUI.push(s);
  updateStackUI([...stackUI]);
  addLog(`PUSH đỉnh ${s} vào stack`);

  chuaxet[s] = false;

  nodes[s - 1].color = "#2284e6";
  traveler.currentId = s;
  addLog(`Thăm đỉnh ${s}`);
  await waitForStep();

  while (stack.length > 0) {
    let u = stack.pop();
    stackUI.pop();
    updateStackUI([...stackUI]);
    addLog(`POP đỉnh ${u} khỏi stack`);

    if (u === e) {
      found = true;
      addLog(`Đã tới đỉnh ${e}`, true);
      break;
    }

    let neighbors = [...nodes[u - 1].adj].sort((a, b) => a - b);
    let goDeeper = false;

    for (let v of neighbors) {
      if (chuaxet[v]) {
        addLog(`Đi từ đỉnh ${u} → ${v}`);

        chuaxet[v] = false;
        parent[v] = u;

        // 🔥 push lại u rồi push v
        stack.push(u);
        stackUI.push(u);
        addLog(`PUSH đỉnh ${u} vào stack`);

        stack.push(v);
        stackUI.push(v);
        addLog(`PUSH đỉnh ${v} vào stack`);

        updateStackUI([...stackUI]);

        await animateTravel(lastPos, v);
        lastPos = v;

        nodes[v - 1].color = "#2284e6";
        addLog(`Thăm đỉnh ${v}`);
        await waitForStep();

        goDeeper = true;
        break;
      }
    }

    // 🔥 nếu không đi sâu được → quay lui
    if (!goDeeper) {
      nodes[u - 1].color = "#2ecc71";
      addLog(`Xong đỉnh ${u}`);

      if (stack.length > 0) {
        let prev = stack[stack.length - 1];

        await animateTravel(lastPos, prev);
        lastPos = prev;

        addLog(`Quay lui từ đỉnh ${u} về ${prev}`);
        await waitForStep();
      }
    }
  }

  // 🔥 truy vết đường đi
  if (found) {
    let path = [];
    let cur = e;

    while (cur !== null) {
      path.push(cur);
      cur = parent[cur];
    }

    path.reverse();

    for (let x of path) {
      nodes[x - 1].color = "#12f3e8";
    }

    addLog(`Đường đi tìm thấy: ${path.join(" ➔ ")}`, true);
    updateStatus(`Đường đi tìm thấy: ${path.join(" → ")}`);
  } else {
    addLog(`Không tìm thấy đường đi từ đỉnh ${s} ➔ ${e}`, true);
    updateStatus(`Không tìm thấy đường đi`);
  }

  updateStackUI([]);
  await waitForStep();
  isRunning = false;
}

// --- QUẢN LÝ ĐỒ THỊ ---
function mousePressed() {
  if (isRunning || mouseX < 0 || mouseX > width) return;

  // CHỨC NĂNG XÓA (CLICK CHUỘT PHẢI)
  if (mouseButton === RIGHT) {
    // 1. Kiểm tra xóa Đỉnh
    let nodeIdx = nodes.findIndex((n) => dist(mouseX, mouseY, n.x, n.y) < 25);
    if (nodeIdx !== -1) {
      let id = nodes[nodeIdx].id;
      if (confirm(`Bạn có chắc muốn xóa ĐỈNH ${id} và các cạnh liên quan ?`)) {
        edges = edges.filter((e) => e.u !== id && e.v !== id);
        nodes.splice(nodeIdx, 1);
        rebuildGraph();
        updateStatus(`Đã xóa đỉnh ${id}`);
        addLog(`Đã xóa đỉnh ${id}`, true);
      }
      return false;
    }

    // 2. Kiểm tra xóa Cạnh (Hỗ trợ cạnh cong 2 chiều)
    for (let i = edges.length - 1; i >= 0; i--) {
      let e = edges[i];
      let u = nodes.find((n) => n.id === e.u);
      let v = nodes.find((n) => n.id === e.v);

      if (u && v) {
        let reverseIdx = edges.findIndex((re) => re.u === e.v && re.v === e.u);
        let isTwoWay = isDirected && reverseIdx !== -1;

        if (isTwoWay) {
          let dir = e.u < e.v ? 1 : -1;
          let dx = v.x - u.x;
          let dy = v.y - u.y;
          let len = sqrt(dx * dx + dy * dy);

          // Logic vector pháp tuyến cố định đã sửa ở bước trước
          let nx = u.id < v.id ? -dy / len : dy / len;
          let ny = u.id < v.id ? dx / len : -dx / len;

          let curveOffset = 60;
          let cx = (u.x + v.x) / 2 + nx * curveOffset * dir;
          let cy = (u.y + v.y) / 2 + ny * curveOffset * dir;

          // KIỂM TRA VA CHẠM TOÀN BỘ ĐƯỜNG CONG
          let d = distToBezier(mouseX, mouseY, u.x, u.y, cx, cy, v.x, v.y);

          if (d < 15) {
            // Click vào bất cứ đâu trên sợi dây trong khoảng 15px
            if (confirm(`Xóa cạnh ${e.u} -> ${e.v}?`)) {
              edges.splice(i, 1);
              rebuildGraph();
              return false;
            }
          }
        } else {
          // Cạnh thẳng bình thường
          d = distToSegment(mouseX, mouseY, u.x, u.y, v.x, v.y);
          if (d < 15) {
            if (confirm(`Bạn có chắc muốn xóa cạnh giữa ${e.u} và ${e.v}?`)) {
              edges.splice(i, 1);
              rebuildGraph();
              return false;
            }
          }
        }
      }
    }
    return false;
  }

  // CHỨC NĂNG (CLICK CHUỘT TRÁI)
  if (mouseButton === LEFT) {
    if (mode === "node") {
      let newNodeId = nodes.length + 1;
      nodes.push({
        id: newNodeId,
        x: mouseX,
        y: mouseY,
        color: "#ffffff",
        adj: [],
      });
      updateStatus(`Đã thêm đỉnh mới: ${newNodeId}`);
    } else {
      let clicked = nodes.find((n) => dist(mouseX, mouseY, n.x, n.y) < 25);
      if (clicked) {
        if (!selectedNode) {
          selectedNode = clicked;
          clicked.color = "#f1c40f";
          updateStatus(
            `Đã chọn đỉnh ${clicked.id}. Chọn đỉnh tiếp theo để nối cạnh.`,
          );
        } else {
          if (selectedNode.id !== clicked.id) {
            let exists;
            if (isDirected) {
              // 🔥 chỉ check đúng chiều
              exists = edges.find(
                (e) => e.u === selectedNode.id && e.v === clicked.id,
              );
            } else {
              // 🔥 vô hướng → check cả 2 chiều
              exists = edges.find(
                (e) =>
                  (e.u === selectedNode.id && e.v === clicked.id) ||
                  (e.v === selectedNode.id && e.u === clicked.id),
              );
            }
            if (!exists) {
              edges.push({ u: selectedNode.id, v: clicked.id });
              rebuildGraph();
              if (isDirected) {
                updateStatus(`Đã nối cạnh ${selectedNode.id} → ${clicked.id}`);
              } else {
                updateStatus(
                  `Đã nối cạnh giữa đỉnh ${selectedNode.id} và ${clicked.id}`,
                );
              }
            } else {
              if (isDirected) {
                updateStatus(
                  `Đã tồn tại cạnh ${selectedNode.id} → ${clicked.id}`,
                );
              } else {
                updateStatus(
                  `Đã tồn tại cạnh giữa đỉnh ${selectedNode.id} và ${clicked.id}`,
                );
              }
            }
          }
          selectedNode.color = "#ffffff";
          selectedNode = null;
        }
      }
    }
  }
}

function distToSegment(px, py, x1, y1, x2, y2) {
  let dx = x2 - x1;
  let dy = y2 - y1;
  let l2 = dx * dx + dy * dy;
  if (l2 === 0) return dist(px, py, x1, y1);
  let t_fixed = ((px - x1) * dx + (py - y1) * dy) / l2;
  t_fixed = Math.max(0, Math.min(1, t_fixed));

  return dist(px, py, x1 + t_fixed * dx, y1 + t_fixed * dy);
}

// function distPointToSegment(px, py, ax, ay, bx, by) {
//   let dx = bx - ax;
//   let dy = by - ay;

//   if (dx === 0 && dy === 0) {
//     return dist(px, py, ax, ay);
//   }

//   let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
//   t = constrain(t, 0, 1);

//   let cx = ax + t * dx;
//   let cy = ay + t * dy;

//   return dist(px, py, cx, cy);
// }

function distToBezier(px, py, x1, y1, cx, cy, x2, y2) {
  let minDist = Infinity;
  let steps = 10; // Chia đường cong làm 10 đoạn để kiểm tra

  let prevX = x1;
  let prevY = y1;

  for (let i = 1; i <= steps; i++) {
    let t = i / steps;
    // Công thức Bezier bậc 2
    let x = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    let y = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;

    // Tính khoảng cách từ chuột đến đoạn thẳng nhỏ (prev -> hiện tại)
    let d = distToSegment(px, py, prevX, prevY, x, y);
    if (d < minDist) minDist = d;

    prevX = x;
    prevY = y;
  }
  return minDist;
}

function updateStackUI(s) {
  let container = document.getElementById("stack-visual");
  if (!container) return;

  if (!s || s.length === 0) {
    container.innerHTML = "";
    return;
  }

  // 1. Cập nhật nội dung (Đảo ngược để đỉnh nằm trên cùng)
  container.innerHTML = s
    .slice()
    .reverse()
    .map((id) => `<div class="stack-item">Đỉnh ${id}</div>`)
    .join("");
}

function setMode(m) {
  mode = m;
  document.getElementById("nodeBtn").className = m === "node" ? "active" : "";
  document.getElementById("edgeBtn").className = m === "edge" ? "active" : "";
}

function resetColors() {
  nodes.forEach((n) => (n.color = "#ffffff"));
}

function changeGraphType() {
  let type = document.getElementById("graphType").value;
  isDirected = type === "directed";

  rebuildGraph();

  addLog(`Đã chuyển sang đồ thị ${isDirected ? "có hướng" : "vô hướng"}`, true);
}

function resetGraph() {
  if (isRunning) return;
  if (confirm("Bạn có chắc chắn muốn xóa toàn bộ đồ thị không?")) {
    nodes = [];
    edges = [];
    isRunning = false;
    isPaused = false;
    selectedNode = null;
    updateStatus("Sẵn sàng.");
    updateStackUI([]);
    if (traveler) traveler.currentId = null;
    let logBox = document.getElementById("log-box");
    if (logBox) logBox.innerHTML = "";
  }
}

function rebuildGraph() {
  // BƯỚC 1: Đánh lại ID từ 1
  nodes.forEach((n, index) => {
    let oldId = n.id;

    // đổi sang ID tạm (âm)
    edges.forEach((e) => {
      if (e.u === oldId) e.u = -100 - index;
      if (e.v === oldId) e.v = -100 - index;
    });

    n.id = index + 1; // ✅ bắt đầu từ 1
  });

  // chuyển ID tạm về ID mới
  edges.forEach((e) => {
    if (e.u <= -100) e.u = Math.abs(e.u) - 100 + 1;
    if (e.v <= -100) e.v = Math.abs(e.v) - 100 + 1;
  });

  // BƯỚC 2: build adjacency list (index 1-based)
  nodes.forEach((n) => (n.adj = []));

  edges.forEach((e) => {
    if (nodes[e.u - 1] && nodes[e.v - 1]) {
      nodes[e.u - 1].adj.push(e.v);

      if (!isDirected) {
        nodes[e.v - 1].adj.push(e.u);
      }
    }
  });
  updateDataView("matrix");
}

// Chặn menu chuột phải của trình duyệt trên toàn bộ trang web
document.oncontextmenu = function () {
  return false;
};
