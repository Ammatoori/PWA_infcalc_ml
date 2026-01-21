/* ------------------------------
   LANGUAGE DICTIONARY
------------------------------ */
const i18n = {
  fi: {
    title: "Infuusiolaskuri",
    drug: "Lääke",
    weight: "Paino",
    rate: "Nopeus",
    targetDose: "Tavoitettu annos",
    or: "tai",
    calculatedRate: "Laskettu nopeus",
    calculatedDoses: "Laskettu annokset",
    recommended: "Suositus",
    clearAll: "Tyhjennä kaikki",
    warnings: {
      enterWeight: "Syötä paino",
      enterRateOrDose: "Syötä nopeus tai annos",
      outOfRange: "Annos on suosituksen ulkopuolella"
    }
  },

  en: {
    title: "Infusion Calculator",
    drug: "Drug",
    weight: "Weight",
    rate: "Rate",
    targetDose: "Target dose",
    or: "or",
    calculatedRate: "Calculated rate",
    calculatedDoses: "Calculated doses",
    recommended: "Recommended range",
    clearAll: "Clear all",
    warnings: {
      enterWeight: "Enter weight",
      enterRateOrDose: "Enter rate or dose",
      outOfRange: "Dose is outside the recommended range"
    }
  }
};

let currentLang = localStorage.getItem("lang") || "fi";

/* ------------------------------
   APPLY LANGUAGE
------------------------------ */
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);

  const t = i18n[lang];

  document.getElementById("title").textContent = t.title;
  document.getElementById("labelDrug").textContent = t.drug;
  document.getElementById("labelWeight").textContent = t.weight;
  document.getElementById("labelRate").textContent = t.rate;
  document.getElementById("labelDose").textContent = t.targetDose;
  document.getElementById("labelOr").textContent = t.or;
  document.getElementById("labelCalcRate").textContent = t.calculatedRate;
  document.getElementById("labelCalcDoses").textContent = t.calculatedDoses;
  document.getElementById("clearAllBtn").textContent = t.clearAll;
}

setLanguage(currentLang);

/* ------------------------------
   THEME TOGGLE
------------------------------ */
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

/* ------------------------------
   LANGUAGE TOGGLE
------------------------------ */
document.getElementById("langToggle").onclick = () => {
  const next = currentLang === "fi" ? "en" : "fi";
  setLanguage(next);
  document.getElementById("langToggle").textContent = next.toUpperCase();
};

/* ------------------------------
   POPULATE DRUG LIST
------------------------------ */
const drugSelect = document.getElementById("drug");
const laakelista = document.getElementById("laakelista").rows;

for (let i = 0; i < laakelista.length; i++) {
  const name = laakelista[i].cells[0].textContent;
  const option = document.createElement("option");
  option.value = i;
  option.textContent = name;
  drugSelect.appendChild(option);
}

/* ------------------------------
   MAIN CALCULATION LOGIC
------------------------------ */
function calculate() {
  const drugIndex = drugSelect.value;
  const weight = parseFloat(document.getElementById("weight").value);
  const rate = parseFloat(document.getElementById("rate").value);
  const doseInput = parseFloat(document.getElementById("doseInput").value);

  const row = laakelista[drugIndex].cells;
  const concentration = parseFloat(row[1].textContent);
  const unit = row[2].textContent;
  const minDose = parseFloat(row[3].textContent);
  const maxDose = parseFloat(row[4].textContent);

  document.getElementById("concDisplay").textContent = concentration + " " + unit;

  const doseWarning = document.getElementById("doseWarning");
  doseWarning.textContent = "";

  if (!weight) {
    doseWarning.textContent = i18n[currentLang].warnings.enterWeight;
    return;
  }

  let mlH = null;
  let mgH = null;

  if (rate) {
    mlH = rate;
    mgH = (rate * concentration) / 1000;
  } else if (doseInput) {
    mgH = doseInput * weight;
    mlH = (mgH * 1000) / concentration;
  } else {
    doseWarning.textContent = i18n[currentLang].warnings.enterRateOrDose;
    return;
  }

  const mgKgH = mgH / weight;
  const ugKgH = mgKgH * 1000;
  const ugKgMin = ugKgH / 60;

  document.getElementById("mlH").textContent = mlH.toFixed(2);
  document.getElementById("mgH").textContent = mgH.toFixed(3);
  document.getElementById("mgKgH").textContent = mgKgH.toFixed(4);
  document.getElementById("ugKgH").textContent = ugKgH.toFixed(2);
  document.getElementById("ugKgMin").textContent = ugKgMin.toFixed(3);

  const doseInfo = document.getElementById("doseInfo");
  doseInfo.textContent = `${i18n[currentLang].recommended}: ${minDose}–${maxDose}`;

  if (mgKgH < minDose || mgKgH > maxDose) {
    doseWarning.textContent = i18n[currentLang].warnings.outOfRange;
  }
}

/* ------------------------------
   EVENT LISTENERS
------------------------------ */
document.getElementById("drug").onchange = calculate;
document.getElementById("weight").oninput = calculate;
document.getElementById("rate").oninput = calculate;
document.getElementById("doseInput").oninput = calculate;

/* ------------------------------
   CLEAR ALL
------------------------------ */
document.getElementById("clearAllBtn").onclick = () => {
  document.getElementById("weight").value = "";
  document.getElementById("rate").value = "";
  document.getElementById("doseInput").value = "";
  document.getElementById("doseWarning").textContent = "";
  document.getElementById("mlH").textContent = "";
  document.getElementById("mgH").textContent = "";
  document.getElementById("mgKgH").textContent = "";
  document.getElementById("ugKgH").textContent = "";
  document.getElementById("ugKgMin").textContent = "";
  document.getElementById("doseInfo").textContent = "";
};
