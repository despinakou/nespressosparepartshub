/* CSV τοπικά στον ίδιο φάκελο */


/* DOM references */
const searchInput    = document.getElementById("searchInput");
const headerRow      = document.getElementById("headerRow");
const tableBody      = document.getElementById("tableBody");
const systemFilter   = document.getElementById("systemFilter");
const brandFilter    = document.getElementById("brandFilter");
const categoryFilter = document.getElementById("categoryFilter");
const modeToggle     = document.getElementById("modeToggle");
const tableScroll    = document.querySelector(".table-scroll");
const scrollTopBtn   = document.getElementById("scrollTopBtn");
const resetViewBtn   = document.getElementById("resetViewBtn");
const exportBtn      = document.getElementById("exportBtn");



let allRows = [];
let headers = [];
let lastRenderedRows = [];

// column indexes
let imageColIndex    = -1;
let statusColIndex   = -1;
let replacedColIndex = -1;
let notesColIndex    = -1;
let systemColIndex   = -1;
let brandColIndex    = -1;
let categoryColIndex = -1;
let partCodeColIndex = -1;

/* ------------ CSV parsing ------------ */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (!lines.length) return { headers: [], rows: [] };

  // Πρώτη γραμμή = headers χωρισμένα με ';'
  const rawHeaders = lines[0].split(";");

  // Θα κρατήσουμε ΜΟΝΟ τα headers που δεν είναι κενά
  const keepIndexes = [];
  const headers = [];

  rawHeaders.forEach(function (h, idx) {
    const trimmed = h.trim();
    if (trimmed !== "") {
      headers.push(trimmed);
      keepIndexes.push(idx);
    }
  });

  // Για κάθε επόμενη γραμμή κρατάμε μόνο τις στήλες των keepIndexes
  const rows = lines.slice(1).map(function (line) {
    const cells = line.split(";");
    return keepIndexes.map(function (i) {
      return cells[i] != null ? cells[i] : "";
    });
  });

  return { headers, rows };
}

/* ------------ Header rendering ------------ */
function renderHeader() {
  headerRow.innerHTML = "";
  headers.forEach(function (h) {
    const th = document.createElement("th");
    th.textContent = h.toUpperCase();
    headerRow.appendChild(th);
  });
}

/* ------------ Helper: populate dropdowns ------------ */
function populateFilter(selectElement, values, labelPrefix) {
  selectElement.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = labelPrefix + ": Όλα";
  selectElement.appendChild(optAll);

  values.forEach(function (v) {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    selectElement.appendChild(opt);
  });
}

