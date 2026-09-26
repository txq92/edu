import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/help")({ component: HelpPage });

const SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: "Cài trên máy local",
    items: [
      "Trong thư mục source: npm install rồi npm run dev. Lệnh này chạy node scripts/with-app-env.mjs vite dev --host 0.0.0.0 --port 8080.",
      "Script đọc .grok/app-env.json trước khi bật Vite. Chỉ lấy khóa bắt đầu bằng VITE_. Biến process.env cùng tên được ưu tiên hơn file.",
      "File hiện có VITE_AUTH_ENABLED là false. Khóa deploy trong file không được nạp vì không bắt đầu bằng VITE_.",
      "Không có DATABASE_URL thì sổ mật khẩu dùng PGLite trong RAM của process. Sửa code và hot reload không xóa sổ. Tắt npm run dev là sổ mật khẩu mất. npm run build gọi db:migrate, không có DATABASE_URL thì migrate bỏ qua.",
      "Có DATABASE_URL thì dùng Postgres. migrate áp migrations/*.sql, trong đó có bảng player_book.",
      "Cài đặt và Rule không nằm trên server. Trình duyệt lưu localStorage tên nukida-settings và nukida-rules. API key, secret, Telegram, tiền vào, đòn bẩy, SL tiền nằm trong nukida-settings.",
      "Sổ lệnh có bản local nukida-paper và bản server. Server là một dòng player_book, id solo, cột doc kiểu JSON: hash mật khẩu scrypt, token, và paper. Mật khẩu tối thiểu 4 ký tự. Token đăng nhập lưu localStorage tên meo-den-token.",
      "Đổi trình duyệt trên cùng máy chủ thì nhập lại mật khẩu để kéo sổ. API key và rule không đi theo sổ, phải nhập lại trên trình duyệt đó.",
    ],
  },
  {
    title: "Các màn",
    items: [
      "Desk: watchlist, biểu đồ, thẻ setup, checklist, vị thế.",
      "Nhật ký: lệnh đang mở và đã đóng, giờ Việt Nam, tiền vào, lời lỗ.",
      "Rule: bộ luật bot đang dùng khi auto paper và khi bấm vào lệnh.",
      "Test: backtest trên nến đã tải. Rule ở đây chưa đổi bot cho đến khi bấm Gắn vào bot.",
      "Cài đặt: tiền mỗi lệnh, đòn bẩy, SL tiền, API Binance, Telegram, bật live.",
      "Lần đầu vào app phải tạo một mật khẩu. Sổ lệnh lưu JSON trên server. Trình duyệt khác nhập cùng mật khẩu thì thấy cùng sổ.",
    ],
  },
  {
    title: "Desk",
    items: [
      "Góc phải hiện PAPER hoặc LIVE, vốn giấy, và công tắc Auto paper.",
      "Auto paper bật thì mọi coin trên watchlist đang chữ Setup được vào lệnh giấy. Mỗi coin chỉ một vị thế. Không vào khi đang halt.",
      "Nút Vào lệnh giấy và Gửi Binance chỉ bấm được khi thẻ đang chữ ĐƯỢC VÀO. THEO DÕI là chưa đủ cửa.",
      "Vào cưỡng bức bỏ checklist. Vẫn không vào nếu coin đó đang có vị thế hoặc khối lượng bằng 0. Cưỡng bức vẫn vào được khi đang halt.",
      "Bấm một vị thế thì nhảy tới biểu đồ coin đó và vẽ mức vào, SL, TP1, TP2.",
      "Đường Vùng Bò và Vùng Gấu trên biểu đồ lấy từ H1 và H4. Bấm M1, M5 hay H4 thì các đường đó không đổi. EMA và VWAP trên hình thì tính theo khung đang xem.",
      "Giờ trên biểu đồ và nhật ký là giờ Việt Nam.",
      "Ô Replay rule ở Desk chỉ chạy lại coin đang xem, tối đa 12 lệnh gần. Không phải trang Test.",
    ],
  },
  {
    title: "Watchlist",
    items: [
      "Mặc định tới 20 coin. Tối đa 20. Khung chỉ hiện khoảng 5 dòng, kéo để xem tiếp.",
      "Gõ mã rồi Thêm. App kiểm tra cặp USDT trên Binance trước khi thêm.",
      "Setup nghĩa là tín hiệu của coin đó requiredPass, đủ cửa để vào.",
      "Theo dõi nghĩa là có tín hiệu nhưng còn dòng từ chối.",
      "Không chữ nào nghĩa là ba máy quét không tạo được ứng viên.",
    ],
  },
  {
    title: "Cách một lệnh được tạo",
    items: [
      "Máy quét tạo ứng viên trên nến đã đóng. Có ứng viên chưa đủ để vào.",
      "Khung lớn: nếu H4 không đi ngang thì lấy hướng H4, nếu H4 đi ngang thì lấy hướng H1. Tăng là đỉnh sau cao hơn và đáy sau cao hơn. Giảm là đỉnh sau thấp hơn và đáy sau thấp hơn. Còn lại là đi ngang.",
      "Vùng Bò và vùng Gấu chỉ lấy trên H1 và H4. Một đáy swing có cú phản ứng phía sau thì thành vùng Bò. Một đỉnh swing có cú phản ứng thì thành vùng Gấu. Tối đa 4 vùng mỗi khung.",
      "Long chỉ xét vùng Bò khi khung lớn đang tăng. Short chỉ xét vùng Gấu khi khung lớn đang giảm. Đi ngang thì không có vùng hợp lệ.",
      "Giá vào phải nằm trong vùng đó. Độ nhạy Chặt, Vừa, Rộng nới biên vùng: hệ số 1, 1.6 hoặc 2.4.",
      "Nếu ô tiền SL để trống và có vùng: SL long bằng đáy vùng nhân 0,999. SL short bằng đỉnh vùng nhân 1,001. Cách mép 0,1%.",
      "Nếu đã nhập số tiền SL: khối lượng = tiền vào × đòn bẩy. Khoảng cách SL = số tiền lỗ chia khối lượng. TP được tính lại theo R:R.",
      "TP1 = R:R đang đặt. TP2 = số lớn hơn giữa 2.5 và R:R + 1.",
      "Chạm TP1 trên lệnh giấy: đóng 50%, kéo SL về giá vào. Chạm TP2 hoặc SL: đóng hết.",
    ],
  },
  {
    title: "Ba kiểu ứng viên",
    items: [
      "Breakout: hộp trên nến 15 phút. Một trong ba nến 15 phút đóng ngoài hộp. Nến 5 phút quay lại mép hộp, trong khoảng 0,24% nhân độ nhạy, râu giữ mép, và có nến đảo chiều. Bốn nến 5 phút gần nhất không đóng xuyên lại vào hộp. Tên lệnh: Breakout + retest lên hoặc Breakdown + retest xuống.",
      "EMA: trên 15 phút, EMA 9 nằm đúng phía EMA 21, giá đóng cùng phía, độ dốc EMA 21 đủ. Độ nhạy không phải Rộng thì bỏ nếu EMA vừa cắt nhau trong 8 nến. Nến 5 phút chạm EMA 21 và đảo chiều, không đóng quá sâu qua EMA. Tên: Pullback EMA 9/21 mua hoặc bán.",
      "VWAP: VWAP tính trên nến 5 phút của phiên. Nến 15 phút và nến 5 phút cùng ở trên VWAP thì xét mua, cùng ở dưới thì xét bán. Nến 5 phút chạm VWAP và đảo chiều, không đóng qua VWAP. Nếu đang bật né funding và đang trong cửa sổ funding thì kiểu này không tạo ứng viên. Tên: Hồi VWAP — long hoặc short.",
      "Hai hoặc ba kiểu cùng một chiều thì gộp thành một tín hiệu, cộng điểm.",
      "Cả ba kiểu vẫn bị bỏ nếu giá 5 phút chưa nằm trong vùng H1 hoặc H4 cùng chiều.",
    ],
  },
  {
    title: "Cửa chặn trước khi ĐƯỢC VÀO",
    items: [
      "Không chạm vùng H1/H4 cùng chiều: luôn từ chối. Tắt ô H4/H1 không bỏ cửa này.",
      "Ô Bắt buộc H4/H1 cùng hướng: thêm một dòng từ chối khi hướng khung lớn không đúng chiều lệnh, kể cả khi khung lớn đi ngang.",
      "Ô Chặn sóng kiệt sức: từ chối nếu sóng 15 phút bị đánh dấu kiệt sức.",
      "R:R thấp hơn số đang đặt: từ chối.",
      "Ô Né giờ funding: từ chối khi gần giờ funding. Cửa sổ mặc định 15 phút, chỉnh được trên trang Rule.",
      "Điểm vào tối thiểu mặc định 70. Auto paper vào khi hết dòng từ chối, không kiểm tra lại điểm này. Trang Test thì có: lệnh phải hết từ chối và điểm không thấp hơn số đang nhập.",
      "Checklist nhóm F luôn được tick. App không biết FOMO hay gỡ lỗ.",
    ],
  },
  {
    title: "Rule",
    items: [
      "Rule gốc: R:R 1.5, điểm 70, né funding 15 phút, bắt buộc cùng hướng H4/H1, chặn sóng kiệt, độ nhạy Chặt.",
      "Dễ test: R:R 1, điểm 45, tắt funding, tắt bắt buộc hướng, tắt chặn kiệt, độ nhạy Rộng.",
      "Chặt, Vừa, Rộng là hệ số 1, 1.6, 2.4 cho khoảng chạm EMA, VWAP, mép hộp và biên vùng.",
      "Auto paper trên Desk dùng đúng bộ đang lưu ở trang này.",
    ],
  },
  {
    title: "Cài đặt vốn và lệnh",
    items: [
      "Số tiền đánh mỗi lệnh × đòn bẩy = khối lượng USDT. Đòn bẩy từ 1 đến 125. Lệnh giấy và lệnh thật dùng cùng ba số.",
      "Ô lỗ SL để trống thì SL theo mép vùng ± 0,1% như trên. Có số thì cắt đúng số tiền đó.",
      "Reset tài khoản giấy đưa vốn về số equity trong máy, xóa vị thế, xóa nhật ký và xóa halt.",
      "API key và secret chỉ lưu trên trình duyệt. Máy chủ chỉ chuyển request đã ký. Testnet đổi host thử nghiệm.",
      "Gửi Binance chỉ chạy sau khi gõ LIVE và bấm Bật giao dịch thật. Lệnh gửi đi là MARKET, kèm STOP_MARKET và TAKE_PROFIT_MARKET. Tắt live thì nút Gửi Binance không đặt lệnh.",
      "Ba lệnh đóng lỗ trong ngày theo giờ Việt Nam thì halt 12 giờ. Nút Vào lệnh lại trên Desk xóa halt và xóa bộ đếm, không xóa sổ.",
    ],
  },
  {
    title: "Telegram",
    items: [
      "Dán token bot, gửi /start cho bot, rồi Gửi tin thử. Chat id trống thì app tự điền.",
      "Báo khi có tín hiệu đang bật thì tin TÍN HIỆU là chưa vào lệnh.",
      "Tin TỰ ĐỘNG hoặc CƯỠNG BỨC là lệnh đã được ghi vào sổ.",
    ],
  },
  {
    title: "Test",
    items: [
      "Chọn coin, tối đa 12, và số ngày 3, 7, 14 hoặc 30. Nến 5 phút và 15 phút đúng số ngày. H1 lấy thêm 15 ngày, H4 thêm 40 ngày để có vùng.",
      "Chạy bộ này chỉ test rule đang chỉnh trên trang Test.",
      "Tìm phương án tốt chạy 72 lần: Chặt, Vừa, Rộng × R:R 1, 1.5, 2 × bật hoặc tắt H4/H1, kiệt sức, funding. Điểm vào giữ số đang nhập.",
      "Xếp hạng theo kỳ vọng R. Dưới 3 lệnh thì xếp sau. Hòa kỳ vọng thì so tổng lời lỗ.",
      "Mỗi dòng ghi độ nhạy, R:R, và ba ô đang bật hay tắt. Hiệu suất tính profit factor, R thắng trung bình, R thua trung bình, sụt giảm, chuỗi thua, tách long/short, coin và setup.",
      "Tải kết quả ra file CSV. Gắn vào bot mới chép bộ thắng sang trang Rule.",
    ],
  },
];

function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl">Help</h1>
      <p className="mt-2 text-sm text-muted">Cách app đang chạy. Không có quy tắc nào ngoài code hiện tại.</p>
      <div className="mt-6 flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
            <h2 className="font-display text-2xl">{section.title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
