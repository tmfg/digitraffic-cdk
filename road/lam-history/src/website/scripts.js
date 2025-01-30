const tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]'),
);
const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});

const time_formats = {
  hour: { level: 0, type: "h", format: "date" },
  date: { level: 0, type: "vrk", format: "date" },
  week: { level: 0, type: "vk", format: "week" },
  month: { level: 1, type: "kk", format: "month" },
  year: { level: 2, type: "v", format: "year" },
  year_d: { level: 0, type: "v", format: "date" },
  viikko: "viikko",
  pvm: "pvm",
};

const raaka_liikenne_tasot = [
  { key: "h", value: "Tuntiliikenneraportti", tformat: time_formats.date },
  {
    key: "vrk",
    value: "Vuorokausiraportti",
    tformat: time_formats.date,
    ignore: true,
  },
  {
    key: "vk",
    value: "Viikkoraportti",
    tformat: time_formats.week,
    ignore: true,
  },
  {
    key: "kk",
    value: "Kuukausiraportti",
    tformat: time_formats.month,
    ignore: true,
  },
  {
    key: "v",
    value: "Vuosiraportti",
    tformat: time_formats.year,
    ignore: true,
  },
];

const liikenne_tasot = {
  h: { key: "h", value: "Tuntiliikenneraportti", tformat: time_formats.hour },
  vrk: {
    key: "vrk",
    value: "Vuorokausiliikenneraportti",
    tformat: time_formats.date,
  },
  vk: { key: "vk", value: "Viikkosummaraportti", tformat: time_formats.week },
  kk: {
    key: "kk",
    value: "Kuukausisummaraportti",
    tformat: time_formats.month,
  },
  v: { key: "v", value: "Vuosisummaraportti", tformat: time_formats.year },
  kvlv: {
    key: "kvl",
    value: "Keskimääräinen vuorokausiliikenne (vapaa aikaväli)",
    tformat: time_formats.year_d,
  },
  kvl: {
    key: "kvl",
    value: "Vuoden keskimääräinen vuorokausiliikenne",
    tformat: time_formats.year,
  },
  kavlv: {
    key: "kavl",
    value: "Keskimääräinen arkivuorokausiliikenne (vapaa aikaväli)",
    tformat: time_formats.year_d,
  },
  kavl: {
    key: "kavl",
    value: "Vuoden Keskimääräinen arkivuorokausiliikenne",
    tformat: time_formats.year,
  },
};

const knopeus_tasot = {
  h: { key: "h", value: "Tunnin keskinopeus", tformat: time_formats.hour },
  vrk: {
    key: "vrk",
    value: "Vuorokauden keskinopeus",
    tformat: time_formats.date,
  },
  vk: { key: "vk", value: "Viikon keskinopeus", tformat: time_formats.week },
  kk: {
    key: "kk",
    value: "Kuukauden keskinopeus",
    tformat: time_formats.month,
  },
  v: { key: "v", value: "Vuoden keskinopeus", tformat: time_formats.year },
};

const aineistot = {
  liikennemaara: {
    key: "liikennemaara",
    value: "Liikennemäärät",
    summaustasot: liikenne_tasot,
  },
  raakaliikennemaara: {
    key: "raakaliikennemaara",
    value: "Raakadatahavainnot",
    summaustasot: raaka_liikenne_tasot,
  },
  keskinopeus: {
    key: "keskinopeus",
    value: "Keskinopeus",
    summaustasot: knopeus_tasot,
  },
};

const ajoneuvot = [
  { key: "(*):Kaikki", luokka: "kaikki", value: "Kaikki (yhteensä)" },
  {
    key: "(1,6,7,8):kevyet",
    luokka: "kevyet",
    value: "Kevyet ajoneuvot (1,6,7,8)",
  },
  {
    key: "(2,3,4,5,9):raskaat",
    luokka: "raskaat",
    value: "Raskaat ajoneuvot (2,3,4,5,9)",
  },
  { key: "1:1_ha_pa", luokka: "1", value: "1 Henkilö- tai pakettiauto" },
  { key: "2:2_ka_ip", luokka: "2", value: "2 Kuorma-auto ilman perävaunua" },
  { key: "3:3_la", luokka: "3", value: "3 Linja-autot" },
  { key: "4:4_ka_pp", luokka: "4", value: "4 Kuorma-auto ja puoliperävaunu" },
  { key: "5:5_ka_tp", luokka: "5", value: "5 Kuorma-auto ja täysperävaunu" },
  { key: "6:6_ha_pk", luokka: "6", value: "6 Henkilöauto ja peräkärry" },
  { key: "7:7_ha_av", luokka: "7", value: "7 Henkilöauto ja asuntovaunu" },
  { key: "8:8_mp", luokka: "8", value: "8 Moottoripyörät ja mopot" },
  { key: "9:9_hct", luokka: "9", value: "9 High Capacity Truck" },
];