function initFilters() {
  function uniq(colIdx) {
    if (colIdx < 0) return [];
    const set = new Set();
    allRows.forEach(function (r) {
      const v = (r[colIdx] || "").trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort(function (a, b) {
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
  }

  populateFilter(systemFilter,   uniq(systemColIndex),   "System");
  populateFilter(brandFilter,    uniq(brandColIndex),    "Brand");
  populateFilter(categoryFilter, uniq(categoryColIndex), "Category");
}

/* ------------ Row rendering ------------ */
function renderRows(rows) {
  lastRenderedRows = rows;
  tableBody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = headers.length || 1;
    td.className = "no-data";
    td.textContent = "Δεν βρέθηκαν αποτελέσματα.";
    tr.appendChild(td);
    tableBody.appendChild(tr);
    return;
  }

  rows.forEach(function (row) {
    const tr = document.createElement("tr");

    let statusValue = "";
    if (statusColIndex >= 0 && row[statusColIndex]) {
      statusValue = row[statusColIndex].trim().toLowerCase();
    }
    if (statusValue === "phased out") {
      tr.classList.add("phased-out");
    }

    row.forEach(function (cell, idx) {
      const td = document.createElement("td");
      const value = cell == null ? "" : cell;

      if (idx === imageColIndex) {
  const img = document.createElement("img");
// indexes για τίτλο modal
const machineModelIdx = headers.indexOf("Machine Model");
const partNameGrIdx   = headers.indexOf("Part Name (GR)");

const machineModel = machineModelIdx >= 0 ? row[machineModelIdx] : "";
const partNameGr   = partNameGrIdx >= 0 ? row[partNameGrIdx] : "";

  img.classList.add("spare-thumb");
  img.loading = "lazy";

 img.src = value.trim() !== ""
  ? "images/" + value.trim()
  : "images/no-image.png";

img.onerror = function () {
  img.src = "images/no-image.png";
};

  td.appendChild(img);
img.addEventListener("click", function () {
  const modal = document.getElementById("imgModal");
  const modalImg = document.getElementById("imgModalEl");
  const title = document.getElementById("imgModalTitle");
  const closeBtn = document.getElementById("closeImgModalBtn");

  if (!modal || !modalImg) return;

  modalImg.src = img.src;
  modalImg.alt = img.alt || "Image preview";
  if (title) title.textContent = img.alt || "Image preview";

  modal.classList.add("show");

  // close handlers (safe even if called multiple times)
  function close() { modal.classList.remove("show"); }
  if (closeBtn) closeBtn.onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  document.onkeydown = (e) => { if (e.key === "Escape") close(); };
});

}
else if (idx === statusColIndex) {
        // Status pill
        const span = document.createElement("span");
        span.classList.add("status-pill");
        const v = value.trim().toLowerCase();
        if (v === "phased out") span.classList.add("status-phased");
        else if (v === "active") span.classList.add("status-active");
        span.textContent = value || "—";
        td.appendChild(span);

      } else if (idx === partCodeColIndex) {
  // Part Code → copy button
  const btn = document.createElement("button");
  btn.type = "button";
  const originalLabel = value || "";
  btn.textContent = originalLabel;
  btn.className = "copy-code-btn";

  btn.addEventListener("click", function () {
    if (!value) return;

    // αντιγραφή στο clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).catch(function () {});
    } else {
      const tmp = document.createElement("textarea");
      tmp.value = value;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand("copy");
      document.body.removeChild(tmp);
    }

    // οπτικό feedback "Copied!"
    btn.classList.add("copied");
    btn.textContent = "Copied!";

    setTimeout(function () {
      btn.textContent = originalLabel;
      btn.classList.remove("copied");
    }, 1200);
  });

  td.appendChild(btn);


      } else if (idx === replacedColIndex) {
        // Replaced By → filter by that part code
        if (value.trim() !== "") {
          const link = document.createElement("a");
          link.href = "#";
          link.textContent = value.trim();
          link.className = "replaced-link";
          link.addEventListener("click", function (ev) {
            ev.preventDefault();
            if (partCodeColIndex >= 0) {
              const code = value.trim();
              const rowsWithCode = allRows.filter(function (r) {
                return ((r[partCodeColIndex] || "").trim() === code);
              });
              renderRows(rowsWithCode);
              tableScroll.scrollTo({ top: 0, behavior: "smooth" });

            }
          });
          td.appendChild(link);
        } else {
          td.textContent = "";
        }

      } else {
        td.textContent = value;
      }

      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });
}

/* ------------ Filtering (search + dropdowns) ------------ */
function applyFilters() {
  const q = searchInput.value.trim().toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];

  const selectedSystem   = systemFilter.value;
  const selectedBrand    = brandFilter.value;
  const selectedCategory = categoryFilter.value;

  const filtered = allRows.filter(function (row) {
    if (selectedSystem   && row[systemColIndex]   !== selectedSystem)   return false;
    if (selectedBrand    && row[brandColIndex]    !== selectedBrand)    return false;
    if (selectedCategory && row[categoryColIndex] !== selectedCategory) return false;

    if (!terms.length) return true;

    const searchable = row
      .map(function (cell, idx) { return idx === imageColIndex ? "" : (cell || ""); })
      .join(" ")
      .toLowerCase();

    return terms.every(function (t) { return searchable.includes(t); });
  });

  renderRows(filtered);
}

/* ------------ Reset view ------------ */
function resetView() {
  searchInput.value = "";
  systemFilter.value = "";
  brandFilter.value = "";
  categoryFilter.value = "";


  renderRows(allRows);
  tableScroll.scrollTo({ top: 0, behavior: "smooth" });
}

/* ------------ Export filtered rows to CSV (UTF-8 + BOM) ------------ */
function exportFilteredExcel() {
  if (!headers.length) {
    alert("Δεν υπάρχουν δεδομένα προς export.");
    return;
  }

  const rowsToExport = lastRenderedRows && lastRenderedRows.length
    ? lastRenderedRows
    : [];

  if (!rowsToExport.length) {
    alert("Κανένα αποτέλεσμα προς export.");
    return;
  }

  // Φτιάχνουμε CSV string
  let csv = headers.join(";") + "\n";
  rowsToExport.forEach(function (row) {
    csv += row.map(function (v) {
      return v == null ? "" : String(v);
    }).join(";") + "\n";
  });

  // 🔥 BOM για ελληνικά στο Excel
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = "spare-parts-filtered-" + today + ".csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


/* ------------ Load CSV from URL ------------ */
function loadCsvFromUrl(url) {
  fetch(url)
    .then(function (r) {
      if (!r.ok) throw new Error("CSV loading failed: " + r.status);
      return r.text();
    })
    .then(function (text) {
      const parsed = parseCSV(text);
      headers = parsed.headers;
      allRows = parsed.rows;

      imageColIndex    = headers.indexOf("Image");
      statusColIndex   = headers.indexOf("Status");
      replacedColIndex = headers.indexOf("Replaced By");
      notesColIndex    = headers.indexOf("Notes");
      systemColIndex   = headers.indexOf("System");
      brandColIndex    = headers.indexOf("Brand");
      categoryColIndex = headers.indexOf("Category");
      partCodeColIndex = headers.indexOf("Part Code");

      renderHeader();
      initFilters();
      renderRows(allRows);
    })
    .catch(function (error) {
  console.error(error);
  tableBody.innerHTML =
    '<tr><td class="no-data">Δεν μπόρεσε να φορτώσει το αρχείο <b>spare-parts.csv</b>. Έλεγξε ότι το CSV βρίσκεται στον ίδιο φάκελο με το index.html και λέγεται ακριβώς spare-parts.csv.</td></tr>';
});
}

/* ------------ Dark mode toggle ------------ */
modeToggle.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
  modeToggle.textContent = document.body.classList.contains("dark-mode")
    ? "Light mode"
    : "Dark mode";
});

/* ------------ Scroll to top behaviour ------------ */
tableScroll.addEventListener("scroll", function () {
  if (tableScroll.scrollTop > 200) {
    scrollTopBtn.classList.add("show");
  } else {
    scrollTopBtn.classList.remove("show");
  }
});

scrollTopBtn.addEventListener("click", function () {
  tableScroll.scrollTo({ top: 0, behavior: "smooth" });
});

/* ------------ Event listeners ------------ */
window.addEventListener("DOMContentLoaded", function () {
  loadCsvFromUrl("./spare-parts.csv");
});


searchInput.addEventListener("input", applyFilters);
systemFilter.addEventListener("change", applyFilters);
brandFilter.addEventListener("change", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
resetViewBtn.addEventListener("click", resetView);
exportBtn.addEventListener("click", exportFilteredExcel);
// Report Issue Modal
document.addEventListener("DOMContentLoaded", () => {
  const reportBtn = document.getElementById("reportIssueBtn");
  const modal = document.getElementById("reportModal");
  const closeBtn = document.getElementById("closeModalBtn");

  if (!reportBtn || !modal || !closeBtn) return;

  reportBtn.addEventListener("click", (e) => {
    e.preventDefault();
    modal.classList.add("show");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") modal.classList.remove("show");
  });
});
/* ------------ Login ------------ */

document.getElementById("loginBtn").addEventListener("click", async function () {
  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  errorMsg.textContent = "";

  try {
    const response = await fetch("/.netlify/functions/login", {
      method: "POST",
      body: JSON.stringify({
        username: username,
        password: password
      })
    });

    if (response.ok) {
      document.getElementById("loginScreen").style.display = "none";
    } else {
      errorMsg.textContent = "Wrong username or password";
    }
  } catch (error) {
    console.error(error);
    errorMsg.textContent = "Login service error";
  }
});
