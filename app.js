// -----------------------------
// 1. Чтение таблицы laakelista
// -----------------------------
function loadLaakelista() {
  const rows = document.querySelectorAll("#laakelista tr");
  const data = {};

  rows.forEach(r => {
    const c = r.querySelectorAll("td");
    const name = c[0].textContent.trim();
    const conc = parseFloat(c[1].textContent.trim());
    const unit = c[2].textContent.trim();
    const info = c[3].textContent.trim();

    data[name] = {
      conc: conc,
      unit: unit.includes("mg") ? "mg" : "ug",
      info: info
    };
  });

  return data;
}

const drugs = loadLaakelista();


// -----------------------------
// 2. Элементы
// -----------------------------
const drugSelect = document.getElementById("drug");
const concDisplay = document.getElementById("concDisplay");

const weightEl = document.getElementById("weight");
const rateEl = document.getElementById("rate");
const doseInput = document.getElementById("doseInput");
const doseUnitCell = document.getElementById("doseUnitCell");

const mgHEl = document.getElementById("mgH");
const mlHEl = document.getElementById("mlH");
const mgKgHEl = document.getElementById("mgKgH");
const ugKgHEl = document.getElementById("ugKgH");
const ugKgMinEl = document.getElementById("ugKgMin");

const doseWarningEl = document.getElementById("doseWarning");
const doseInfoEl = document.getElementById("doseInfo");

const clearAllBtn = document.getElementById("clearAllBtn");


// -----------------------------
// 3. Заполнение списка препаратов
// -----------------------------
Object.keys(drugs).forEach(name => {
  const opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  drugSelect.appendChild(opt);
});

const emptyOpt = document.createElement("option");
emptyOpt.value = "";
emptyOpt.textContent = "";
drugSelect.prepend(emptyOpt);
drugSelect.value = "";


// -----------------------------
// 4. Выбор препарата
// -----------------------------
drugSelect.addEventListener("change", () => {
  const d = drugs[drugSelect.value];

  doseInput.value = "";
  rateEl.value = "";
  doseInput.disabled = false;
  rateEl.disabled = false;

  rateEl.classList.remove("active-field");
  doseInput.classList.remove("active-field");

  clearOutputs();

  doseWarningEl.textContent = "";
  concDisplay.textContent = "";
  doseInfoEl.textContent = "";
  doseUnitCell.textContent = "";

  if (!d) return;

  concDisplay.textContent = `${d.conc} ${d.unit === "mg" ? "mg/ml" : "µg/ml"}`;
  doseInfoEl.textContent = d.info;

  // Автовыбор единиц
  doseUnitCell.textContent = d.unit === "mg" ? "mg/kg/h" : "µg/kg/min";
});


// -----------------------------
// 5. Блокировка полей + подсветка
// -----------------------------
function activateField(el) {
  rateEl.classList.remove("active-field");
  doseInput.classList.remove("active-field");
  el.classList.add("active-field");
}

rateEl.addEventListener("input", () => {
  doseInput.disabled = rateEl.value !== "";
  if (rateEl.value !== "") activateField(rateEl);
  recalc();
});

doseInput.addEventListener("input", () => {
  rateEl.disabled = doseInput.value !== "";
  if (doseInput.value !== "") activateField(doseInput);
  recalc();
});

weightEl.addEventListener("input", recalc);


// -----------------------------
// 6. Кнопка Tyhjennä kaikki
// -----------------------------
clearAllBtn.addEventListener("click", () => {
  rateEl.value = "";
  doseInput.value = "";
  weightEl.value = "";

  rateEl.disabled = false;
  doseInput.disabled = false;

  rateEl.classList.remove("active-field");
  doseInput.classList.remove("active-field");

  clearOutputs();

  concDisplay.textContent = "";
  doseInfoEl.textContent = "";
  doseWarningEl.textContent = "";

  drugSelect.value = "";
  doseUnitCell.textContent = "";
});


