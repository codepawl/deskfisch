# Fischlein — kế hoạch bán và marketing

Trạng thái: bản nháp 2026-09-11, sau release 0.2.0. Mọi con số là ước lượng để lập kế hoạch, không phải dữ liệu đo được.

## 1. Định vị

**Một câu:** hồ cá pixel sống trên desktop của bạn, với chu trình nitơ thật — cá chết nếu bạn thả trước khi hồ cycle.

**Ai mua:**
- Người chơi cozy/idle game (Stardew Valley, Unpacking, Rusty's Retirement).
- Người thích desktop pet (Shimeji, Desktop Goose) — pet mode nổi trên màn hình là điểm bán chính.
- Người chơi cá cảnh thật (r/Aquariums ~1.2M thành viên) — thích vì sim đúng: acclimate, test kit, thay nước.

**Sản phẩm so sánh trực tiếp:**
- *Chillquarium* (Steam, 2023, ~$8): hồ cá idle, mở pack cá. Không có sim nước, không desktop pet.
- *Rusty's Retirement* (Steam, 2024, $7): idle farm nằm dưới đáy màn hình. Chứng minh thị trường "game chạy trong lúc làm việc" bán tốt.
- *Fisch* (Roblox): game câu cá rất phổ biến. Tên gốc "Fisch" của app trùng với nó, nên đã đổi thành **Fischlein** (xem mục 7).

Khe hở của mình: Chillquarium + Rusty's Retirement + fishkeeping thật. Không ai có cả ba.

## 2. Mô hình tiền

Chọn **bán một lần, không quảng cáo, không mua coin bằng tiền thật**. Người chơi cozy ghét MTX và sẽ nói ra trong review.

| Kênh | Giá | Vai trò |
|---|---|---|
| Web demo (bản browser đã có) | Miễn phí | Phễu đầu: chơi thử 5 phút, không cần cài |
| itch.io | Pay-what-you-want, gợi ý $3 | Beta công khai, lấy feedback, cộng đồng đầu tiên |
| Steam | $5.99, giảm 10% tuần đầu | Doanh thu chính. Steam lấy 30%, phí đăng $100 (hoàn khi doanh thu > $1k) |
| DLC sau này | $1.99–2.99 | Gói loài mới (cá biển, tép), gói decor theo chủ đề. Chỉ làm khi bản gốc đã bán được |

Web demo giới hạn: 3 loài, không save dài hạn, có nút "Get the desktop app".

## 3. Kịch bản doanh thu (Steam, sau khi trừ 30%)

| Kịch bản | Bản bán năm đầu | Doanh thu ròng |
|---|---|---|
| Thấp: không ai biết | 300 | ~$1.3k |
| Vừa: có 3–5k wishlist lúc ra | 2,000 | ~$8.4k |
| Tốt: một clip viral hoặc được streamer cozy chơi | 10,000 | ~$42k |

Kịch bản "vừa" là mục tiêu thực tế. Số wishlist trước ngày ra là chỉ báo quan trọng nhất: dưới 2k thì Steam gần như không đẩy.

## 4. Việc phải xong trước khi bán

Sản phẩm:
- [ ] **Ký số** Windows (Azure Trusted Signing ~$10/tháng) và macOS (Apple Developer $99/năm). Không ký thì SmartScreen/Gatekeeper chặn, tỉ lệ cài giảm mạnh.
- [ ] **Auto-update** bằng `tauri-plugin-updater` để vá bug sau khi bán.
- [ ] **Save an toàn**: backup save trước mỗi migration, nút "export save".
- [ ] **Localization** ít nhất EN + VI (UI đang tiếng Anh, tách string ra file).
- [ ] **Bản Steam**: build từ Actions, upload qua SteamPipe. Steam Overlay không bắt buộc.
- [ ] Kiểm tra CPU/RAM khi chạy 8 giờ liên tục (pet mode chạy cả ngày).
- [ ] Trang "Credits & licenses": font Pixelify Sans (OFL), không dùng asset bên thứ ba khác.

Marketing assets:
- [ ] Trailer 30–45 giây, không lời, nhạc lo-fi: thả túi cá → acclimate → thả → cá bơi trên desktop thật.
- [ ] 6–8 screenshot Steam đúng cỡ 1920×1080, kèm 3 GIF ngắn (pet mode kéo qua màn hình, cho ăn, cá đẻ).
- [ ] Capsule art Steam (nhiều cỡ), icon, banner itch.
- [ ] Press kit: mô tả 1 đoạn + 3 đoạn, logo, screenshot, link.

## 5. Lịch (12 tuần)

1. **Tuần 1–2 · Beta.** Sửa bug, ký số, updater. Lên itch.io miễn phí. Đăng thread "tôi làm hồ cá desktop" ở r/CozyGamers, r/IndieDev, r/pixelart, r/Aquariums (đọc rule tự quảng cáo trước). Mục tiêu: 200 người tải, 20 feedback.
2. **Tuần 3 · Steam page.** Đăng "Coming soon" (Steam bắt page phải sống ≥ 2 tuần trước ngày ra). Từ đây mọi bài đăng đều gắn link wishlist.
3. **Tuần 3–8 · Xây wishlist.** Mỗi tuần 1 GIF mới trên X/Bluesky/TikTok/YouTube Shorts với hashtag #indiegame #pixelart #cozygames. Nội dung tự nhiên: "cá tôi đẻ trong lúc tôi họp", "quên thay nước và hậu quả". Gửi key beta cho 20 streamer cozy nhỏ (5–50k sub), không nhắm streamer lớn.
4. **Tuần 6 · Steam Next Fest** nếu trúng đợt (tháng 2, 6, 10). Demo = bản web demo đóng gói. Next Fest thường nhân đôi wishlist.
5. **Tuần 10–12 · Ra mắt.** Giảm 10% tuần đầu, đăng lại ở mọi kênh, gửi key cho press cozy (Rock Paper Shotgun "Screenshot Saturday", Cozy Games Guide). Trả lời mọi review tuần đầu.
6. **Sau ra mắt.** Bản vá mỗi 2 tuần trong 2 tháng, mỗi bản có 1 thứ "đăng được" (loài mới, decor). Sale theo mùa Steam.

## 6. Kênh và nhịp

| Kênh | Nhịp | Dùng để |
|---|---|---|
| X / Bluesky | 2–3 bài/tuần | GIF quá trình làm, hỏi ý kiến loài cá tiếp theo |
| TikTok / Shorts | 1 clip/tuần | Clip 15s "desktop pet" — format này lan tốt |
| Reddit | 1 thread/2 tuần, xoay sub | Bài dài có ảnh, trả lời hết comment |
| itch.io devlog | Mỗi bản beta | Người tải beta quay lại |
| Discord nhỏ | Khi > 100 người beta | Feedback, bug, người test key |
| Cộng đồng VN | Song song | Facebook nhóm indie VN, Voz Games; nhấn "app Việt lên Steam" |

## 7. Rủi ro

- **Tên.** "Fisch" trùng game Roblox lớn nên đã đổi thành **Fischlein** (tiếng Đức: cá nhỏ). Đã kiểm tra: không có game/app nào tên Fischlein trên Steam, App Store, Google Play (2026-09-11). Còn phải kiểm tra trademark và giữ domain `fischlein.app` trước khi mở Steam page. "Fischkeeper" và "Fischtank" đều đụng game có sẵn.
- **Cửa sổ trong suốt trên Linux/Wayland** phụ thuộc XWayland; ghi rõ trong mô tả Steam là "Linux: X11 hoặc XWayland".
- **Cá chết làm người chơi cozy bỏ game.** Giữ chế độ "Gentle" trong Settings: không bệnh, không chết, chỉ stress — bật mặc định cho người mới, người thích sim thật tự tắt.
- **Một người làm.** Không hứa ngày ra trước khi trailer và bản ký số xong.

## 8. Đo lường

Không có telemetry trong app (điểm cộng để quảng cáo "no tracking"). Đo bằng: wishlist Steam, lượt tải itch, view/like clip, review Steam. Sau ra mắt: doanh số tuần 1 so với wishlist (Steam thường ~10–20% wishlist chuyển thành mua trong tháng đầu).
