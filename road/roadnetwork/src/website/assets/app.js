"use strict";

/**
 * Bucket listing page for the Road Network datasets.
 *
 * Lists the bucket live through the S3 ListObjectsV2 rest api, which CloudFront exposes on the
 * same path as the files themselves. The current directory is kept in the url hash, so the
 * page never reloads while browsing.
 */

/** Served under this path by CloudFront; the S3 origin strips the first path segment. */
const BASE_PATH = "/roadnetwork/";

/** Site assets live in the same bucket as the data and must not show up in the listing. */
const HIDDEN_KEYS = ["index.html", ".keep"];
const HIDDEN_PREFIXES = ["assets/"];

const MESSAGES = {
  fi: {
    title: "Road Network -aineistot",
    intro:
      "Ladattavat Road Network -aineistojulkaisut. latest/-kansio sisältää aina viimeisimmän julkaistun Road Network -aineiston. releases/-kansioon tallennetaan Road Network -aikaiset aineistojulkaisut vuodesta 2027 alkaen, joten kansio on alkuvaiheessa tyhjä. digiroad/-kansio sisältää Digiroadin vuoden 2026 aineistojulkaisut.",
    colName: "Nimi",
    colSize: "Koko",
    colModified: "Muokattu",
    actions: "Toiminnot",
    copyLink: "Kopioi linkki",
    download: "Lataa tiedosto",
    linkCopied: "Linkki kopioitu.",
    jumpPrevious: "Hyppää taaksepäin",
    jumpNext: "Hyppää eteenpäin",
    pages: "sivua",
    previous: "Edellinen",
    next: "Seuraava",
    page: "Sivu",
    loading: "Ladataan…",
    empty: "Ei vielä julkaisuja.",
    error: "Sisällön hakeminen epäonnistui.",
  },
  en: {
    title: "Road Network datasets",
    intro:
      "Downloadable Road Network dataset releases. The latest/ folder always contains the most recently published Road Network dataset. The releases/ folder stores Road Network-era dataset releases starting from 2027, so the folder is empty in the initial phase. The digiroad/ folder contains Digiroad dataset releases from 2026.",
    colName: "Name",
    colSize: "Size",
    colModified: "Modified",
    actions: "Actions",
    copyLink: "Copy link",
    download: "Download file",
    linkCopied: "Link copied.",
    jumpPrevious: "Jump backward",
    jumpNext: "Jump forward",
    pages: "pages",
    previous: "Previous",
    next: "Next",
    page: "Page",
    loading: "Loading…",
    empty: "No releases yet.",
    error: "Failed to load the contents.",
  },
};

const urlParams = new URLSearchParams(window.location.search);
const MOCK_MODE =
  urlParams.get("mock") === "1" || hashQueryParams().get("mock") === "1";
const PAGE_SIZE = 20;
let sortKey = "name";
let sortDirection = "desc";
let currentPage = pageFromUrl();
let renderGeneration = 0;

const MOCK_RELEASE_COUNT = 421;
const MOCK_RELEASE_FOLDERS = Array.from(
  { length: MOCK_RELEASE_COUNT },
  (_, index) => `releases/2020_${String(index + 1).padStart(3, "0")}/`,
);

const MOCK_LISTING = {
  "": {
    folders: ["latest/", "releases/", "digiroad/"],
    files: [],
  },
  "latest/": {
    folders: [],
    files: [
      {
        key: "latest/road-network-2027_1.zip",
        size: 734003200,
        modified: "2026-08-20T08:15:00.000Z",
      },
      {
        key: "latest/README.txt",
        size: 1840,
        modified: "2026-08-20T08:15:00.000Z",
      },
    ],
  },
  "releases/": {
    folders: MOCK_RELEASE_FOLDERS,
    files: [],
  },
  "releases/2027_1/": {
    folders: [],
    files: [
      {
        key: "releases/2027_1/road-network-2027_1.zip",
        size: 734003200,
        modified: "2026-08-20T08:15:00.000Z",
      },
    ],
  },
  "digiroad/": {
    folders: ["digiroad/2026_1/", "digiroad/2026_2/"],
    files: [],
  },
  "digiroad/2026_1/": {
    folders: [],
    files: [
      {
        key: "digiroad/2026_1/digiroad-2026_1.zip",
        size: 629145600,
        modified: "2026-04-15T06:20:00.000Z",
      },
    ],
  },
  "digiroad/2026_2/": {
    folders: [],
    files: [
      {
        key: "digiroad/2026_2/digiroad-2026_2.zip",
        size: 681574400,
        modified: "2026-09-10T06:20:00.000Z",
      },
    ],
  },
};

