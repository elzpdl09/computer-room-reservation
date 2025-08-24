let tableA, tableB;
let roomDataA = {}, roomDataB = {};
const timeMap = { "1": "1타임(18:50~19:40)", "2": "2타임(19:50~20:40)", "3": "3타임(20:50~21:40)" };

// ======================
// 테이블 생성
// ======================
function createTable(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const headerRow = ["예약 타임", "인원수", "대표 전화번호", "이름", "취소버튼"]; // 마지막 컬럼 추가
  const headerCol = ["1","2","3"];

  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";

  const colgroup = document.createElement("colgroup");
  colgroup.innerHTML = `<col style="width:20%;"><col style="width:15%;"><col style="width:25%;"><col style="width:25%;"><col style="width:15%;">`;
  table.appendChild(colgroup);

  const header = document.createElement("tr");
  headerRow.forEach(text => {
    const cell = document.createElement("th");
    cell.innerText = text;
    cell.style.border = "1px solid #999";
    cell.style.padding = "5px";
    cell.style.backgroundColor = "#f0f0f0";
    header.appendChild(cell);
  });
  table.appendChild(header);

  headerCol.forEach(term => {
    const row = document.createElement("tr");
    row.setAttribute("data-term", term);

    const termCell = document.createElement("td");
    termCell.innerText = timeMap[term];
    termCell.style.border = "1px solid #999";
    termCell.style.padding = "5px";
    row.appendChild(termCell);

    for (let i = 0; i < 4; i++) { // 데이터 컬럼 + 취소 버튼 포함
      const cell = document.createElement("td");
      cell.style.border = "1px solid #999";
      cell.style.padding = "5px";
      row.appendChild(cell);
    }

    table.appendChild(row);
  });

  container.appendChild(table);
  return table;
}

// ======================
// 테이블 업데이트
// ======================
function updateTable(table, roomData, deleteUrl) {
  table.querySelectorAll("tr[data-term]").forEach(row => {
    const term = row.getAttribute("data-term");
    const item = roomData[term];

    row.cells[1].innerText = item ? item.people_number || "" : "";
    row.cells[2].innerText = item ? item.tel || "" : "";
    row.cells[3].innerText = item ? item.name || "" : "";

    // ❌ 아이콘 취소 버튼 항상 표시
    row.cells[4].innerHTML = "";
    const cancelBtn = document.createElement("img");
    cancelBtn.src = "https://cdn-icons-png.flaticon.com/512/1828/1828665.png"; // ❌ 아이콘
    cancelBtn.alt = "취소";
    cancelBtn.style.width = "24px";
    cancelBtn.style.height = "24px";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.style.display = "block";
    cancelBtn.style.margin = "0 auto";

    cancelBtn.addEventListener("click", async () => {
      if (!confirm(`${timeMap[term]} 예약을 취소하시겠습니까?`)) return;
      try {
        const res = await fetch(deleteUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservation_term: term })
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.message);
        alert("예약이 취소되었습니다!");
        await loadData(deleteUrl.replace("/delete_reservation", "/load_data")
                                .replace("/delete_reservation_b", "/load_data_b"), 
                       roomData, table, deleteUrl);
      } catch (err) {
        alert("취소 실패: " + err.message);
      }
    });

    row.cells[4].appendChild(cancelBtn);
  });
}

// ======================
// 데이터 로드
// ======================
async function loadData(apiUrl, roomDataObj, table, deleteUrl) {
  const res = await fetch(apiUrl);
  const data = await res.json();
  Object.keys(roomDataObj).forEach(k => delete roomDataObj[k]);
  data.forEach(item => roomDataObj[item.reservation_term] = item);
  updateTable(table, roomDataObj, deleteUrl);
}