const datepic_options = {
  endDate: "+today",
  daysOfWeekHighlighted: "0,6",
  language: "fi",
  calendarWeeks: true,
  clearBtn: true,
  autoclose: true,
  startDate: "2010-01-01",
  startView: 0,
  minViewMode: 0,
  format: {
    toDisplay: function (date, format, ilanguage) {
      return formatDate(date, selected_item.summaustaso.tformat.format);
    },
    toValue: function (date, format, language) {
      if (date.startsWith("+")) {
        return new Date();
      }

      return new Date(date);
    },
  },
};

const pistejoukotUrl = "pistejoukot.json";
const pisteetUrl = "pisteet.json";

const allowed_pisteJoukkoRyhmat = [61, 62, 65];
const excluded_pisteJoukot = [2048, 2049];

let selected_item = { aineisto: null, summaustaso: null };
let selected_list = "roadStations_t";
let selected_suunta = [];

let asemat_loaded = false;
let pistejoukot_loaded = false;
let maakunnat_loaded = false;

let maakunnat = [];

async function modalPopup(selected) {
  const [pisteet, pistejoukot] = await Promise.all([
    fetch(pisteetUrl),
    fetch(pistejoukotUrl),
  ]);

  // Build tables
  if (!pistejoukot_loaded) {
    lamPistejoukot(pistejoukot);
  }

  if (!asemat_loaded) {
    lamAsemat(pisteet);
  }

  // Show selected tab
  $("#asematTab #" + selected).trigger("click");
}

async function lamAsemat(pisteet) {
  try {
    const resp = await pisteet.json();
    const table = $("#roadStations_t > tbody:last-child");

    for (const i in resp) {
      const feature = resp[i];

      table.append(
        $("<tr/>", { id: "_" + feature.piste }).append([
          $("<td/>").text(feature.piste),
          $("<td/>").text(feature.nimi),
          $("<td/>").text(
            feature.tienro + " / " + feature.tieosa + " / " + feature.etaisyys,
          ),
          $("<td/>").text(feature.laite_kunta),
          $("<td/>").text(maakunnat[feature.maakunta_id]),
          $("<td/>").append(
            $("<i/>", {
              class: "bi bi-question-circle select-button",
              "data-bs-toggle": "tooltip",
              "data-bs-placement": "top",
              title: "Keruun tila: " +
                feature.keruun_tila +
                "\n" +
                "Aloitusaika: " +
                feature.alkuaika +
                "\n" +
                "Päättymispäivä: " +
                feature.loppuaika +
                "\n" +
                "ELY tunnus: " +
                feature.ely_id,
            }),
          ),
          $("<td/>").append(
            $("<i/>", { class: "bi bi-check-circle select-button" }),
          ),
        ]),
      );
    }

    asemat_loaded = true;
  } catch (e) {
    console.log(e);
    alert("LAM-asemien lataus epäonnistui!");
  }
}

async function lamPistejoukot(pistejoukot) {
  try {
    const resp = await pistejoukot.json();
    const table = $("#pistejoukot_t > tbody:last-child");

    for (const i in resp) {
      const ryhma = resp[i];

      if (allowed_pisteJoukkoRyhmat.includes(ryhma.pistejoukkoryhma)) {
        for (const j in ryhma.pistejoukot) {
          const joukko = ryhma.pistejoukot[j];

          if (!excluded_pisteJoukot.includes(joukko.pistejoukko)) {
            table.append(
              $("<tr/>", { id: "_" + joukko.pistejoukko }).append([
                $("<td/>").text(j == 0 ? ryhma.nimi : ""),
                $("<td/>").text(joukko.pistejoukko),
                $("<td/>").text(joukko.nimi),
                $("<td/>").append(
                  $("<i/>", {
                    class: "bi bi-check-circle select-button",
                  }),
                ),
              ]),
            );
          }
        }

        if (ryhma.pistejoukkoryhma == 61) {
          buildMaakunnat(ryhma.pistejoukot);
        }
      }
    }

    pistejoukot_loaded = true;
  } catch (e) {
    console.log("Failed to parse pistejoukot", e);
    alert("Pistejoukkojen lataus epäonnistui!");
  }
}

function buildMaakunnat(pistejoukkoryhma) {
  for (const i in pistejoukkoryhma) {
    const maakunta = pistejoukkoryhma[i];

    maakunnat[maakunta.nro] = maakunta.nimi;
  }

  maakunnat_loaded = true;
}

