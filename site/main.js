// Fills the download cards from the latest GitHub release and highlights the visitor's OS.
const REPO = "codepawl/deskfisch";
const PALETTE = { K: "#1a1c2c", d: "#333c57", D: "#566c86", L: "#94b0c2", W: "#f4f4f4", r: "#b13e53", R: "#ef7d57", y: "#ffcd75", g: "#38b764", G: "#a7f070", n: "#29366f", b: "#3b5dc9", B: "#41a6f6", c: "#73eff7", S: "#eec39a" };
const ICONS = {
  feed: ["........", "..yy.y..", ".y..y.S.", "..S...y.", ".y.yy...", "..y..S..", ".S.y....", "........"],
  water: ["...c....", "...c....", "..ccc...", ".ccccc..", ".cWccc..", ".ccccc..", "..ccc...", "........"],
  test: ["..LLLL..", "...WW...", "...WW...", "...WW...", "...GG...", "..GGGG..", "..GGGG..", "...GG..."],
  coin: ["..yyyy..", ".yyyyyy.", "yyySSyyy", "yySyyyyy", "yySyyyyy", "yyySSyyy", ".yyyyyy.", "..yyyy.."],
  mode: ["DDDDDDDD", "DLLLLLLD", "DDDDDDDD", "D......D", "D......D", "D......D", "D......D", "DDDDDDDD"],
  chill: ["...WWW..", "..WW....", ".WW.....", ".WW.....", ".WW.....", "..WW....", "...WWW..", "........"],
  guide: ["WWWWWWW.", "WLLLWLLW", "WLLLWLLW", "WWWWWWWW", "WLLLWLLW", "WLLLWLLW", "WWWWWWW.", "........"],
  dl: ["...yy...", "...yy...", "...yy...", ".yyyyyy.", "..yyyy..", "...yy...", "LLLLLLLL", "L......L"],
  ask: ["..yyyy..", ".yy..yy.", ".....yy.", "....yy..", "...yy...", "...yy...", "........", "...yy..."],
  code: [".c....c.", "c......c", "c......c", "c..yy..c", "c..yy..c", "c......c", "c......c", ".c....c."],
  // The codepawl mascot: a round blob with a tuft, winking >.-
  paw: ["...WW.......", "..WWWWW.....", "..WWWWWWW...", ".WWWWWWWWW..", "..WWWWWWWWW.", ".WWWWWWWWWWW", "WWWKWWWWWWWW", "WWWWKWWKKKWW", "WWWKWWWWWWWW", "WWWWWWKWWWWW", ".WWWWWWWWWW.", "..WWWWWWWW.."],
  // Platforms at 12×12: Tux (slate body so it reads on the dark panel), apple with leaf and bite, four panes, ringed globe.
  linux: ["....dddd....", "...dddddd...", "...dWddWd...", "...ddyydd...", "..ddWyyWdd..", ".ddWWWWWWdd.", ".dWWWWWWWWd.", ".dWWWWWWWWd.", "ddWWWWWWWWdd", "dddWWWWWWddd", ".yydWWWWdyy.", "..yyddddyy.."],
  mac: [".......G....", "......G.....", "..WWW.WWW...", ".WWWWWWWWWW.", "WWWWWWWWWW..", "WWWWWWWWW...", "WWWWWWWWW...", "WWWWWWWWWW..", "WWWWWWWWWWW.", ".WWWWWWWWWW.", ".WWWW.WWWW..", "............"],
  win: ["BBBBB.BBBBB.", "BBBBB.BBBBB.", "BBBBB.BBBBB.", "BBBBB.BBBBB.", "BBBBB.BBBBB.", "............", "BBBBB.BBBBB.", "BBBBB.BBBBB.", "BBBBB.BBBBB.", "BBBBB.BBBBB.", "BBBBB.BBBBB.", "............"],
  web: ["....BBBB....", "..BBGGBBBB..", ".BBGGGBBBBB.", ".BGGBBBBGBB.", "cBBBBBBBGGBc", ".ccBBBBBBcc.", "...ccccccc..", ".BBBGGBBBBB.", ".BBBBGGBBBB.", "..BBBBBBBB..", "....BBBB....", "............"],
};

for (const el of document.querySelectorAll(".ico[data-icon]")) {
  const rows = ICONS[el.dataset.icon];
  if (!rows) continue;
  const rects = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (PALETTE[ch]) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${PALETTE[ch]}"/>`); }));
  el.innerHTML = `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" aria-hidden="true">${rects.join("")}</svg>`;
}

const ua = navigator.userAgent;
const os = /Windows/.test(ua) ? "win" : /Mac/.test(ua) ? "mac" : /Linux|X11/.test(ua) ? "linux" : "web";
document.querySelector(`.dl[data-os="${os}"]`)?.classList.add("mine");

const kinds = [
  { os: "win", test: /x64-setup\.exe$/, key: "dl.exe" },
  { os: "win", test: /\.msi$/, key: "dl.msi" },
  { os: "mac", test: /\.dmg$/, key: "dl.dmg" },
  { os: "linux", test: /\.AppImage$/, key: "dl.appimage" },
  { os: "linux", test: /\.deb$/, key: "dl.deb" },
  { os: "linux", test: /\.rpm$/, key: "dl.rpm" },
];
const mb = (n) => `${(n / 1048576).toFixed(0)} MB`;
const OS_NAME = { win: "Windows", mac: "macOS", linux: "Linux" };

// Rendered from the release data on load and again whenever the language changes.
let release = null;
function renderDownloads() {
  for (const box of document.querySelectorAll('.dl:not([data-os="web"]) .links')) box.replaceChildren();
  const cta = document.getElementById("cta-download");
  if (!release) {
    document.getElementById("ver").textContent = "latest";
    for (const o of ["linux", "mac", "win"]) {
      const link = document.createElement("a");
      link.className = "btn";
      link.href = `https://github.com/${REPO}/releases/latest`;
      link.textContent = t("dl.github");
      document.querySelector(`.dl[data-os="${o}"] .links`).append(link);
    }
    cta.textContent = t("hero.download");
    return;
  }
  document.getElementById("ver").textContent = release.tag_name;
  let primary = null;
  for (const k of kinds) {
    const a = (release.assets ?? []).find((x) => k.test.test(x.name));
    if (!a) continue;
    const link = document.createElement("a");
    link.className = "btn";
    link.href = a.browser_download_url;
    link.textContent = t(k.key);
    const size = document.createElement("span");
    size.className = "size";
    size.textContent = mb(a.size);
    document.querySelector(`.dl[data-os="${k.os}"] .links`).append(link, size);
    if (!primary && k.os === os) primary = a.browser_download_url;
  }
  if (primary) {
    cta.href = primary;
    cta.textContent = t("dl.for", { os: OS_NAME[os] });
  } else {
    cta.textContent = t("hero.download");
  }
}
document.addEventListener("langchange", renderDownloads);

fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
  .then((r) => r.json())
  .then((rel) => {
    // Unauthenticated GitHub API calls are rate-limited per IP; fall back to plain links.
    if (!rel.tag_name) throw new Error(rel.message ?? "no release");
    release = rel;
  })
  .catch(() => {
    release = null;
  })
  .finally(renderDownloads);