// ======================
// 예약 제출
// ======================
async function submitReservation(reservationTermId, peopleId, telId, nameId, updateUrl, saveUrl, roomDataObj, table, deleteUrl) {
  const reservation_term = document.getElementById(reservationTermId).value;
  const people_number = document.getElementById(peopleId).value;
  const tel = document.getElementById(telId).value;
  const name = document.getElementById(nameId).value;

  if (!reservation_term || !["1","2","3"].includes(reservation_term)) return alert("예약타임 확인 필요");

  const payload = { reservation_term, people_number, tel, name };

  try {
    const resLocal = await fetch(updateUrl, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const resultLocal = await resLocal.json();
    if (!resultLocal.success) return alert("예약 등록 실패: " + resultLocal.message);

    alert("예약 등록 및 DB 저장 완료!");
    await loadData(updateUrl.replace("/update_local","/load_data")
                         .replace("/update_local_b","/load_data_b"), 
                   roomDataObj, table, deleteUrl);
  } catch (err) {
    alert("예약 실패: " + err.message);
  }
}

// ======================
// 체크리스트
// ======================
let lastTable;
const colHeaders = ["", "1타임 입실", "1타임 퇴실", "2타임 입실", "2타임 퇴실", "3타임 입실", "3타임 퇴실"];
const rowHeaders = ["", "방 A", "방 B"];
const checkImg = "https://cdn-icons-png.flaticon.com/512/190/190411.png";
const xImg = "https://cdn-icons-png.flaticon.com/512/1828/1828665.png";

function createLastTable() {
  const container = document.getElementById("table-container-last");
  container.innerHTML = "";

  lastTable = document.createElement("table");
  lastTable.style.borderCollapse = "collapse";
  lastTable.style.width = "100%";

  for (let i = 0; i < rowHeaders.length; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < colHeaders.length; j++) {
      const cell = (i === 0 || j === 0) ? document.createElement("th") : document.createElement("td");
      cell.innerText = (i === 0) ? colHeaders[j] : (j === 0 ? rowHeaders[i] : "");
      cell.style.border = "1px solid #999";
      cell.style.padding = "5px";
      if (i === 0) cell.style.backgroundColor = "#f0f0f0";
      row.appendChild(cell);
    }
    lastTable.appendChild(row);
  }
  container.appendChild(lastTable);
}

async function loadCheckList() {
  const res = await fetch("/load_check_list");
  const data = await res.json();
  if (!data || data.length === 0) return;

  const rowData = data[0];
  for (let i = 1; i < rowHeaders.length; i++) {
    for (let j = 1; j < colHeaders.length; j++) {
      const key = generateKey(i, j);
      const value = rowData[key];
      const img = document.createElement("img");
      img.src = value ? checkImg : xImg;
      img.alt = value ? "체크" : "엑스";
      img.style.width = "32px";
      img.style.height = "32px";
      img.style.display = "block";
      img.style.margin = "0 auto";
      img.addEventListener("click", () => toggleCheck(key, img));
      lastTable.rows[i].cells[j].innerHTML = "";
      lastTable.rows[i].cells[j].appendChild(img);
    }
  }
}

async function toggleCheck(key, img) {
  const currentValue = img.src.includes("190411");
  const newValue = !currentValue;
  img.src = newValue ? checkImg : xImg;

  try {
    const res = await fetch("/update_check_list", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ key, value: newValue })
    });
    const result = await res.json();
    if (!result.success) {
      img.src = currentValue ? checkImg : xImg;
      alert("DB 업데이트 실패: " + result.message);
    }
  } catch (err) {
    img.src = currentValue ? checkImg : xImg;
    alert("DB 요청 실패: " + err.message);
  }
}

function generateKey(rowIdx, colIdx) {
  const rowMap = ["", "a", "b"];
  const colMap = ["", "one_in", "one_out", "two_in", "two_out", "three_in", "three_out"];
  return `${rowMap[rowIdx]}_${colMap[colIdx]}`;
}

// ======================
// 초기화 및 이벤트 등록
// ======================
window.onload = async function() {
  tableA = createTable("table-container");
  tableB = createTable("table-container-b");
  createLastTable();

  await loadData("/load_data", roomDataA, tableA, "/delete_reservation");
  await loadData("/load_data_b", roomDataB, tableB, "/delete_reservation_b");
  await loadCheckList();

  document.getElementById("submit-btn").addEventListener("click", () => {
    submitReservation("reservation_term", "people-count", "phone-number", "note",
                      "/update_local", "/save_to_db", roomDataA, tableA, "/delete_reservation");
  });

  document.getElementById("submit-btn-b").addEventListener("click", () => {
    submitReservation("reservation_term_b", "people-count-b", "phone-number-b", "note-b",
                      "/update_local_b", "/save_to_db_b", roomDataB, tableB, "/delete_reservation_b");
  });

  document.getElementById("reset-btn").addEventListener("click", async () => {
    if (!confirm("모든 데이터를 초기화합니다. 정말 진행할까요?")) return;
    try {
      const res = await fetch("/reset_all", { method: "POST" });
      const result = await res.json();
      if (!result.success) throw new Error(result.message || "초기화 실패");

      // 로컬 데이터 초기화
      roomDataA = {};
      roomDataB = {};
      updateTable(tableA, roomDataA, "/delete_reservation");
      updateTable(tableB, roomDataB, "/delete_reservation_b");

      // 체크리스트 초기화
      lastTable.querySelectorAll("td").forEach(cell => { cell.innerHTML = ""; });

      // 서버에서 다시 데이터 불러오기
      await loadData("/load_data", roomDataA, tableA, "/delete_reservation");
      await loadData("/load_data_b", roomDataB, tableB, "/delete_reservation_b");
      await loadCheckList();

      alert("모든 데이터가 초기화되었습니다!");
    } catch(err) {
      alert("초기화 실패: " + err.message);
    }
  });
}