function formatDate(date, type) {
  const d = date.getDate();
  const m = date.getMonth() + 1; //Month from 0 to 11
  const y = date.getFullYear();

  let resp;

  if (type === time_formats.year.format) {
    resp = "" + y;
  } else if (type === time_formats.month.format) {
    resp = "" + y + "-" + (m <= 9 ? "0" + m : m);
  } else if (type === time_formats.week.format) {
    resp = "" + y + "-" + getWeekNumber(date);
  } else {
    resp = "" + y + "-" + (m <= 9 ? "0" + m : m) + "-" + (d <= 9 ? "0" + d : d);
  }

  return resp;
}

function getWeekNumber(dt) {
  var tdt = new Date(dt.valueOf());
  var dayn = (dt.getDay() + 6) % 7;

  tdt.setDate(tdt.getDate() - dayn + 3);
  var firstThursday = tdt.valueOf();

  tdt.setMonth(0, 1);

  if (tdt.getDay() !== 4) {
    tdt.setMonth(0, 1 + ((4 - tdt.getDay() + 7) % 7));
  }

  return 1 + Math.ceil((firstThursday - tdt) / 604800000);
}

function cleanOptions(select, offset) {
  if (select) {
    const i = offset ? offset : 0;

    // Remove old list if exists
    while (select.options.length > i) {
      select.remove(i);
    }
  }
}

function createOptions(select, options, key) {
  if (select) {
    const optionKey = key || "key";

    for (const i in options) {
      const option = document.createElement("option");
      option.text = options[i].value;
      option.value = options[i][optionKey];

      if (options[i].disabled) {
        option.disabled = true;
      }

      if (!options[i].ignore) {
        select.options.add(option);
      }
    }

    select.options[0].selected = true;
  }
}

function updateDatepicker(viewLevel) {
  datepic_options.startView = viewLevel;
  datepic_options.minViewMode = viewLevel;

  //$('.datepicker').disabled = false;
  $(".datepicker").datepicker("destroy");
  $(".datepicker").datepicker(datepic_options);
  $(".datepicker").datepicker("update", "");
}

function getSummaustaso(summaustasot, selection) {
  if (summaustasot) {
    const selected = $(selection).val();

    for (const i in summaustasot) {
      if (summaustasot[i].key === selected) {
        if (
          selected === liikenne_tasot.kvl.key ||
          selected === liikenne_tasot.kavl.key
        ) {
          if (
            ($(selection).find(":selected").text().includes("vapaa") &&
              (i === "kvlv" || i === "kavlv")) ||
            i === "kvl" ||
            i === "kavl"
          ) {
            return summaustasot[i];
          }
        } else {
          return summaustasot[i];
        }
      }
    }
  }

  return null;
}

function getActiveTab() {
  return $("ul#asematTab li.active")[0].activeElement;
}

function updateSelectedPisteet() {
  const valitut = $("#" + selected_list + " tr.table-active");
  let pisteet = [];

  valitut.each(function (index) {
    pisteet.push($(this).attr("id").substring(1));
  });

  $(selected_list === "roadStations_t" ? "#pisteet" : "#pistejoukot").val(
    pisteet.join(),
  );
  $("#selectedCounter").text(pisteet.length);

  $("#removePiste").prop("disabled", pisteet.length == 0 ? "disabled" : false);
}