// -----------------------------
// 7. Расчёт
// -----------------------------
function clearOutputs() {
  mgHEl.textContent = "";
  mlHEl.textContent = "";
  mgKgHEl.textContent = "";
  ugKgHEl.textContent = "";
  ugKgMinEl.textContent = "";
  doseWarningEl.textContent = "";
}

function applyWarning(drug, mgPerKgH, ugPerKgMin) {
  let high = false;

  if (drug.unit === "mg" && mgPerKgH > 20) high = true;
  if (drug.unit === "ug" && ugPerKgMin > 1.0) high = true;

  doseWarningEl.textContent = high ? "Korkea annos!" : "";
  doseWarningEl.style.background = high ? "#ffcccc" : "";
}

function recalc() {
  clearOutputs();

  const d = drugs[drugSelect.value];
  if (!d) return;

  const w = parseFloat(weightEl.value);
  if (!w || w <= 0) return;

  const rate = rateEl.value ? parseFloat(rateEl.value) : null;
  const dose = doseInput.value ? parseFloat(doseInput.value) : null;

  if (!rate && !dose) return;

  let mgPerH = 0, mlPerH = 0, mgPerKgH = 0, ugPerKgH = 0, ugPerKgMin = 0;

  // 1) Расчёт по скорости
  if (rate) {
    mlPerH = rate;

    if (d.unit === "mg") {
      mgPerH = mlPerH * d.conc;
      mgPerKgH = mgPerH / w;
      ugPerKgH = mgPerKgH * 1000;
      ugPerKgMin = ugPerKgH / 60;
    } else {
      const ugPerH = mlPerH * d.conc;
      ugPerKgH = ugPerH / w;
      ugPerKgMin = ugPerKgH / 60;
      mgPerKgH = ugPerKgH / 1000;
      mgPerH = mgPerKgH * w;
    }

    mgHEl.textContent = mgPerH.toFixed(3);
    mgKgHEl.textContent = mgPerKgH.toFixed(3);
    ugKgHEl.textContent = ugPerKgH.toFixed(3);
    ugKgMinEl.textContent = ugPerKgMin.toFixed(3);

    mlHEl.textContent = "";

    applyWarning(d, mgPerKgH, ugPerKgMin);
    return;
  }

  // 2) Расчёт по дозе
  if (dose && d.unit === "mg") {
    mgPerKgH = dose;
    mgPerH = mgPerKgH * w;
    ugPerKgH = mgPerKgH * 1000;
    ugPerKgMin = ugPerKgH / 60;
    mlPerH = mgPerH / d.conc;
  }

  if (dose && d.unit === "ug") {
    ugPerKgMin = dose;
    ugPerKgH = ugPerKgMin * 60;
    mgPerKgH = ugPerKgH / 1000;
    mgPerH = mgPerKgH * w;
    mlPerH = (ugPerKgH * w) / d.conc;
  }

  mgHEl.textContent = mgPerH.toFixed(3);
  mgKgHEl.textContent = mgPerKgH.toFixed(3);
  ugKgHEl.textContent = ugPerKgH.toFixed(3);
  ugKgMinEl.textContent = ugPerKgMin.toFixed(3);
  mlHEl.textContent = mlPerH.toFixed(3);

  applyWarning(d, mgPerKgH, ugPerKgMin);
}


// -----------------------------
// 8. Тёмная тема (автоматическая)
// -----------------------------
if (document.body.classList.contains("dark")) {
  document.body.style.background = "#1e1e1e";
  document.body.style.color = "#e6e6e6";

  document.querySelectorAll(".pink").forEach(e => e.style.background = "#4a2f3b");
  document.querySelectorAll(".gray").forEach(e => e.style.background = "#333");
  document.querySelectorAll(".blue").forEach(e => e.style.background = "#2a3b4f");

  document.querySelectorAll("td").forEach(e => e.style.borderColor = "#555");
}