/** Language from `?lang=`, falling back to the browser language and then to Finnish. */
function resolveLanguage() {
  const requested =
    hashQueryParams().get("lang") ??
    new URLSearchParams(window.location.search).get("lang");
  if (requested && MESSAGES[requested]) {
    return requested;
  }
  return navigator.language.startsWith("en") ? "en" : "fi";
}

let lang = resolveLanguage();
/** Returns the localized message for the current language. */
const translate = (key) => MESSAGES[lang][key];

/** Formats bytes with an SI prefix, e.g. 6000000000 -> "6.0 GB". */
function formatSize(bytes) {
  const units = ["B", "kB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit++;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

/** Formats an S3 timestamp as `d.m.yyyy hh:mm` in the visitor's time zone. */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Directory being browsed, read from the url hash as an S3 prefix such as `digiroad/2026_1/`. */
function currentPrefix() {
  // The folder lives in the hash so navigating between folders never reloads the page.
  const hashPath = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (!hashPath) {
    return "";
  }
  return hashPath.endsWith("/") ? hashPath : `${hashPath}/`;
}

function hashQueryParams() {
  // Hash queries are used for shareable UI state without sending it to CloudFront/S3.
  const query = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(query);
}

function pageFromUrl() {
  const hashPage = hashQueryParams().get("page");
  const searchPage = urlParams.get("page");
  return Math.max(
    1,
    Number.parseInt(hashPage ?? searchPage ?? "1", 10) || 1,
  );
}

function updatePageUrl() {
  // Keep folder, page, language and mock mode together at the end of the shareable URL.
  const url = new URL(window.location.href);
  const hashPath = url.hash.split("?")[0] || "#/";
  const hashParams = new URLSearchParams(url.hash.split("?")[1] ?? "");
  const mock = url.searchParams.get("mock");
  const language = url.searchParams.get("lang");
  url.searchParams.delete("page");
  if (mock !== null) {
    hashParams.set("mock", mock);
    url.searchParams.delete("mock");
  }
  if (language !== null) {
    hashParams.set("lang", language);
    url.searchParams.delete("lang");
  }
  if (currentPage === 1) {
    hashParams.delete("page");
  } else {
    hashParams.set("page", String(currentPage));
  }
  url.hash = `${hashPath}${hashParams.toString() ? `?${hashParams}` : ""}`;
  history.replaceState(null, "", url);
}

function browseUrl(hash, page = 1) {
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.split("?")[1] ?? "");
  const mock = url.searchParams.get("mock");
  const language = url.searchParams.get("lang");
  url.searchParams.delete("page");
  if (mock !== null) {
    hashParams.set("mock", mock);
    url.searchParams.delete("mock");
  }
  if (language !== null) {
    hashParams.set("lang", language);
    url.searchParams.delete("lang");
  }
  if (page === 1) {
    hashParams.delete("page");
  } else {
    hashParams.set("page", String(page));
  }
  url.hash = `${hash}${hashParams.toString() ? `?${hashParams}` : ""}`;
  return url.href;
}

async function copyLink(url) {
  await navigator.clipboard.writeText(url);
  document.getElementById("status").textContent = translate("linkCopied");
}

function actionButton(icon, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "action-button";
  button.title = label;
  button.setAttribute("aria-label", label);
  const iconSpan = document.createElement("span");
  iconSpan.className =
    icon === "\u2193" ? "action-icon action-icon-download" : "action-icon";
  iconSpan.setAttribute("aria-hidden", "true");
  iconSpan.textContent = icon;
  button.appendChild(iconSpan);
  button.addEventListener("click", onClick);
  return button;
}

function isHidden(key) {
  return (
    HIDDEN_KEYS.includes(key) ||
    HIDDEN_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
    key.endsWith("/.keep")
  );
}

function textElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * S3 ListObjectsV2 responses are XML with a default namespace; use tag-name lookups so the
 * parser works consistently across browsers.
 */
function childText(node, tagName) {
  return node.getElementsByTagName(tagName)[0]?.textContent ?? "";
}

/**
 * Reads one directory level of the bucket.
 *
 * `delimiter=/` makes S3 return subdirectories as `CommonPrefixes` instead of listing every key
 * under them. S3 returns at most 1000 entries per call, so follow the continuation token until
 * exhausted.
 *
 * @returns folder prefixes and files of the given prefix, site assets excluded
 */
async function listPrefix(prefix) {
  if (MOCK_MODE) {
    const mock = MOCK_LISTING[prefix] ?? { folders: [], files: [] };
    return {
      folders: [...mock.folders],
      files: mock.files.filter((file) => !isHidden(file.key)).map((file) => ({
        ...file,
      })),
    };
  }

  const folders = [];
  const files = [];
  let continuationToken;

  // Fetch all S3 pages before sorting locally, because S3 sorts each response by key.
  do {
    const params = new URLSearchParams({
      "list-type": "2",
      delimiter: "/",
      prefix,
    });
    if (continuationToken) {
      params.set("continuation-token", continuationToken);
    }

    const response = await fetch(`${BASE_PATH}?${params}`);
    if (!response.ok) {
      throw new Error(`Listing failed with status ${response.status}`);
    }

    const xml = new DOMParser().parseFromString(
      await response.text(),
      "application/xml",
    );

    for (const node of xml.getElementsByTagName("CommonPrefixes")) {
      const folder = childText(node, "Prefix");
      if (!isHidden(folder)) {
        folders.push(folder);
      }
    }

    for (const node of xml.getElementsByTagName("Contents")) {
      const key = childText(node, "Key");
      if (key === prefix || isHidden(key)) {
        continue;
      }
      files.push({
        key,
        size: Number(childText(node, "Size")),
        modified: childText(node, "LastModified"),
      });
    }

    continuationToken =
      childText(xml, "IsTruncated") === "true"
        ? childText(xml, "NextContinuationToken")
        : undefined;
  } while (continuationToken);

  return { folders, files };
}

/** Renders the path of the current directory as links back to each level. */
function renderBreadcrumb(prefix) {
  const breadcrumb = document.getElementById("breadcrumb");
  breadcrumb.replaceChildren();

  const root = document.createElement("a");
  root.href = browseUrl("#/", 1);
  root.className = "root";
  root.textContent = "/";
  breadcrumb.appendChild(root);

  let path = "";
  for (const [index, segment] of prefix.split("/").filter(Boolean).entries()) {
    path += `${segment}/`;
    if (index > 0) {
      breadcrumb.appendChild(textElement("span", "/", "separator"));
    }
    const link = document.createElement("a");
    link.href = browseUrl(`#/${path}`, 1);
    link.textContent = segment;
    breadcrumb.appendChild(link);
  }
}

/** Row linking deeper into the listing; navigation happens through the url hash. */
function folderRow(prefix, folder) {
  // Folder links preserve the current language and mock state, but reset pagination.
  const name = folder.slice(prefix.length).replace(/\/$/, "");
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  const link = document.createElement("a");
  link.href = browseUrl(`/${folder}`);
  link.textContent = `${name}/`;
  cell.appendChild(link);
  const actions = document.createElement("td");
  actions.className = "actions";
  actions.appendChild(
    actionButton("⧉", translate("copyLink"), () => copyLink(link.href)),
  );
  row.append(cell, textElement("td", ""), textElement("td", ""), actions);
  return row;
}

/** Row linking to the file itself, which CloudFront serves from the bucket. */
function fileRow(prefix, file) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  const link = document.createElement("a");
  link.href = BASE_PATH + file.key;
  link.textContent = file.key.slice(prefix.length);
  cell.appendChild(link);
  const actions = document.createElement("td");
  actions.className = "actions";
  actions.append(
    actionButton("⧉", translate("copyLink"), () => {
      copyLink(new URL(link.href, window.location.href).href);
    }),
    actionButton("↓", translate("download"), () => {
      window.location.href = link.href;
    }),
  );
  row.append(
    cell,
    textElement("td", formatSize(file.size), "right"),
    textElement("td", formatDate(file.modified)),
    actions,
  );
  return row;
}

