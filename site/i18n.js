// Site strings. English lives in the HTML; every other language overrides by key.
// Pixel faces per script: VT323/Silkscreen for Latin, DotGothic16 for Japanese and
// Chinese, Galmuri11 for Korean (loaded from jsDelivr in style.css).
const I18N = {
  vi: {
    "nav.download": "Tải về", "nav.how": "Cách chơi", "nav.source": "Mã nguồn",
    "hero.title": "Một hồ cá nhỏ sống trên bàn làm việc của bạn.",
    "hero.lede": "Cá pixel với nhu cầu thật. Nước chạy chu trình nitơ thật, cá mới phải được thuần, và pet mode cho hồ nổi trên bất cứ thứ gì bạn đang làm.",
    "hero.download": "Tải về", "hero.play": "Chơi trên trình duyệt",
    "hero.free": "Miễn phí", "hero.version": "bản", "hero.browser": "trình duyệt", "hero.noads": "không tài khoản, không quảng cáo, không theo dõi.",
    "hero.caption": "Đây là app thật đang chạy trong trình duyệt của bạn. Cho cá ăn thử.",
    "features.title": "Điểm khác biệt",
    "f1.t": "Chu trình nitơ thật", "f1.p": "Ammonia thành nitrite thành nitrate. Hồ mới mất vài ngày để cycle, thả cá sớm là cá stress. Mua bộ test để thấy điều đó.",
    "f2.t": "Pet mode", "f2.p": "Cửa sổ không viền, trong suốt, nổi trên mọi app. Ghim một chỗ hoặc kéo đi bất cứ đâu. Chế độ chill ẩn hết điều khiển.",
    "f3.t": "Thuần cá đúng cách", "f3.p": "Cá mới về trong túi. Thả nổi, pha nước hồ vào, rồi kéo túi xuống dưới mặt nước. Làm vội là cá sốc.",
    "f4.t": "Chăm, không phải bấm", "f4.p": "Cho ăn bằng tay, chà rêu, hút sỏi, thay nước có khử clo. Bỏ bê là thấy nấm trắng và thối vây.",
    "f5.t": "Sinh sản và cửa hàng", "f5.p": "Guppy và molly vui vẻ sẽ đẻ cá con, lớn lên bán được. Xu mua lọc, sưởi, đèn, hồ to hơn và trang trí.",
    "f6.t": "Theo mặt trời", "f6.p": "Không có đèn hồ thì phòng tối về đêm và ám hồng vàng lúc bình minh, hoàng hôn, theo giờ thật hoặc ngày mô phỏng của hồ.",
    "dl.title": "Tải về", "dl.note": "Bản mới nhất từ GitHub. Bộ cài chưa ký số nên Windows và macOS sẽ cảnh báo lần đầu mở.",
    "dl.browser": "Trình duyệt", "dl.playnow": "Chơi ngay", "dl.browsernote": "Chỉ lưu trong trình duyệt này.",
    "dl.steam": "Steam: sắp có.", "dl.all": "Tất cả phiên bản",
    "how.title": "Một hồ bắt đầu thế nào",
    "h1.t": "Đổ cát", "h1.p": "Cá và cây cần nền để sống. Trồng cây lúc hồ còn khô.",
    "h2.t": "Đổ nước máy, rồi gắn lọc và sưởi", "h2.p": "Khử clo giữ clo ở ngoài. Lọc là nơi vi sinh có lợi sống.",
    "h3.t": "Thả một nhúm thức ăn và xem hồ cycle", "h3.p": "Thức ăn thối thành ammonia nuôi vi sinh. Ammonia tăng, rồi nitrite, rồi cả hai giảm. Mất vài ngày thật.",
    "h4.t": "Mua con cá đầu tiên", "h4.p": "Loài sống bầy cần một nhóm cùng loài.",
    "h5.t": "Thuần và thả", "h5.p": "Thả nổi túi mười phút, thêm nước hồ ba lần, kéo túi xuống.",
    "h6.t": "Cho ăn 1–2 lần mỗi ngày, thay một phần nước mỗi tuần", "h6.p": "Cả cái thú chơi chỉ có vậy.",
    "src.title": "Mã nguồn và ghi công", "src.p1": "Làm bằng Tauri, TypeScript và một framebuffer 384×240. Mỗi con cá là một lưới ký tự màu.", "src.link": "Đọc mã nguồn trên GitHub.",
    "src.lic": "Mã nguồn mở dạng PolyForm Noncommercial: đọc, chạy, sửa, chia sẻ, chỉ không được bán.",
    "foot.bug": "Báo lỗi",
    "dl.exe": "Bộ cài (.exe)", "dl.msi": "Gói MSI", "dl.dmg": "Ảnh đĩa (.dmg), Apple silicon + Intel", "dl.appimage": "AppImage (tự cập nhật)", "dl.deb": "Debian / Ubuntu (.deb)", "dl.rpm": "Fedora / openSUSE (.rpm)",
    "dl.github": "Lấy trên GitHub", "dl.for": "Tải cho {os}",
  },
  es: {
    "nav.download": "Descargar", "nav.how": "Cómo funciona", "nav.source": "Código",
    "hero.title": "Una pequeña pecera que vive en tu escritorio.",
    "hero.lede": "Peces pixel con necesidades reales. El agua sigue un ciclo del nitrógeno real, los peces nuevos se aclimatan, y el modo mascota flota la pecera sobre lo que estés haciendo.",
    "hero.download": "Descargar", "hero.play": "Jugar en el navegador",
    "hero.free": "Gratis", "hero.version": "versión", "hero.browser": "navegador", "hero.noads": "sin cuenta, sin anuncios, sin rastreo.",
    "hero.caption": "Es la app real corriendo en tu navegador. Dales de comer.",
    "features.title": "Qué la hace distinta",
    "f1.t": "Un ciclo del nitrógeno real", "f1.p": "El amoníaco se vuelve nitrito y luego nitrato. Una pecera nueva tarda días en ciclar, y los peces añadidos antes se estresan. Compra un kit de pruebas para verlo.",
    "f2.t": "Modo mascota", "f2.p": "Una ventana sin bordes y transparente que flota sobre tus apps. Fíjala o arrástrala a donde quieras. El modo relax oculta todos los controles.",
    "f3.t": "Aclimatación que importa", "f3.p": "Los peces nuevos llegan en una bolsa. Déjala flotar, mezcla agua de la pecera y arrástrala bajo la superficie. Si te apuras, el pez sufre un shock.",
    "f4.t": "Cuidar, no hacer clic", "f4.p": "Alimenta a mano, limpia las algas, aspira la grava, cambia agua con acondicionador. Si lo omites verás ich y podredumbre de aletas.",
    "f5.t": "Cría y tienda", "f5.p": "Guppys y mollys felices tienen alevines que crecen y se venden. Las monedas compran filtros, calentadores, luces, peceras más grandes y decoración.",
    "f6.t": "Sigue al sol", "f6.p": "Sin luz de pecera, la habitación se oscurece de noche y se tiñe de rosa y oro al amanecer y al atardecer, con tu reloj real o el día simulado de la pecera.",
    "dl.title": "Descargar", "dl.note": "Última versión desde GitHub. Los instaladores aún no están firmados, así que Windows y macOS avisarán al abrir por primera vez.",
    "dl.browser": "Navegador", "dl.playnow": "Jugar ahora", "dl.browsernote": "Guarda solo en este navegador.",
    "dl.steam": "Steam: próximamente.", "dl.all": "Todas las versiones",
    "how.title": "Cómo empieza una pecera",
    "h1.t": "Echa arena", "h1.p": "Peces y plantas necesitan un lecho. Planta algo mientras está seca.",
    "h2.t": "Llénala con agua del grifo y añade filtro y calentador", "h2.p": "El acondicionador deja fuera el cloro. En el filtro viven las bacterias buenas.",
    "h3.t": "Echa una pizca de comida y observa el ciclo", "h3.p": "Se pudre en amoníaco, que alimenta a las bacterias. Sube el amoníaco, luego el nitrito, luego bajan ambos. Unos días reales.",
    "h4.t": "Compra tu primer pez", "h4.p": "Las especies de cardumen necesitan un grupo de su especie.",
    "h5.t": "Aclimata y suelta", "h5.p": "Deja flotar la bolsa diez minutos, añade agua de la pecera tres veces, arrástrala bajo el agua.",
    "h6.t": "Alimenta una o dos veces al día, cambia algo de agua cada semana", "h6.p": "Ese es todo el hobby.",
    "src.title": "Código y créditos", "src.p1": "Hecho con Tauri, TypeScript y un framebuffer de 384×240. Cada pez es una cuadrícula de caracteres de paleta.", "src.link": "Lee el código en GitHub.",
    "src.lic": "Código disponible bajo PolyForm Noncommercial: léelo, ejecútalo, modifícalo, compártelo, pero no lo vendas.",
    "foot.bug": "Reportar un error",
    "dl.exe": "Instalador (.exe)", "dl.msi": "Paquete MSI", "dl.dmg": "Imagen de disco (.dmg), Apple silicon + Intel", "dl.appimage": "AppImage (se actualiza solo)", "dl.deb": "Debian / Ubuntu (.deb)", "dl.rpm": "Fedora / openSUSE (.rpm)",
    "dl.github": "Descargar en GitHub", "dl.for": "Descargar para {os}",
  },
  zh: {
    "nav.download": "下载", "nav.how": "怎么玩", "nav.source": "源码",
    "hero.title": "一个住在你桌面上的小鱼缸。",
    "hero.lede": "有真实需求的像素鱼。水体运行真实的氮循环，新鱼需要过水，宠物模式让鱼缸浮在你正在做的任何事情之上。",
    "hero.download": "下载", "hero.play": "在浏览器中玩",
    "hero.free": "免费", "hero.version": "版本", "hero.browser": "浏览器", "hero.noads": "无需账号，无广告，无追踪。",
    "hero.caption": "这就是在你浏览器里运行的真实应用。喂喂它们。",
    "features.title": "它有什么不同",
    "f1.t": "真实的氮循环", "f1.p": "氨变成亚硝酸盐，再变成硝酸盐。新缸需要几天才能建立硝化系统，过早放鱼会让鱼紧张。买一套测试剂亲眼看看。",
    "f2.t": "宠物模式", "f2.p": "无边框、透明的窗口，浮在你的应用之上。固定住，或拖到任何地方。放松模式隐藏所有控件。",
    "f3.t": "认真的过水", "f3.p": "新鱼装在袋子里到家。先漂浮，再兑入缸水，然后把袋子拖到水面下。急了鱼会应激。",
    "f4.t": "是照顾，不是点击", "f4.p": "手动喂食、刷藻、洗沙、用水质稳定剂换水。偷懒就会看到白点病和烂鳍。",
    "f5.t": "繁殖与商店", "f5.p": "开心的孔雀鱼和玛丽鱼会生小鱼，长大后可以出售。金币可以买过滤器、加热棒、灯、更大的缸和造景。",
    "f6.t": "跟着太阳", "f6.p": "没有缸灯时，房间夜里变暗，黎明和黄昏泛起玫瑰金，依照你的真实时钟或鱼缸自己的模拟日。",
    "dl.title": "下载", "dl.note": "来自 GitHub 的最新版本。安装包尚未签名，Windows 和 macOS 首次打开时会提示。",
    "dl.browser": "浏览器", "dl.playnow": "现在就玩", "dl.browsernote": "只保存在这个浏览器里。",
    "dl.steam": "Steam：即将推出。", "dl.all": "所有版本",
    "how.title": "一个鱼缸如何开始",
    "h1.t": "倒入沙子", "h1.p": "鱼和植物需要底床。趁干的时候种点东西。",
    "h2.t": "注入自来水，然后装过滤器和加热棒", "h2.p": "水质稳定剂把氯挡在外面。过滤器是有益菌的家。",
    "h3.t": "撒一小撮饲料，观察循环", "h3.p": "它腐烂成氨，喂养细菌。氨先升，亚硝酸盐再升，然后两者回落。需要几天真实时间。",
    "h4.t": "买第一条鱼", "h4.p": "群游的品种需要一群同类。",
    "h5.t": "过水并放鱼", "h5.p": "袋子漂浮十分钟，兑入缸水三次，拖到水面下。",
    "h6.t": "每天喂一两次，每周换一些水", "h6.p": "这就是整个爱好。",
    "src.title": "源码与致谢", "src.p1": "用 Tauri、TypeScript 和一个 384×240 的帧缓冲做成。每条鱼都是一格格调色板字符。", "src.link": "在 GitHub 上阅读源码。",
    "src.lic": "源码以 PolyForm Noncommercial 许可开放：可读、可运行、可修改、可分享，只是不能出售。",
    "foot.bug": "报告问题",
    "dl.exe": "安装程序 (.exe)", "dl.msi": "MSI 包", "dl.dmg": "磁盘映像 (.dmg)，Apple 芯片 + Intel", "dl.appimage": "AppImage（自动更新）", "dl.deb": "Debian / Ubuntu (.deb)", "dl.rpm": "Fedora / openSUSE (.rpm)",
    "dl.github": "去 GitHub 获取", "dl.for": "下载 {os} 版",
  },
  ko: {
    "nav.download": "다운로드", "nav.how": "어떻게 하나요", "nav.source": "소스",
    "hero.title": "책상 위에 사는 작은 어항.",
    "hero.lede": "진짜 욕구가 있는 픽셀 물고기. 물은 실제 질소 순환을 따르고, 새 물고기는 물맞댐이 필요하며, 펫 모드는 어항을 지금 하는 일 위에 띄웁니다.",
    "hero.download": "다운로드", "hero.play": "브라우저에서 플레이",
    "hero.free": "무료", "hero.version": "버전", "hero.browser": "브라우저", "hero.noads": "계정 없음, 광고 없음, 추적 없음.",
    "hero.caption": "브라우저에서 실행 중인 진짜 앱입니다. 먹이를 줘 보세요.",
    "features.title": "무엇이 다른가",
    "f1.t": "진짜 질소 순환", "f1.p": "암모니아는 아질산염이 되고 다시 질산염이 됩니다. 새 어항은 물잡이에 며칠이 걸리고, 너무 일찍 넣은 물고기는 스트레스를 받습니다. 테스트 키트를 사서 직접 보세요.",
    "f2.t": "펫 모드", "f2.p": "테두리 없는 투명 창이 앱 위에 떠 있습니다. 고정하거나 어디로든 끌어다 놓으세요. 칠 모드는 모든 조작을 숨깁니다.",
    "f3.t": "제대로 된 물맞댐", "f3.p": "새 물고기는 봉지에 담겨 옵니다. 띄우고, 어항 물을 섞고, 수면 아래로 끌어다 놓으세요. 서두르면 물고기가 쇼크를 받습니다.",
    "f4.t": "클릭이 아니라 돌봄", "f4.p": "손으로 먹이 주기, 이끼 닦기, 바닥재 청소, 수질 안정제로 물갈이. 게을리하면 백점병과 지느러미 썩음을 보게 됩니다.",
    "f5.t": "번식과 상점", "f5.p": "행복한 구피와 몰리는 치어를 낳고, 자라면 팔 수 있습니다. 코인으로 여과기, 히터, 조명, 더 큰 어항과 장식을 삽니다.",
    "f6.t": "해를 따라서", "f6.p": "어항 조명이 없으면 밤에는 방이 어두워지고 새벽과 해질녘엔 장밋빛으로 물듭니다. 실제 시계나 어항의 시뮬레이션 하루를 따릅니다.",
    "dl.title": "다운로드", "dl.note": "GitHub의 최신 릴리스. 설치 파일은 아직 코드 서명이 없어 Windows와 macOS에서 첫 실행 시 경고가 뜹니다.",
    "dl.browser": "브라우저", "dl.playnow": "지금 플레이", "dl.browsernote": "이 브라우저에만 저장됩니다.",
    "dl.steam": "Steam: 곧 출시.", "dl.all": "모든 릴리스",
    "how.title": "어항은 이렇게 시작합니다",
    "h1.t": "모래 붓기", "h1.p": "물고기와 식물에겐 바닥이 필요합니다. 마른 상태에서 뭔가 심어 보세요.",
    "h2.t": "수돗물을 채우고 여과기와 히터 달기", "h2.p": "수질 안정제가 염소를 막아 줍니다. 여과기는 유익균이 사는 곳입니다.",
    "h3.t": "먹이 한 꼬집을 넣고 순환 지켜보기", "h3.p": "썩어서 암모니아가 되고, 그것이 박테리아를 먹입니다. 암모니아가 오르고, 아질산염이 오르고, 둘 다 떨어집니다. 실제로 며칠 걸립니다.",
    "h4.t": "첫 물고기 사기", "h4.p": "군영하는 종은 같은 종의 무리가 필요합니다.",
    "h5.t": "물맞댐 후 방류", "h5.p": "봉지를 10분 띄우고, 어항 물을 세 번 섞고, 수면 아래로 끌어다 놓으세요.",
    "h6.t": "하루 한두 번 먹이, 매주 일부 물갈이", "h6.p": "취미의 전부입니다.",
    "src.title": "소스와 크레딧", "src.p1": "Tauri, TypeScript, 384×240 프레임버퍼로 만들었습니다. 물고기 하나하나가 팔레트 문자 격자입니다.", "src.link": "GitHub에서 소스 읽기.",
    "src.lic": "PolyForm Noncommercial로 공개된 소스: 읽고, 실행하고, 고치고, 나누되 판매는 안 됩니다.",
    "foot.bug": "버그 신고",
    "dl.exe": "설치 파일 (.exe)", "dl.msi": "MSI 패키지", "dl.dmg": "디스크 이미지 (.dmg), Apple silicon + Intel", "dl.appimage": "AppImage (자동 업데이트)", "dl.deb": "Debian / Ubuntu (.deb)", "dl.rpm": "Fedora / openSUSE (.rpm)",
    "dl.github": "GitHub에서 받기", "dl.for": "{os}용 다운로드",
  },
  ja: {
    "nav.download": "ダウンロード", "nav.how": "遊び方", "nav.source": "ソース",
    "hero.title": "デスクに住む、小さな水槽。",
    "hero.lede": "本物の欲求を持つドット絵の魚。水は本物の窒素循環を回し、新しい魚には水合わせが必要で、ペットモードは作業中の画面の上に水槽を浮かべます。",
    "hero.download": "ダウンロード", "hero.play": "ブラウザで遊ぶ",
    "hero.free": "無料", "hero.version": "バージョン", "hero.browser": "ブラウザ", "hero.noads": "アカウント不要、広告なし、トラッキングなし。",
    "hero.caption": "ブラウザで動いている本物のアプリです。餌をあげてみてください。",
    "features.title": "何が違うのか",
    "f1.t": "本物の窒素循環", "f1.p": "アンモニアは亜硝酸に、そして硝酸になります。新しい水槽の立ち上げには数日かかり、早く入れすぎた魚はストレスを受けます。テストキットを買って確かめてください。",
    "f2.t": "ペットモード", "f2.p": "枠のない透明なウィンドウがアプリの上に浮かびます。固定するか、どこへでもドラッグ。チルモードは操作を全部隠します。",
    "f3.t": "意味のある水合わせ", "f3.p": "新しい魚は袋で届きます。浮かべて、水槽の水を混ぜ、水面の下へドラッグ。急ぐと魚がショックを受けます。",
    "f4.t": "クリックではなく世話", "f4.p": "手で餌やり、コケ掃除、底砂の掃除、カルキ抜きでの水換え。怠ると白点病や尾ぐされが出ます。",
    "f5.t": "繁殖とショップ", "f5.p": "機嫌のいいグッピーとモーリーは稚魚を産み、育てば売れます。コインでフィルター、ヒーター、ライト、大きな水槽、装飾を買えます。",
    "f6.t": "太陽に合わせて", "f6.p": "水槽ライトがなければ、夜は部屋が暗くなり、夜明けと夕暮れは薔薇色に。実際の時計か、水槽独自の一日で。",
    "dl.title": "ダウンロード", "dl.note": "GitHub の最新リリース。インストーラーは未署名のため、Windows と macOS では初回起動時に警告が出ます。",
    "dl.browser": "ブラウザ", "dl.playnow": "今すぐ遊ぶ", "dl.browsernote": "このブラウザにのみ保存されます。",
    "dl.steam": "Steam：近日公開。", "dl.all": "すべてのリリース",
    "how.title": "水槽の始まり",
    "h1.t": "砂を入れる", "h1.p": "魚と水草には底床が必要です。乾いているうちに何か植えましょう。",
    "h2.t": "水道水を入れ、フィルターとヒーターを付ける", "h2.p": "カルキ抜きが塩素を防ぎます。フィルターは善玉菌の住まいです。",
    "h3.t": "餌をひとつまみ入れて循環を見守る", "h3.p": "腐ってアンモニアになり、バクテリアの餌になります。アンモニアが上がり、亜硝酸が上がり、両方下がる。数日かかります。",
    "h4.t": "最初の魚を買う", "h4.p": "群れる種類は同種の群れが必要です。",
    "h5.t": "水合わせして放す", "h5.p": "袋を10分浮かべ、水槽の水を3回足し、水面の下へドラッグ。",
    "h6.t": "1日1〜2回の餌やり、週に一度の部分水換え", "h6.p": "それがこの趣味のすべてです。",
    "src.title": "ソースとクレジット", "src.p1": "Tauri、TypeScript、384×240 のフレームバッファ製。魚はどれもパレット文字のグリッドです。", "src.link": "GitHub でソースを読む。",
    "src.lic": "PolyForm Noncommercial で公開：読む、動かす、改変、共有は自由、販売だけ不可。",
    "foot.bug": "バグを報告",
    "dl.exe": "インストーラー (.exe)", "dl.msi": "MSI パッケージ", "dl.dmg": "ディスクイメージ (.dmg)、Apple シリコン + Intel", "dl.appimage": "AppImage（自動更新）", "dl.deb": "Debian / Ubuntu (.deb)", "dl.rpm": "Fedora / openSUSE (.rpm)",
    "dl.github": "GitHub で入手", "dl.for": "{os} 版をダウンロード",
  },
};