// Init page controls
$(function () {
  $("input[name=lam_type]").on("change", function () {
    $(
      this.id === "lam_type1"
        ? "#pisteet, #button-addon1"
        : "#pistejoukot, #button-addon2",
    ).prop(
      "disabled",
      false,
    );
    $(
      this.id === "lam_type1"
        ? "#pistejoukot, #button-addon2"
        : "#pisteet, #button-addon1",
    ).prop(
      "disabled",
      "disabled",
    );
  });

  // Piste is selected or removed
  $("#roadStations_t tbody, #pistejoukot_t tbody").on(
    "click",
    "tr",
    function () {
      let selected = $(this);

      if (selected.hasClass("table-active")) {
        selected.removeClass("table-active");
      } else {
        selected.addClass("table-active");
      }

      updateSelectedPisteet();
    },
  );

  // Clear all selected pisteet
  $("#removePiste").on("click", function (e) {
    $("#" + selected_list + " tr.table-active").removeClass("table-active");

    updateSelectedPisteet();
  });

  // Track tab changes
  $("#asematTab button").on("shown.bs.tab", function () {
    //selected_list = this.id === 'pisteetTab' ? 'roadStations_t' : 'pistejoukot_t';

    if (this.id === "pisteetTab") {
      selected_list = "roadStations_t";
      $("#lam_type1").prop("checked", true).trigger("change");
      //$('#pisteet').attr('name', 'piste');
    } else {
      selected_list = "pistejoukot_t";
      $("#lam_type2").prop("checked", true).trigger("change");
      //$('#pisteet').attr('name', 'pistejoukko');
    }

    updateSelectedPisteet();
  });

  // Toggle show selected pisteet. Not implemented
  $("#selectedOnly").change(function () {
    console.log("toggle ", this.checked);
  });

  $("#suunta").change(function () {
    const tmp = $(this).val();

    if (selected_suunta.includes("")) {
      if (tmp.includes("")) {
        // All option was previously selected -> drop all option if exists
        tmp.splice(0, 1);
      }

      selected_suunta = tmp;
    } else {
      selected_suunta = tmp.includes("") ? [""] : tmp;
    }

    $(this).val(selected_suunta);
  });

  $("#aineisto").change(function () {
    const summaustaso = document.getElementById("summaustaso");
    summaustaso.disabled = false;

    selected_item.aineisto = aineistot[$(this).val()];
    selected_item.summaustaso = null;

    // Clean current summaustaso options
    cleanOptions(summaustaso, 1);

    // Set new summaustaso options
    createOptions(summaustaso, selected_item.aineisto.summaustasot);

    // Reset datapickers
    $(".datepicker").datepicker("destroy");
  });

  $("#summaustaso").change(function () {
    const current_summaustaso = $(this).val();

    const new_summaustaso = getSummaustaso(
      selected_item.aineisto.summaustasot,
      this,
    );

    // change date name-attribute value
    $("#alkupaiva").attr(
      "name",
      new_summaustaso.key === time_formats.week.type
        ? time_formats.viikko
        : time_formats.pvm,
    );

    // Update datepickers
    updateDatepicker(new_summaustaso.tformat.level);
    // Request URL: https://tie-test.digitraffic.fi/api/tms/v1/history?api=liikennemaara&tyyppi=vrk&pvm=2023-03-01&loppu=&lam_type=option1&piste=1
    //              https://tie-test.digitraffic.fi/api/tms/v1/history?api=liikennemaara&tyyppi=vrk&pvm=2023-03-01&loppu=&lam_type=option1&piste=1&luokka=1&suunta=1&sisallytakaistat=0
    console.info("time_formats.hour.type:        " + time_formats.hour.type);
    console.info("selected_item.summaustaso:     " + selected_item.summaustaso);
    console.info(
      "selected_item.summaustaso.key: " + selected_item.summaustaso?.key,
    );
    console.info("current_summaustaso:           " + current_summaustaso);
    if (
      selected_item.summaustaso == null ||
      (current_summaustaso === time_formats.hour.type &&
        selected_item.summaustaso.key !== time_formats.hour.type) ||
      (current_summaustaso !== time_formats.hour.type &&
        selected_item.summaustaso.key === time_formats.hour.type)
    ) {
      // Update ajoneuvoluokat
      const luokat = document.getElementById("luokat");
      luokat.disabled = false;
      luokat.name = current_summaustaso === time_formats.hour.type
        ? "luokka"
        : "ryhma";

      cleanOptions(luokat, 1);
      createOptions(
        luokat,
        ajoneuvot,
        current_summaustaso === time_formats.hour.type ? "luokka" : "key",
      );
    }

    // Update new summaustaso
    selected_item.summaustaso = new_summaustaso;
  });

  $(".search").keyup(function () {
    const searchTerm = $(".search").val();
    const searchSplit = searchTerm.replace(/ /g, "'):containsi('");

    $.extend($.expr[":"], {
      containsi: function (elem, i, match, array) {
        return (
          (elem.textContent || elem.innerText || "")
            .toLowerCase()
            .indexOf((match[3] || "").toLowerCase()) >= 0
        );
      },
    });

    $(".results tbody tr")
      .not(":containsi('" + searchSplit + "')")
      .each(function (e) {
        $(this).attr("visible", "false");
      });

    $(".results tbody tr:containsi('" + searchSplit + "')").each(function (e) {
      $(this).attr("visible", "true");
    });

    // Filter element count
    const matchCount = $('.results tbody tr[visible="true"]').length;

    if (matchCount == 0) {
      $(".no-result").show();
    } else {
      $(".no-result").hide();
    }
  });

  $(document).on("click", "#resetForm", function () {
    // Form is reseted, just disable selections
    $("#summaustaso").prop("disabled", "disabled");
    $("#luokat").prop("disabled", "disabled");
    $(".datepicker").datepicker("destroy");
    $(".loading_spinner").css("visibility", "hidden");
  });

  // Validate required inputs
  document.querySelectorAll(".needs-validation").forEach(function (form) {
    form.addEventListener(
      "submit",
      function (event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        } else {
          $(".loading_spinner").css("visibility", "visible");
        }
        form.classList.add("was-validated");

        setTimeout(
          function () {
            $(".loading_spinner").css("visibility", "hidden");
          },
          2000, // Just wait a bit and hide spinner
        );
      },
      false,
    );
  });

  // Init aineistot
  createOptions(document.getElementById("aineisto"), aineistot);
});