/** Row linking one directory level up. */
function parentRow(prefix) {
  const parent = prefix.replace(/[^/]+\/$/, "");
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  const link = document.createElement("a");
  link.href = browseUrl(`#/${parent}`, 1);
  link.textContent = "..";
  cell.appendChild(link);
  row.append(
    cell,
    textElement("td", ""),
    textElement("td", ""),
    textElement("td", ""),
  );
  return row;
}

/** Sorts folders and files together before the visible page is selected. */
function sortEntries(folders, files) {
  const entries = [
    ...folders.map((folder) => ({ type: "folder", name: folder, folder })),
    ...files.map((file) => ({ type: "file", name: file.key, file })),
  ];
  return entries.sort((left, right) => {
    let comparison = 0;
    if (sortKey === "size") {
      comparison = (left.file?.size ?? 0) - (right.file?.size ?? 0);
    } else if (sortKey === "modified") {
      comparison =
        new Date(left.file?.modified ?? 0).getTime() -
        new Date(right.file?.modified ?? 0).getTime();
    }

    // Use the name as a tie-breaker so equal values always have a stable order.
    if (comparison === 0 || sortKey === "name") {
      comparison = left.name.localeCompare(right.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });
}

function updatePagination(totalEntries) {
  const pagination = document.getElementById("pagination");
  const pageNumbers = document.getElementById("page-numbers");
  const previous = document.getElementById("previous-page");
  const next = document.getElementById("next-page");
  const pageCount = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE));

  currentPage = Math.min(currentPage, pageCount);
  updatePageUrl();
  pagination.hidden = totalEntries <= PAGE_SIZE;
  previous.disabled = currentPage === 1;
  next.disabled = currentPage === pageCount;
  pageNumbers.replaceChildren();

  // Keep the control on one line: the ellipsis buttons jump over a page range.
  for (const page of visiblePages(currentPage, pageCount)) {
    if (page.type === "ellipsis") {
      const direction = page.target < currentPage ? "jumpPrevious" : "jumpNext";
      const jumpSize = Math.abs(page.target - currentPage);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-number page-ellipsis";
      button.textContent = "…";
      button.title = `${translate(direction)} ${jumpSize} ${translate("pages")}, ${translate("page")} ${page.target}`;
      button.setAttribute(
        "aria-label",
        `${translate(direction)} ${jumpSize} ${translate("pages")}, ${translate("page")} ${page.target}`,
      );
      button.addEventListener("click", () => {
        currentPage = page.target;
        updatePageUrl();
        render();
      });
      pageNumbers.appendChild(button);
      continue;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-number";
    button.textContent = String(page);
    button.setAttribute("aria-label", `${translate("page")} ${page}`);
    if (page === currentPage) {
      button.setAttribute("aria-current", "page");
    }
    button.addEventListener("click", () => {
      currentPage = page;
      updatePageUrl();
      render();
    });
    pageNumbers.appendChild(button);
  }
}

/** Returns page numbers with ellipses when the directory has many pages. */
function visiblePages(page, pageCount) {
  // Larger result sets use larger jumps so distant pages remain reachable quickly.
  const jump = pageCount <= 30 ? 5 : pageCount <= 100 ? 10 : 25;
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, { type: "ellipsis", target: Math.min(pageCount - 1, page + jump) }, pageCount];
  }
  if (page >= pageCount - 3) {
    return [1, { type: "ellipsis", target: Math.max(2, page - jump) }, pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, { type: "ellipsis", target: Math.max(2, page - jump) }, page - 1, page, page + 1, { type: "ellipsis", target: Math.min(pageCount - 1, page + jump) }, pageCount];
}