const LANG_NAMES = { en: "English", vi: "Tiếng Việt", es: "Español", zh: "中文", ko: "한국어", ja: "日本語" };
const EN = {};
for (const el of document.querySelectorAll("[data-i18n]")) EN[el.dataset.i18n] = el.textContent;
Object.assign(EN, {
  "dl.exe": "Installer (.exe)", "dl.msi": "MSI package", "dl.dmg": "Disk image (.dmg), Apple silicon + Intel", "dl.appimage": "AppImage (auto-updates)", "dl.deb": "Debian / Ubuntu (.deb)", "dl.rpm": "Fedora / openSUSE (.rpm)",
  "dl.github": "Get it on GitHub", "dl.for": "Download for {os}",
});

function pickLang() {
  const saved = localStorage.getItem("deskfisch-lang");
  if (saved && LANG_NAMES[saved]) return saved;
  const nav = (navigator.language || "en").toLowerCase().slice(0, 2);
  return LANG_NAMES[nav] ? nav : "en";
}

let current = pickLang();
window.t = (key, params) => {
  let s = (I18N[current] && I18N[current][key]) ?? EN[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
  return s;
};

function applyLang(lang) {
  current = lang;
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = window.t(el.dataset.i18n);
  document.dispatchEvent(new CustomEvent("langchange"));
}

const select = document.getElementById("lang");
for (const [code, name] of Object.entries(LANG_NAMES)) {
  const o = document.createElement("option");
  o.value = code;
  o.textContent = name;
  select.append(o);
}
select.value = current;
select.onchange = () => {
  localStorage.setItem("deskfisch-lang", select.value);
  applyLang(select.value);
};
applyLang(current);
