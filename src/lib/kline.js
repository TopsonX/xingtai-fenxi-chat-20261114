// Canvas K-line renderer (Vue 3, no ECharts). Ported from the 2026-11-12 research viewer.
const UP = '#e5484d'
const DN = '#21a366'
const FIG = '#080f1c'
const AX = '#0b1424'
const TICK = '#9fb2cc'
const SPINE = '#26364e'
const MA = {ma7:'#f2f2f2',ma45:'#4aa3ff',ma120:'#ff9246',ma200:'#c38bff',ma180:'#f5c542'}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function niceTicks(min, max, count) {
  const span = max - min || 1
  const step0 = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const r = step0 / mag
  const step = r >= 7.5 ? 10 * mag : r >= 3.5 ? 5 * mag : r >= 1.5 ? 2 * mag : mag
  const start = Math.ceil(min / step) * step
  const out = []
  for (let v = start; v <= max + step * 0.01; v += step) out.push(v)
  return out
}

function arrow(ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  const ang = Math.atan2(y2 - y1, x2 - x1)
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - 7 * Math.cos(ang - 0.4), y2 - 7 * Math.sin(ang - 0.4))
  ctx.lineTo(x2 - 7 * Math.cos(ang + 0.4), y2 - 7 * Math.sin(ang + 0.4))
  ctx.closePath()
  ctx.fill()
}

function idxOf(bars, date) {
  return bars.findIndex(b => b.date === date)
}