function updateSortIndicators() {
  for (const button of document.querySelectorAll("[data-sort-key]")) {
    const isActive = button.dataset.sortKey === sortKey;
    button.dataset.sortDirection = isActive ? sortDirection : "";
    button.setAttribute(
      "aria-label",
      `${button.textContent.trim()}${isActive ? `, ${sortDirection}` : ""}`,
    );
  }
}

/** Loads and draws the directory named by the url hash. Runs on load and on every hash change. */
async function render() {
  // Each render invalidates earlier requests, so a slow response cannot overwrite newer content.
  const generation = ++renderGeneration;
  const prefix = currentPrefix();
  const listing = document.getElementById("listing");
  const status = document.getElementById("status");
  const pagination = document.getElementById("pagination");

  // Draw the loading state immediately, then replace it with the requested directory.
  renderBreadcrumb(prefix);
  listing.replaceChildren();
  pagination.hidden = true;
  status.textContent = translate("loading");

  try {
    const { folders, files } = await listPrefix(prefix);
    if (generation !== renderGeneration) {
      return;
    }
    const entries = sortEntries(folders, files);
    const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, pageCount);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageEntries = entries.slice(pageStart, pageStart + PAGE_SIZE);
    const rows = prefix ? [parentRow(prefix)] : [];
    rows.push(
      ...pageEntries.map((entry) =>
        entry.type === "folder"
          ? folderRow(prefix, entry.folder)
          : fileRow(prefix, entry.file),
      ),
    );
    listing.replaceChildren(...rows);
    status.textContent =
      folders.length + files.length === 0 ? translate("empty") : "";
    updatePagination(entries.length);
    updateSortIndicators();
  } catch (error) {
    console.error(error);
    if (generation !== renderGeneration) {
      return;
    }
    status.textContent = translate("error");
    pagination.hidden = true;
  }
}

