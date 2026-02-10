document.addEventListener("DOMContentLoaded", () => {

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

  /* ------------------------------
     LANGUAGE SETUP
  ------------------------------ */
  function detectBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    if (lang.startsWith("fi")) return "fi";
    if (lang.startsWith("en")) return "en";
    return "fi";
  }

  let currentLang = localStorage.getItem("lang") || detectBrowserLanguage();

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

    document.getElementById("langToggle").textContent =
      lang === "fi" ? "EN" : "FI";

    updateDoseHint();
  }

   /* ------------------------------
     THEME TOGGLE
  ------------------------------ */
  const themeToggle = document.getElementById("themeToggle");

  themeToggle.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark") ? "dark" : "light"
    );
  };

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }

  /* ------------------------------
     POPULATE DRUG LIST
  ------------------------------ */
  const drugSelect = document.getElementById("drug");
  const laakelista = document.getElementById("laakelista").rows;

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "";
  drugSelect.appendChild(emptyOption);

  for (let i = 0; i < laakelista.length; i++) {
    const name = laakelista[i].cells[0].textContent;
    const option = document.createElement("option");
    option.value = i;
    option.textContent = name;
    drugSelect.appendChild(option);
  }

   /* ------------------------------
     LANGUAGE TOGGLE
  ------------------------------ */
  document.getElementById("langToggle").onclick = () => {
    const next = currentLang === "fi" ? "en" : "fi";
    setLanguage(next);
  };

   setLanguage(currentLang);
  
  /* ------------------------------
     DOSE HINT
  ------------------------------ */
  function updateDoseHint() {
    const drugIndex = drugSelect.value;

    if (drugIndex === "") {
      document.getElementById("doseInfo").textContent = "";
      return;
    }

    const row = laakelista[drugIndex].cells;
    const minDose = parseFloat(row[3].textContent);
    const maxDose = parseFloat(row[4].textContent);
    const doseUnit = row[5].textContent;

    document.getElementById("doseInfo").textContent =
      `${i18n[currentLang].recommended}: ${minDose}–${maxDose} ${doseUnit}`;
  }

/* ------------------------------
   DOSE CONVERSION HELPER
------------------------------ */
function doseToMgKgH(value, doseUnit) {
  const u = doseUnit.replace(/\s/g, "").toLowerCase();

  if (u === "mg/kg/h" || u === "mg/kg/hr") return value;

  if (u === "µg/kg/h" || u === "ug/kg/h" || u === "mcg/kg/h") return value / 1000;

  if (u === "µg/kg/min" || u === "ug/kg/min" || u === "mcg/kg/min") return (value * 60) / 1000;

  if (u === "ng/kg/min") return (value * 60) / 1e6;

  throw new Error("Unsupported dose unit: " + doseUnit);
}

  function concToUgPerMl(value, unit) {
  const u = unit.replace(/\s/g, "").toLowerCase();

  if (u === "µg/ml" || u === "ug/ml" || u === "mcg/ml") return value;

  if (u === "mg/ml") return value * 1000;

  throw new Error("Unsupported concentration unit: " + unit);
}

  /* ------------------------------
     CALCULATION
  ------------------------------ */
  function calculate() {
    const drugIndex = drugSelect.value;

    if (drugIndex === "") {
      document.getElementById("concDisplay").textContent = "";
      document.getElementById("doseUnitCell").textContent = "";
      document.getElementById("doseWarning").textContent = "";
      document.getElementById("doseInfo").textContent = "";
      return;
    }

    updateDoseHint();

    const weight = parseFloat(document.getElementById("weight").value);
    const rate = parseFloat(document.getElementById("rate").value);
    const doseInput = parseFloat(document.getElementById("doseInput").value);

    const row = laakelista[drugIndex].cells;
    const concentration = parseFloat(row[1].textContent);
    const unit = row[2].textContent;
    const minDose = parseFloat(row[3].textContent);
    const maxDose = parseFloat(row[4].textContent);
    const doseUnit = row[5].textContent;

    document.getElementById("concDisplay").textContent =
      concentration + " " + unit;
    document.getElementById("doseUnitCell").textContent = doseUnit;

    const doseWarning = document.getElementById("doseWarning");
    doseWarning.textContent = "";

    if (!weight) {
      doseWarning.textContent = i18n[currentLang].warnings.enterWeight;
      return;
    }

    let mlH = null;
    let mgH = null;

    const concUgMl = concToUgPerMl(concentration, unit);

if (rate) {
  mlH = rate;
  mgH = (mlH * concUgMl) / 1000;
} else if (doseInput) {
  const mgKgH_input = doseToMgKgH(doseInput, doseUnit);
  mgH = mgKgH_input * weight;
  mlH = (mgH * 1000) / concUgMl;
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

    if (mgKgH < minDose || mgKgH > maxDose) {
      doseWarning.textContent = i18n[currentLang].warnings.outOfRange;
    }
  }

  /* ------------------------------
     EVENT LISTENERS
  ------------------------------ */
  drugSelect.onchange = () => {
    updateDoseHint();
    calculate();
  };

  document.getElementById("weight").oninput = calculate;
  document.getElementById("rate").oninput = calculate;
  document.getElementById("doseInput").oninput = calculate;

  /* ------------------------------
     CLEAR ALL
  ------------------------------ */
  document.getElementById("clearAllBtn").onclick = () => {
    document.getElementById("drug").value = "";
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
    document.getElementById("concDisplay").textContent = "";
    document.getElementById("doseUnitCell").textContent = "";
  };

  /* ------------------------------
     INFO BOX
  ------------------------------ */
  const infoToggle = document.getElementById("infoToggle");
  const infoBox = document.getElementById("infoBox");
  const infoClose = document.getElementById("infoClose");

  infoToggle.onclick = () => {
    infoBox.style.display = "flex";
  };

  infoClose.onclick = () => {
    infoBox.style.display = "none";
  };

  infoBox.onclick = (e) => {
    if (e.target === infoBox) {
      infoBox.style.display = "none";
    }
  };

});