function drawKline(canvas, stock, hover, view, mouseY) {
  if (!canvas || !stock) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = FIG
  ctx.fillRect(0, 0, W, H)
  ctx.font = '12px PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'

  const bars = stock.kline.slice(view.start,view.start+view.count)
  const n = bars.length
  const left = 56, right = 16, top = 34, bottom = 26, gap = 6
  const innerH = H - top - bottom - gap
  const ph = innerH * (3.2 / 4.2)
  const vh = innerH * (1 / 4.2)
  const px = left, py = top, pw = W - left - right
  const vx = left, vy = top + ph + gap, vw = pw

  ctx.fillStyle = AX
  ctx.fillRect(px, py, pw, ph)
  ctx.fillRect(vx, vy, vw, vh)

  let ymin = Infinity, ymax = -Infinity
  for (const b of bars) { if(b.l==null||b.h==null)continue;
    ymin = Math.min(ymin, b.l)
    ymax = Math.max(ymax, b.h)
    for (const k of Object.keys(MA)) {
      if (b[k] != null) {
        ymin = Math.min(ymin, b[k])
        ymax = Math.max(ymax, b[k])
      }
    }
  }
  const ypad = Math.max(ymax-ymin,ymax*.01)*.06
  ymin -= ypad
  ymax += ypad
  const yP = v => py + ph - (v - ymin) / (ymax - ymin) * ph

  let vmax = 0
  for (const b of bars) vmax = Math.max(vmax, b.v, b.vma20 || 0)
  vmax = Math.max(1,vmax*1.08)
  const yV = v => vy + vh - (v / vmax) * vh

  const slot = pw / n
  const xAt = i => px + (i + 0.5) * slot
  const xData = i => px + (i + 0.5) * slot

  ctx.save()
  ctx.beginPath()
  ctx.rect(px, py, pw, ph)
  ctx.clip()

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  for (const t of niceTicks(ymin, ymax, 5)) {
    const y = yP(t)
    ctx.beginPath()
    ctx.moveTo(px, y)
    ctx.lineTo(px + pw, y)
    ctx.stroke()
  }

  for (const g of stock.gaps) {
    const gi = idxOf(bars, g.date)
    if (gi < 0) continue
    let fi = n - 1
    if (g.fillDate) {
      const f = idxOf(bars, g.fillDate)
      if (f >= 0) fi = f
    }
    const x0 = px + gi * slot
    const x1 = px + (fi + 0.5) * slot
    ctx.globalAlpha = 0.35
    ctx.fillStyle = g.color
    ctx.fillRect(x0, yP(g.top), x1 - x0, yP(g.bottom) - yP(g.top))
    ctx.globalAlpha = 1
  }

  // Matched template segments (one box per matched template).
  for(const [bi,w] of (stock.segBoxes||[]).entries()){
    const first=bars[0].date,last=bars[n-1].date;
    if(w.end<first||w.start>last)continue;
    let si=bars.findIndex(b=>b.date>=w.start);if(si<0)si=0;let ei=bars.findIndex(b=>b.date>w.end);if(ei<0)ei=n;
    const x0=px+si*slot,x1=px+ei*slot,y0=yP(w.top),y1=yP(w.bottom);
    ctx.globalAlpha=.06;ctx.fillStyle=w.color;ctx.fillRect(x0,y0,x1-x0,y1-y0);ctx.globalAlpha=1;
    ctx.strokeStyle=w.color;ctx.lineWidth=1.6;ctx.setLineDash(bi===0?[]:[5,3]);ctx.strokeRect(x0,y0,x1-x0,y1-y0);ctx.setLineDash([]);
    ctx.fillStyle=w.color;ctx.font='11px PingFang SC, Microsoft YaHei, sans-serif';ctx.textAlign='left';ctx.textBaseline='bottom';
    ctx.fillText(w.label,Math.max(px+4,Math.min(x0+4,px+pw-150)),Math.max(py+44,y0-3-bi*0));
  }
  const barW = slot * 0.7
  for (let i = 0; i < n; i++) {
    const b = bars[i]
    if(b.l==null||b.h==null)continue
    const color = b.c >= b.o ? UP : DN
    const x = xAt(i)
    ctx.strokeStyle = color
    ctx.lineWidth = 0.9
    ctx.beginPath()
    ctx.moveTo(x, yP(b.l))
    ctx.lineTo(x, yP(b.h))
    ctx.stroke()
    const bodyH = Math.max(Math.abs(b.c - b.o), b.c * 0.0008)
    const bot = Math.min(b.o, b.c)
    const topP = bot + bodyH
    ctx.fillStyle = color
    ctx.fillRect(x - barW / 2, yP(topP), barW, Math.max(1, yP(bot) - yP(topP)))
  }

  ctx.lineWidth = 1.1
  ctx.lineJoin = 'round'
  for (const [k, col] of Object.entries(MA)) {
    ctx.strokeStyle = col
    ctx.lineWidth = k==='ma180' ? 1.7 : 1.1
    ctx.setLineDash(k==='ma180' ? [7,4] : [])
    ctx.beginPath()
    let started = false
    for (let i = 0; i < n; i++) {
      const v = bars[i][k]
      if (v == null) { started = false; continue }
      const x = xAt(i)
      if (!started) { ctx.moveTo(x, yP(v)); started = true }
      else ctx.lineTo(x, yP(v))
    }
    ctx.stroke()
  }
  ctx.setLineDash([])
  const mb=bars[n-1];if(mb.ma180!=null){ctx.fillStyle=MA.ma180;ctx.textAlign='right';ctx.font='11px sans-serif';ctx.fillText('MA180(黄虚) '+mb.ma180.toFixed(2),px+pw-6,yP(mb.ma180)-6)}
  ctx.restore()

  if (hover >= 0 && hover < n) {
    const hx = xAt(hover)
    ctx.strokeStyle = 'rgba(241,245,251,0.25)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(hx, py)
    ctx.lineTo(hx, vy + vh)
    ctx.stroke()
    if(mouseY>=py&&mouseY<=py+ph){ctx.moveTo(px,mouseY);ctx.lineTo(px+pw,mouseY);ctx.stroke()}
    ctx.setLineDash([])
  }

  for (const g of stock.gaps) {
    const gi = idxOf(bars, g.date)
    if (gi < 0) continue
    const xyX = xAt(gi)
    const xyY = yP(g.bottom)
    const shift = Math.max(8, n * 0.12)
    let tx = xAt(gi - shift)
    let ty = yP(g.bottom * 0.9)
    const line1 = g.date.slice(5) + ' 缺口 ' + g.bottom.toFixed(2) + '→' + g.top.toFixed(2)
    const line2 = g.label
    ctx.font = '11px PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'
    const tw = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width)
    const boxW = tw + 16
    const boxH = 36
    tx = Math.max(px + 6, Math.min(tx, px + pw - boxW - 6))
    ty = Math.max(py + 8, Math.min(ty, py + ph - boxH - 8))
    arrow(ctx, tx + boxW / 2, ty + boxH, xyX, xyY, '#ffb020')
    ctx.globalAlpha = 0.92
    ctx.fillStyle = '#1b2740'
    ctx.strokeStyle = '#ffb020'
    ctx.lineWidth = 1
    roundRect(ctx, tx, ty, boxW, boxH, 6)
    ctx.fill()
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.fillStyle = '#fff'
    ctx.textBaseline = 'top'
    ctx.fillText(line1, tx + 8, ty + 6)
    ctx.fillText(line2, tx + 8, ty + 20)
  }

  ctx.font = '11px PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'
  for (const w of (stock.washes || [])) {
    const hi = idxOf(bars, w.date)
    if (hi < 0) continue
    const x = xAt(hi), y = yP(w.high)
    ctx.fillStyle = '#ff6b6b'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x - 6, y - 10)
    ctx.lineTo(x + 6, y - 10)
    ctx.closePath()
    ctx.fill()
    const t1 = '洗盘起点高 ' + w.high.toFixed(2)
    const t2 = '回撤 ' + w.pct.toFixed(1) + '%'
    ctx.fillStyle = '#ffb3b3'
    ctx.textBaseline = 'bottom'
    ctx.fillText(t1, x + 8, y - 14)
    ctx.fillText(t2, x + 8, y - 1)
  }


  for(const [mi,m]of(stock.markers||[]).entries()){
    const i=idxOf(bars,m.date);if(i<0)continue;const x=xAt(i),y=yP(m.price);ctx.strokeStyle=m.color;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(x,py+35);ctx.lineTo(x,py+ph);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=m.color;ctx.font='11px sans-serif';ctx.textAlign='left';const tx=Math.max(px+8,Math.min(x+8,px+pw-160));ctx.fillText(m.text,tx,py+48+mi*16);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();
  }
  ctx.save()
  ctx.beginPath()
  ctx.rect(vx, vy, vw, vh)
  ctx.clip()
  for (let i = 0; i < n; i++) {
    const b = bars[i]
    if(b.l==null||b.h==null)continue
    const color = b.c >= b.o ? UP : DN
    const x = xAt(i)
    ctx.fillStyle = color
    const topY = yV(b.v)
    ctx.fillRect(x - barW / 2, topY, barW, vy + vh - topY)
  }
  ctx.strokeStyle = '#4aa3ff'
  ctx.lineWidth = 1
  ctx.beginPath()
  let started = false
  for (let i = 0; i < n; i++) {
    const v = bars[i].vma20
    if (v == null) { started = false; continue }
    const x = xAt(i)
    if (!started) { ctx.moveTo(x, yV(v)); started = true }
    else ctx.lineTo(x, yV(v))
  }
  ctx.stroke()
  ctx.restore()

  ctx.strokeStyle = SPINE
  ctx.lineWidth = 1
  ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1)
  ctx.strokeRect(vx + 0.5, vy + 0.5, vw - 1, vh - 1)

  ctx.fillStyle = TICK
  ctx.font = '11px PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (const t of niceTicks(ymin, ymax, 5)) {
    ctx.fillText(t.toFixed(2), px-8, yP(t))
  }
  for (const t of niceTicks(0, vmax, 3)) {
    if (t === 0) continue
    ctx.fillText(t >= 10000 ? (t / 10000).toFixed(0) + '万' : String(Math.round(t)), vx - 8, yV(t))
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = '10px PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'
  const step = Math.max(1, Math.floor(n / 10))
  for (let i = 0; i < n; i += step) {
    ctx.fillText(bars[i].date.slice(2), xAt(i), vy + vh + 6)
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.font = '13px PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'
  ctx.fillStyle = '#f1f5fb'
  ctx.fillText(stock.name+' '+stock.code+' ｜ '+bars[0].date+' — '+bars[n-1].date,px,py-12)

  const legend=Object.entries(MA).map(([k,v])=>[k==='ma180'?'MA180虚':k.toUpperCase(),v])
  let lx = px + 10, ly = py + 12
  ctx.font = '11px PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif'
  const perRow=W<550?3:5;const lw=Math.min(345,pw-8)
  ctx.globalAlpha = 0.7
  ctx.fillStyle = '#0b1424'
  roundRect(ctx, lx - 6, ly - 4, lw, perRow===3?42:22, 4)
  ctx.fill()
  ctx.globalAlpha = 1
  for (const [li,[name, col]] of legend.entries()) {
    lx=px+10+(li%perRow)*65;ly=py+12+Math.floor(li/perRow)*20;
    ctx.strokeStyle = col
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(lx, ly + 7)
    ctx.lineTo(lx + 16, ly + 7)
    ctx.stroke()
    ctx.fillStyle = '#d9e4f4'
    ctx.textBaseline = 'middle'
    ctx.fillText(name, lx + 20, ly + 7)
    lx += 65
  }
}

function hoverText(stock, i) {
  if (i < 0) return '把鼠标移到 K 线上，可以看当日开高低收。图的默认样子和报告一致。'
  const b = stock.kline[i]
  const prev = stock.kline[i - 1]
  const chg = prev ? (b.c / prev.c - 1) * 100 : null
  const cls = chg == null ? '' : (chg >= 0 ? 'up' : 'dn')
  const chgS = chg == null ? '—' : (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%'
  return (
    '<b>' + b.date + '</b>　开 ' + b.o.toFixed(2) +
    '　高 ' + b.h.toFixed(2) + '　低 ' + b.l.toFixed(2) +
    '　收 ' + b.c.toFixed(2) +
    '　<span class="' + cls + '">' + chgS + '</span>' +
    '　量 ' + b.v.toLocaleString('zh-CN') +
    '　MA7 ' + (b.ma7 ?? '—') +
    '　MA45 ' + (b.ma45 ?? '—') +
    '　MA120 ' + (b.ma120 ?? '—') +
    '　MA200 ' + (b.ma200 ?? '—') +
    '　MA180 ' + (b.ma180 ?? '—')
  )
}


export function unpack(s) {
  if (!s || s._ready) return s
  if (s.kline && s.kline.length && Array.isArray(s.kline[0])) {
    s.kline = s.kline.map(r => ({
      date: r[0], o: r[1], h: r[2], l: r[3], c: r[4], v: r[5],
      ma7: r[6], ma45: r[7], ma120: r[8], ma200: r[9], ma180: r[10], vma20: r[11]
    }))
  }
  s.gaps = s.gaps || []
  s.segBoxes = s.segBoxes || []
  s.markers = s.markers || []
  s._ready = true
  return s
}

export { drawKline, hoverText }