/** Replaces the Finnish defaults in the markup when another language is selected. */
function applyTranslations() {
  document.documentElement.lang = lang;
  document.title = `${translate("title")} | Digitraffic`;
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = translate(element.dataset.i18n);
  }
  for (const link of document.querySelectorAll("[data-lang-link]")) {
    link.classList.toggle("active", link.dataset.langLink === lang);
    const languageUrl = new URL(
      browseUrl(window.location.hash.split("?")[0] || "#/"),
    );
    const languageParams = new URLSearchParams(
      languageUrl.hash.split("?")[1] ?? "",
    );
    languageParams.set("lang", link.dataset.langLink);
    languageUrl.hash = `${languageUrl.hash.split("?")[0]}?${languageParams}`;
    link.href = languageUrl.href;
  }
}

applyTranslations();
for (const button of document.querySelectorAll("[data-sort-key]")) {
  button.addEventListener("click", () => {
    if (sortKey === button.dataset.sortKey) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = button.dataset.sortKey;
      sortDirection = "desc";
    }
    currentPage = 1;
    render();
  });
}
document.getElementById("previous-page").addEventListener("click", () => {
  currentPage--;
  updatePageUrl();
  render();
});
document.getElementById("next-page").addEventListener("click", () => {
  currentPage++;
  updatePageUrl();
  render();
});
window.addEventListener("hashchange", () => {
  lang = resolveLanguage();
  currentPage = pageFromUrl();
  applyTranslations();
  updatePageUrl();
  render();
});
render();
