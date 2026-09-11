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
  // Platforms: penguin, apple, four panes, globe.
  linux: ["..KKKK..", ".KWWWWK.", ".KWyWyK.", ".KKyyKK.", "KWWWWWWK", "KWWWWWWK", ".KWWWWK.", "..yy.yy."],
  mac: ["....G...", "...G....", ".WWWWWW.", "WWWWWWWW", "WWWWWWWW", "WWWWWWWW", ".WWWWWW.", "..WW.WW."],
  win: ["BBB.BBBB", "BBB.BBBB", "BBB.BBBB", "........", "BBB.BBBB", "BBB.BBBB", "BBB.BBBB", "........"],
  web: ["..cccc..", ".cBBBBc.", "cBcBBcBc", "cBBBBBBc", "cccccccc", "cBcBBcBc", ".cBBBBc.", "..cccc.."],
};

for (const el of document.querySelectorAll(".ico[data-icon]")) {
  const rows = ICONS[el.dataset.icon];
  if (!rows) continue;
  const rects = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (PALETTE[ch]) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${PALETTE[ch]}"/>`); }));
  el.innerHTML = `<svg viewBox="0 0 8 8" aria-hidden="true">${rects.join("")}</svg>`;
}

const ua = navigator.userAgent;
const os = /Windows/.test(ua) ? "win" : /Mac/.test(ua) ? "mac" : /Linux|X11/.test(ua) ? "linux" : "web";
document.querySelector(`.dl[data-os="${os}"]`)?.classList.add("mine");

const kinds = [
  { os: "win", test: /x64-setup\.exe$/, label: "Installer (.exe)" },
  { os: "win", test: /\.msi$/, label: "MSI package" },
  { os: "mac", test: /\.dmg$/, label: "Disk image (.dmg), Apple silicon + Intel" },
  { os: "linux", test: /\.AppImage$/, label: "AppImage (auto-updates)" },
  { os: "linux", test: /\.deb$/, label: "Debian / Ubuntu (.deb)" },
  { os: "linux", test: /\.rpm$/, label: "Fedora / openSUSE (.rpm)" },
];
const mb = (n) => `${(n / 1048576).toFixed(0)} MB`;

fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
  .then((r) => r.json())
  .then((rel) => {
    // Unauthenticated GitHub API calls are rate-limited per IP; fall back to plain links.
    if (!rel.tag_name) throw new Error(rel.message ?? "no release");
    document.getElementById("ver").textContent = rel.tag_name;
    let primary = null;
    for (const k of kinds) {
      const a = (rel.assets ?? []).find((x) => k.test.test(x.name));
      if (!a) continue;
      const box = document.querySelector(`.dl[data-os="${k.os}"] .links`);
      const link = document.createElement("a");
      link.className = "btn";
      link.href = a.browser_download_url;
      link.textContent = k.label;
      const size = document.createElement("span");
      size.className = "size";
      size.textContent = mb(a.size);
      box.append(link, size);
      if (!primary && k.os === os) primary = a.browser_download_url;
    }
    if (primary) {
      const cta = document.getElementById("cta-download");
      cta.href = primary;
      cta.textContent = `Download for ${{ win: "Windows", mac: "macOS", linux: "Linux" }[os]}`;
    }
  })
  .catch(() => {
    document.getElementById("ver").textContent = "latest";
    for (const os of ["linux", "mac", "win"]) {
      const box = document.querySelector(`.dl[data-os="${os}"] .links`);
      const link = document.createElement("a");
      link.className = "btn";
      link.href = `https://github.com/${REPO}/releases/latest`;
      link.textContent = "Get it on GitHub";
      box.append(link);
    }
  });
