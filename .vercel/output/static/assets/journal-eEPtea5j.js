import{j as e,m as t,o as n,p as r}from"./index-DJbpFTtW.js";import{i,t as a}from"./button-DDPSHwq7.js";import{i as o,r as s}from"./market-BrO7A0zG.js";var c=e();function l(){let e=n(e=>e.history),l=n(e=>e.positions),u=o(e=>e.tickers);function d(){let t=[...l,...e].map(e=>{let t=e.journal;return`Ngày: ${t.date}
Sản phẩm: ${t.product}
Hướng: ${t.side===`BUY`?`MUA`:`BÁN`}
Khung xương: ${t.skeletonTf}
Khung vào lệnh: ${t.entryTf}
Xu hướng khung lớn: ${t.htfTrend}
Vùng Bò Gấu: ${t.zone}
Tín hiệu nến / lực: ${t.candleForce}
Lý do vào: ${t.reason}
Điểm vào: ${t.entry}
SL: ${t.sl}
TP1: ${t.tp1}
TP2: ${t.tp2}
R:R: ${t.rr}
Risk %: ${t.riskPct}
Có đủ checklist bắt buộc không? ${t.checklistOk?`Có`:`Không`}
Kết quả: ${t.result??`đang chạy`}
Đúng rule hay sai rule: ${t.ruleOk===void 0?``:t.ruleOk?`Đúng rule`:`Sai rule`}
Bài học: ${t.lesson??``}
---`}).join(`

`);navigator.clipboard.writeText(t||`Chưa có lệnh.`)}return(0,c.jsxs)(`div`,{className:`mx-auto max-w-3xl`,children:[(0,c.jsxs)(`div`,{className:`mb-6 flex items-end justify-between gap-3`,children:[(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`h1`,{className:`font-display text-4xl`,children:`Nhật ký`}),(0,c.jsx)(`p`,{className:`mt-2 text-muted`,children:`Mỗi lệnh ghi plan trước khi bấm — review rule, không chỉ lãi lỗ.`})]}),(0,c.jsx)(a,{variant:`outline`,onClick:d,children:`Copy mẫu`})]}),!e.length&&!l.length?(0,c.jsx)(`div`,{className:`rounded-xl bg-surface p-6 text-sm text-muted shadow-[var(--shadow-border)]`,children:`Chưa có lệnh. Khi vào từ Desk, plan được ghi tự động theo mẫu Nukida.`}):(0,c.jsx)(`div`,{className:`flex flex-col gap-3`,children:[...l,...e].map(e=>{let n=s(u,e.symbol)?.price??e.entry,a=e.side===`BUY`?1:-1,o=e.status===`closed`?e.realizedPnl:(n-e.entry)*a*e.remainingQty+e.realizedPnl;return(0,c.jsxs)(`article`,{className:`rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]`,children:[(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-2`,children:[(0,c.jsxs)(`h2`,{className:`font-display text-xl`,children:[e.symbol,` · `,e.side===`BUY`?`MUA`:`BÁN`]}),(0,c.jsx)(`span`,{className:i(`font-mono tabular-nums`,o>=0?`text-bull`:`text-bear`),children:t(o)})]}),(0,c.jsx)(`p`,{className:`mt-1 text-sm text-muted`,children:e.setupName}),(0,c.jsxs)(`dl`,{className:`mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4`,children:[(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`dt`,{className:`text-xs text-faint`,children:`Vào`}),(0,c.jsx)(`dd`,{className:`font-mono`,children:r(e.entry)})]}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`dt`,{className:`text-xs text-faint`,children:`SL`}),(0,c.jsx)(`dd`,{className:`font-mono`,children:r(e.sl)})]}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`dt`,{className:`text-xs text-faint`,children:`TP1`}),(0,c.jsx)(`dd`,{className:`font-mono`,children:r(e.tp1)})]}),(0,c.jsxs)(`div`,{children:[(0,c.jsx)(`dt`,{className:`text-xs text-faint`,children:`R:R`}),(0,c.jsx)(`dd`,{className:`font-mono`,children:e.rr.toFixed(2)})]})]}),(0,c.jsx)(`p`,{className:`mt-3 text-xs text-muted`,children:e.journal.candleForce}),(0,c.jsxs)(`p`,{className:`mt-1 text-xs text-faint`,children:[`Checklist `,e.journal.checklistOk?`đủ`:`thiếu`,` · `,e.journal.result??e.status,` · `,e.mode]})]},e.id)})})]})}export{l as component};