#!/usr/bin/env node
/**
 * FAI Engineer — Engineering Drawing Benchmark Generator
 * Generates 7 AS9102-style engineering drawing PDFs for regression testing.
 *
 * Usage:  node scripts/generate-test-drawings.mjs
 * Output: test-data/
 */

import PDFDocument from 'pdfkit'
import { createWriteStream, mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'test-data')
mkdirSync(OUT, { recursive: true })

const mm  = v => v * 2.8346
const PW  = mm(420)   // A3 landscape width
const PH  = mm(297)   // A3 landscape height
const BK  = '#000000'
const GR  = '#aaaaaa'

// ─── Drawing base class ───────────────────────────────────────────────────────

class ED {
  constructor(file, meta) {
    this.meta  = meta
    this.chars = []
    this._n    = 1
    this.doc   = new PDFDocument({ size: [PW, PH], margin: 0, compress: false,
      info: { Title: meta.title, Subject: 'AS9102 Engineering Drawing', Author: 'FAI Benchmark' } })
    this._ws   = createWriteStream(join(OUT, file))
    this.doc.pipe(this._ws)
    this._done = new Promise(r => this._ws.on('finish', r))
  }

  // ── characteristic registry ──────────────────────────────────────────────
  ch(type, nominal, tol, units, datum, page, desc) {
    const n   = parseFloat(nominal)
    const t   = parseFloat((tol || '').replace(/[^0-9.]/g, ''))
    this.chars.push({
      characteristicNumber: this._n++,
      type, nominal: nominal || '', tolerance: tol || '',
      min:   !isNaN(n) && !isNaN(t) ? String((n - t).toFixed(3)) : '',
      max:   !isNaN(n) && !isNaN(t) ? String((n + t).toFixed(3)) : '',
      units: units || 'mm', datum: datum || null,
      pageNumber: page || 1, description: desc || '',
    })
    return this
  }

  // ── drawing border + zone markers ────────────────────────────────────────
  border() {
    const m1 = mm(5), m2 = mm(10)
    this.doc.rect(m1, m1, PW-2*m1, PH-2*m1).lineWidth(0.5).stroke(BK)
    this.doc.rect(m2, m2, PW-2*m2, PH-2*m2).lineWidth(1.0).stroke(BK)
    const nz = 8, zw = (PW-2*m2)/nz
    for (let i = 1; i <= nz; i++) {
      const x = m2 + (i-0.5)*zw
      this.doc.fontSize(5).fillColor(GR)
        .text(String(i), x-5, m1+1.5, { width:10, align:'center' })
        .text(String(i), x-5, PH-m1-7,{ width:10, align:'center' })
    }
    const nh = 6, zh = (PH-2*m2)/nh
    'ABCDEF'.split('').forEach((L, i) => {
      const y = m2 + (i+0.35)*zh
      this.doc.fontSize(5).fillColor(GR)
        .text(L, m1+1, y, { width:7, align:'center' })
        .text(L, PW-m1-8, y, { width:7, align:'center' })
    })
    return this
  }

  // ── standard title block ─────────────────────────────────────────────────
  titleBlock() {
    const { title, dwg, mat, finish, scale, rev } = this.meta
    const m = mm(10)
    const W = mm(170), H = mm(38), X = PW-m-W, Y = PH-m-H
    this.doc.rect(X, Y, W, H).lineWidth(0.7).stroke(BK)
    const c1=mm(70), c2=mm(50)
    this.doc.moveTo(X+c1, Y).lineTo(X+c1, Y+H).lineWidth(0.4).stroke(BK)
    this.doc.moveTo(X+c1+c2, Y).lineTo(X+c1+c2, Y+H).lineWidth(0.4).stroke(BK)
    const rh = H/4
    for (let i=1; i<4; i++) this.doc.moveTo(X, Y+rh*i).lineTo(X+W, Y+rh*i).lineWidth(0.3).stroke(BK)
    this.doc.fillColor(BK)
    this.doc.fontSize(7).font('Helvetica-Bold').text('EV.ENGINEER / FAI BENCHMARK', X+mm(2), Y+mm(1.5), { width:c1-mm(4) })
    this.doc.fontSize(9).font('Helvetica-Bold').text((title||'').toUpperCase(), X+c1+mm(2), Y+mm(2.5), { width:c2-mm(4), align:'center' })
    this.doc.fontSize(5.5).font('Helvetica').text('DWG NO:', X+c1+c2+mm(2), Y+mm(1.5))
    this.doc.fontSize(8).font('Helvetica-Bold').text(dwg||'', X+c1+c2+mm(2), Y+mm(5))
    this.doc.fontSize(5.5).font('Helvetica').text('MATERIAL:', X+mm(2), Y+rh+mm(1))
    this.doc.fontSize(6.5).font('Helvetica-Bold').text(mat||'SEE NOTES', X+mm(2), Y+rh+mm(4), { width:c1-mm(4) })
    this.doc.fontSize(5.5).font('Helvetica').text('DRAWN BY:', X+c1+mm(2), Y+rh+mm(1))
    this.doc.fontSize(6.5).text('FAI BENCHMARK', X+c1+mm(2), Y+rh+mm(4))
    this.doc.fontSize(5.5).font('Helvetica').text('REV:', X+c1+c2+mm(2), Y+rh+mm(1))
    this.doc.fontSize(10).font('Helvetica-Bold').text(rev||'A', X+c1+c2+mm(9), Y+rh+mm(3))
    this.doc.fontSize(5.5).font('Helvetica').text('FINISH:', X+mm(2), Y+rh*2+mm(1))
    this.doc.fontSize(6).font('Helvetica-Bold').text(finish||'DEBURR & BREAK SHARP EDGES', X+mm(2), Y+rh*2+mm(4), { width:c1-mm(4) })
    this.doc.fontSize(5.5).font('Helvetica').text('CHECKED:', X+c1+mm(2), Y+rh*2+mm(1))
    this.doc.fontSize(5.5).text('SCALE:', X+c1+c2+mm(2), Y+rh*2+mm(1))
    this.doc.fontSize(8).font('Helvetica-Bold').text(scale||'1:1', X+c1+c2+mm(2), Y+rh*2+mm(4))
    this.doc.fontSize(5.5).font('Helvetica').text('UNLESS NOTED: LIN ±0.10  ANG ±0.5°  SURF Ra3.2', X+mm(2), Y+rh*3+mm(2), { width:c1+c2-mm(4) })
    this.doc.fontSize(5.5).text('DATE: 2026-06-10', X+c1+c2+mm(2), Y+rh*3+mm(2))
    // Revision block
    const rX=X-mm(35)
    this.doc.rect(rX, Y, mm(35), H).lineWidth(0.7).stroke(BK)
    this.doc.moveTo(rX, Y+mm(7)).lineTo(rX+mm(35), Y+mm(7)).lineWidth(0.3).stroke(BK)
    const rc=mm(35)/3
    for (let i=1; i<3; i++) this.doc.moveTo(rX+rc*i, Y+mm(7)).lineTo(rX+rc*i, Y+H).lineWidth(0.3).stroke(BK)
    this.doc.fontSize(6).font('Helvetica-Bold').fillColor(BK).text('REV HISTORY', rX+mm(1), Y+mm(2), { width:mm(33), align:'center' })
    this.doc.fontSize(5).font('Helvetica').text('REV', rX+mm(0.5), Y+mm(8), { width:rc-mm(1), align:'center' })
      .text('DATE', rX+rc+mm(0.5), Y+mm(8), { width:rc-mm(1), align:'center' })
      .text('BY', rX+rc*2+mm(0.5), Y+mm(8), { width:rc-mm(1), align:'center' })
    this.doc.text(rev||'A', rX+mm(0.5), Y+mm(13), { width:rc-mm(1), align:'center' })
      .text('2026-06-10', rX+rc+mm(0.5), Y+mm(13), { width:rc-mm(1), align:'center' })
      .text('FAI', rX+rc*2+mm(0.5), Y+mm(13), { width:rc-mm(1), align:'center' })
    this.doc.fontSize(6).fillColor(GR).text('3RD ANGLE PROJECTION', rX-mm(5), Y+H-mm(8), { width:mm(40), align:'right' })
    return this
  }

  // ── primitives ───────────────────────────────────────────────────────────

  // Filled arrowhead: tip at (x,y), pointing in direction `angle`
  arr(x, y, angle, s=mm(2)) {
    const bx=x-Math.cos(angle)*s, by=y-Math.sin(angle)*s
    const w=s*0.32
    const w1x=bx+Math.cos(angle+Math.PI/2)*w, w1y=by+Math.sin(angle+Math.PI/2)*w
    const w2x=bx-Math.cos(angle+Math.PI/2)*w, w2y=by-Math.sin(angle+Math.PI/2)*w
    this.doc.moveTo(x,y).lineTo(w1x,w1y).lineTo(w2x,w2y).closePath().fill(BK)
    return this
  }

  // Linear dimension: feature at (x1,y1)-(x2,y2), offset perpendicular
  ldim(x1, y1, x2, y2, off, text, fs=7) {
    const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy)
    if (len<1) return this
    const ux=dx/len, uy=dy/len, px=-uy, py=ux
    const d1x=x1+px*off, d1y=y1+py*off, d2x=x2+px*off, d2y=y2+py*off
    const sg=off>=0?1:-1, gap=mm(1.5), ov=mm(2.5)
    this.doc.moveTo(x1+px*sg*gap, y1+py*sg*gap).lineTo(d1x+px*sg*ov, d1y+py*sg*ov).lineWidth(0.35).stroke(BK)
    this.doc.moveTo(x2+px*sg*gap, y2+py*sg*gap).lineTo(d2x+px*sg*ov, d2y+py*sg*ov).lineWidth(0.35).stroke(BK)
    this.doc.moveTo(d1x,d1y).lineTo(d2x,d2y).lineWidth(0.35).stroke(BK)
    const a12=Math.atan2(d2y-d1y,d2x-d1x)
    this.arr(d1x,d1y,a12).arr(d2x,d2y,a12+Math.PI)
    const mx=(d1x+d2x)/2, my=(d1y+d2y)/2
    let ang=Math.atan2(d2y-d1y,d2x-d1x)*180/Math.PI
    if (ang>90||ang<-90) ang+=180
    this.doc.save().translate(mx,my).rotate(ang)
    this.doc.fontSize(fs).font('Helvetica').fillColor(BK).text(text,-mm(18),-mm(5),{width:mm(36),align:'center'})
    this.doc.restore()
    return this
  }

  // Diameter dim through circle center
  ddim(cx, cy, r, angle, text) {
    const ax=cx+Math.cos(angle)*r, ay=cy+Math.sin(angle)*r
    const bx=cx-Math.cos(angle)*r, by=cy-Math.sin(angle)*r
    const ext=mm(6)
    this.doc.moveTo(bx-Math.cos(angle)*ext, by-Math.sin(angle)*ext)
      .lineTo(ax+Math.cos(angle)*ext, ay+Math.sin(angle)*ext).lineWidth(0.35).stroke(BK)
    this.arr(ax,ay,Math.atan2(by-ay,bx-ax)).arr(bx,by,Math.atan2(ay-by,ax-bx))
    this.doc.fontSize(7).font('Helvetica').fillColor(BK)
      .text('⌀'+text, ax+Math.cos(angle)*(ext+mm(1)), ay+Math.sin(angle)*(ext+mm(1))-mm(3))
    return this
  }

  // Radius dimension leader
  rdim(cx, cy, r, angle, text) {
    const ex=cx+Math.cos(angle)*r, ey=cy+Math.sin(angle)*r
    const lx=ex+Math.cos(angle)*mm(8), ly=ey+Math.sin(angle)*mm(8)
    this.doc.moveTo(cx,cy).lineTo(lx,ly).lineWidth(0.35).stroke(BK)
    this.arr(ex,ey,Math.atan2(ey-cy,ex-cx))
    this.doc.fontSize(7).font('Helvetica').fillColor(BK).text('R'+text, lx+mm(1), ly-mm(3))
    return this
  }

  // Leader callout with dog-leg
  lead(fx, fy, text, angle=-Math.PI/4, jog=mm(12), fs=6.5) {
    const ex=fx+Math.cos(angle)*mm(14), ey=fy+Math.sin(angle)*mm(14)
    this.doc.moveTo(fx,fy).lineTo(ex,ey).lineTo(ex+jog,ey).lineWidth(0.35).stroke(BK)
    this.doc.circle(fx,fy,mm(0.7)).fill(BK)
    this.doc.fontSize(fs).font('Helvetica').fillColor(BK).text(text, ex+jog+mm(1), ey-mm(2.5), {width:mm(55)})
    return this
  }

  // GD&T feature control frame
  gdt(x, y, sym, tol, datums='') {
    const h=mm(5.5), sw=mm(7), tw=Math.max(mm(16),tol.length*mm(2.2))
    const ds=datums.split(' ').filter(Boolean), dw=mm(7)
    const total=sw+tw+ds.length*dw
    this.doc.rect(x,y,total,h).lineWidth(0.4).stroke(BK)
    this.doc.moveTo(x+sw,y).lineTo(x+sw,y+h).lineWidth(0.4).stroke(BK)
    this.doc.moveTo(x+sw+tw,y).lineTo(x+sw+tw,y+h).lineWidth(0.4).stroke(BK)
    ds.forEach((_,i)=>{ if(i>0) this.doc.moveTo(x+sw+tw+i*dw,y).lineTo(x+sw+tw+i*dw,y+h).lineWidth(0.4).stroke(BK) })
    this.doc.fontSize(8).font('Helvetica').fillColor(BK).text(sym, x+mm(0.5), y+mm(0.7), {width:sw-mm(1),align:'center'})
    this.doc.fontSize(6.5).font('Helvetica').fillColor(BK).text(tol, x+sw+mm(0.5), y+mm(1), {width:tw-mm(1)})
    ds.forEach((d,i)=>{ this.doc.fontSize(6.5).font('Helvetica-Bold').fillColor(BK).text(d, x+sw+tw+i*dw+mm(1), y+mm(1), {width:dw-mm(2),align:'center'}) })
    return this
  }

  // GD&T leader (line from feature point to GDT frame)
  gdtL(fx, fy, gdtX, gdtY, sym, tol, datums='') {
    const midY = (fy+gdtY)/2
    this.doc.moveTo(fx,fy).lineTo(fx,midY).lineTo(gdtX,midY).lineTo(gdtX,gdtY+mm(2.75)).lineWidth(0.35).stroke(BK)
    this.arr(fx,fy,Math.PI/2)
    return this.gdt(gdtX,gdtY,sym,tol,datums)
  }

  // Datum flag (filled triangle + circle with letter)
  datum(x, y, L) {
    const s=mm(3)
    this.doc.moveTo(x,y).lineTo(x-s*0.6,y+s).lineTo(x+s*0.6,y+s).closePath().fill(BK)
    this.doc.circle(x,y+s+mm(3),mm(3.2)).lineWidth(0.5).stroke(BK)
    this.doc.fontSize(7).font('Helvetica-Bold').fillColor(BK).text(L,x-mm(3.2),y+s+mm(0.8),{width:mm(6.4),align:'center'})
    return this
  }

  // Surface finish symbol
  sf(x, y, ra) {
    this.doc.moveTo(x,y+mm(4)).lineTo(x+mm(2.5),y).lineTo(x+mm(6),y+mm(5)).lineWidth(0.5).stroke(BK)
    this.doc.fontSize(5.5).font('Helvetica').fillColor(BK).text('Ra'+ra, x+mm(0.5), y-mm(3.5))
    return this
  }

  // Center mark
  cm(cx, cy, s=mm(5)) {
    const g=mm(1)
    this.doc.moveTo(cx-s,cy).lineTo(cx-g,cy).lineWidth(0.25).dash(3,{space:2}).stroke(BK)
    this.doc.moveTo(cx+g,cy).lineTo(cx+s,cy).lineWidth(0.25).dash(3,{space:2}).stroke(BK)
    this.doc.moveTo(cx,cy-s).lineTo(cx,cy-g).lineWidth(0.25).dash(3,{space:2}).stroke(BK)
    this.doc.moveTo(cx,cy+g).lineTo(cx,cy+s).lineWidth(0.25).dash(3,{space:2}).stroke(BK)
    this.doc.undash()
    return this
  }

  // Hidden line
  hl(x1,y1,x2,y2) {
    this.doc.moveTo(x1,y1).lineTo(x2,y2).lineWidth(0.4).dash(4,{space:2}).stroke(BK)
    this.doc.undash(); return this
  }

  // Center line (long dash - short dash)
  cl(x1,y1,x2,y2) {
    this.doc.moveTo(x1,y1).lineTo(x2,y2).lineWidth(0.25).dash(8,{space:2}).stroke(BK)
    this.doc.undash(); return this
  }

  // Balloon callout
  balloon(x, y, n, lx, ly) {
    const r=mm(5)
    this.doc.circle(x,y,r).lineWidth(0.5).stroke(BK)
    this.doc.fontSize(9).font('Helvetica-Bold').fillColor(BK).text(String(n),x-r,y-mm(4),{width:r*2,align:'center'})
    if (lx!==undefined) {
      const a=Math.atan2(ly-y,lx-x)
      this.doc.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r).lineTo(lx,ly).lineWidth(0.4).stroke(BK)
      this.arr(lx,ly,a)
    }
    return this
  }

  // View label
  vl(t,x,y) { this.doc.fontSize(7).font('Helvetica-Bold').fillColor(BK).text(t,x,y,{width:mm(60),align:'center'}); return this }

  // Notes block
  notes(lines, nx=mm(12), ny=PH-mm(52)) {
    this.doc.fontSize(7).font('Helvetica-Bold').fillColor(BK).text('NOTES:',nx,ny)
    lines.forEach((l,i)=>this.doc.fontSize(6.5).font('Helvetica').fillColor(BK).text(`${i+1}.  ${l}`,nx,ny+mm(6)+i*mm(4.5),{width:mm(130)}))
    return this
  }

  async end() {
    this.doc.end()
    await this._done
    const file = this._ws.path.split('/').pop()
    console.log(`  ✓ ${file}  (${this.chars.length} characteristics)`)
    return { file, title: this.meta.title, drawingNumber: this.meta.dwg, characteristics: this.chars }
  }
}

// ─── Drawing 1: Basic Machined Part ──────────────────────────────────────────
async function machinedPart() {
  const d = new ED('machined_part.pdf', { title:'Basic Machined Part', dwg:'FAI-BM-001',
    mat:'AL 6061-T6', finish:'ANODIZE CLEAR TYPE II', scale:'1:1', rev:'A' })
  d.border().titleBlock()

  const fx=mm(20), fy=mm(20), fw=mm(100), fh=mm(60)

  // Front view outline
  d.doc.rect(fx,fy,fw,fh).lineWidth(0.7).stroke(BK)

  // Boss 50×30
  const bx=fx+mm(25), by=fy+mm(15), bw=mm(50), bh=mm(30)
  d.doc.rect(bx,by,bw,bh).lineWidth(0.5).stroke(BK)

  // Central Ø16 through hole
  const cx=fx+fw/2, cy=fy+fh/2
  d.doc.circle(cx,cy,mm(8)).lineWidth(0.5).stroke(BK)
  d.cm(cx,cy,mm(12))

  // 4x corner holes (Ø5)
  const hs=[[fx+mm(12),fy+mm(12)],[fx+fw-mm(12),fy+mm(12)],[fx+mm(12),fy+fh-mm(12)],[fx+fw-mm(12),fy+fh-mm(12)]]
  hs.forEach(([hx,hy])=>{ d.doc.circle(hx,hy,mm(2.5)).lineWidth(0.5).stroke(BK); d.cm(hx,hy) })

  // Chamfer top-left
  const ch=mm(4)
  d.doc.moveTo(fx,fy+ch).lineTo(fx+ch,fy).lineWidth(0.7).stroke(BK)

  // Side view
  const sx=fx+fw+mm(25), sy=fy, sw=mm(30), sh=fh
  d.doc.rect(sx,sy,sw,sh).lineWidth(0.7).stroke(BK)
  d.hl(sx,by,sx+sw,by).hl(sx,by+bh,sx+sw,by+bh)
  d.hl(sx,cy-mm(8),sx+sw,cy-mm(8)).hl(sx,cy+mm(8),sx+sw,cy+mm(8))

  // Top view
  const tx=fx, ty=fy+fh+mm(20)
  d.doc.rect(tx,ty,fw,mm(30)).lineWidth(0.7).stroke(BK)
  d.hl(tx+mm(25),ty,tx+mm(25),ty+mm(30)).hl(tx+mm(75),ty,tx+mm(75),ty+mm(30))
  d.hl(cx-mm(8),ty,cx-mm(8),ty+mm(30)).hl(cx+mm(8),ty,cx+mm(8),ty+mm(30))
  d.cl(cx,ty-mm(3),cx,ty+mm(33))

  // Dimensions
  d.ldim(fx,fy,fx+fw,fy,-mm(12),'100.0'); d.ch('Linear','100.0','±0.10','mm',null,1,'Overall length')
  d.ldim(fx+fw,fy,fx+fw,fy+fh,mm(12),'60.0'); d.ch('Linear','60.0','±0.10','mm',null,1,'Overall width')
  d.ldim(sx,sy,sx+sw,sy,-mm(12),'30.0'); d.ch('Linear','30.0','±0.10','mm',null,1,'Part thickness')
  d.ldim(fx,fy,hs[0][0],fy,-mm(6),'12.0',6); d.ch('Linear','12.0','±0.05','mm',null,1,'Hole edge dist X')
  d.ldim(hs[0][0],fy,hs[1][0],fy,-mm(6),'76.0',6); d.ch('Linear','76.0','±0.10','mm',null,1,'Hole pitch X')
  d.ldim(fx+fw,hs[0][1],fx+fw,hs[2][1],mm(6),'36.0',6); d.ch('Linear','36.0','±0.10','mm',null,1,'Hole pitch Y')
  d.ddim(cx,cy,mm(8),-Math.PI/4,'⌀ 16.0 THRU'); d.ch('Diameter','16.0','±0.05','mm',null,1,'Central hole')
  d.lead(hs[1][0]+mm(2.5),hs[1][1],'4x M5x0.8-6H THRU',-Math.PI/4); d.ch('Thread','M5','6H','mm',null,1,'4x M5 holes')
  d.ldim(bx,by,bx+bw,by,-mm(6),'50.0',6); d.ch('Linear','50.0','±0.05','mm',null,1,'Boss length')
  d.ldim(fx+fw,by,fx+fw,by+bh,mm(18),'30.0',6); d.ch('Linear','30.0','±0.05','mm',null,1,'Boss width')
  d.doc.fontSize(6.5).font('Helvetica').fillColor(BK).text('2x C4.0',fx+ch+mm(1),fy+mm(1))
  d.ch('Linear','4.0','±0.20','mm',null,1,'2x chamfer 45°')
  d.sf(cx+mm(25),cy,'1.6'); d.ch('Surface Finish','1.6','Ra max','μm',null,1,'Machined surface Ra1.6')

  d.vl('FRONT VIEW',fx+mm(40),fy+fh+mm(4))
  d.vl('RIGHT SIDE VIEW',sx-mm(8),sy+sh+mm(4))
  d.vl('TOP VIEW',tx+mm(38),ty+mm(30)+mm(4))
  d.notes(['ALL DIMENSIONS IN mm UNLESS OTHERWISE SPECIFIED.',
    'GENERAL TOLERANCES ISO 2768-1 CLASS m.',
    'MATERIAL: AL 6061-T6 PER AMS 2770.',
    'FINISH: ANODIZE CLEAR TYPE II MIL-A-8625, MIN 0.005mm.',
    'DEBURR AND BREAK ALL SHARP EDGES R0.1–R0.3.',
    'INSPECT PER AS9102D FIRST ARTICLE INSPECTION.'])
  return d.end()
}

// ─── Drawing 2: GD&T Part ────────────────────────────────────────────────────
async function gdtPart() {
  const d = new ED('gdt_part.pdf', { title:'GD&T Precision Part', dwg:'FAI-BM-002',
    mat:'STEEL 4140 HT', finish:'BLACK OXIDE', scale:'1:1', rev:'A' })
  d.border().titleBlock()

  // Plate 120×80×20
  const px=mm(20), py=mm(25), pw=mm(120), ph=mm(80)
  d.doc.rect(px,py,pw,ph).lineWidth(0.7).stroke(BK)

  // Pocket 80×40×8 centred
  const pox=px+mm(20), poy=py+mm(20), pow=mm(80), poh=mm(40)
  d.doc.rect(pox,poy,pow,poh).lineWidth(0.5).stroke(BK)

  // 6x Ø8 holes on 100×60 pattern
  const hcx=px+pw/2, hcy=py+ph/2
  const holes6=[
    [hcx+mm(-50), hcy+mm(-30)], [hcx+mm(-50), hcy+mm(0)], [hcx+mm(-50), hcy+mm(30)],
    [hcx+mm(50),  hcy+mm(-30)], [hcx+mm(50),  hcy+mm(0)], [hcx+mm(50),  hcy+mm(30)],
  ]
  holes6.forEach(([hx,hy])=>{ d.doc.circle(hx,hy,mm(4)).lineWidth(0.5).stroke(BK); d.cm(hx,hy) })

  // Side view
  const sx=px+pw+mm(20), sy=py, sw=mm(20), sh=ph
  d.doc.rect(sx,sy,sw,sh).lineWidth(0.7).stroke(BK)
  d.hl(sx,poy,sx+sw,poy).hl(sx,poy+poh,sx+sw,poy+poh)
  d.hl(sx,poy+mm(32),sx+sw,poy+mm(32))  // pocket bottom

  // Datum targets
  d.datum(px+mm(10),py+ph,'A')
  d.datum(px+pw/2,py+ph,'B')
  d.datum(px+pw,py+ph/2,'C')

  // Dimensions
  d.ldim(px,py,px+pw,py,-mm(12),'120.0'); d.ch('Linear','120.0','±0.10','mm','A',1,'Overall length')
  d.ldim(px+pw,py,px+pw,py+ph,mm(12),'80.0'); d.ch('Linear','80.0','±0.10','mm','B',1,'Overall width')
  d.ldim(sx,sy,sx+sw,sy,-mm(12),'20.0'); d.ch('Linear','20.0','±0.05','mm','A',1,'Part thickness')
  d.ddim(holes6[0][0],holes6[0][1],mm(4),-Math.PI/4,'⌀ 8.0 THRU'); d.ch('Diameter','8.0','±0.03','mm',null,1,'6x holes diameter')

  // GD&T callouts
  d.gdt(px+mm(55),py-mm(16),'▯','□ 0.05','A'); d.ch('GD&T','0','0.05','mm','A',1,'Flatness of top face')
  d.doc.moveTo(px+pw/2,py).lineTo(px+pw/2,py-mm(10)).lineTo(px+mm(55),py-mm(10)).lineWidth(0.35).stroke(BK)

  d.gdt(sx+mm(25),sy+mm(20),'∥','∥ 0.05','A'); d.ch('GD&T','0','0.05','mm','A',1,'Parallelism bottom to A')
  d.doc.moveTo(sx,sy+sh).lineTo(sx+mm(22),sy+sh).lineTo(sx+mm(22),sy+mm(22.75)).lineWidth(0.35).stroke(BK)

  d.gdt(sx+mm(25),sy+mm(38),'⊥','⊥ 0.08','A B'); d.ch('GD&T','0','0.08','mm','A B',1,'Perpendicularity of side to A|B')
  d.doc.moveTo(sx+sw,sy+sh/2).lineTo(sx+mm(22),sy+sh/2).lineTo(sx+mm(22),sy+mm(40.75)).lineWidth(0.35).stroke(BK)

  d.gdt(px+mm(55),py+mm(92),'⊕','⊕ ⌀ 0.1','A B C')
  d.ch('GD&T','0','0.1','mm','A B C',1,'Position of 6x holes')
  d.doc.moveTo(holes6[3][0],holes6[3][1]).lineTo(holes6[3][0],py+mm(94.75)).lineWidth(0.35).stroke(BK)

  d.gdt(pox+pow+mm(5),poy,'⌒','0.15 mm','A'); d.ch('GD&T','0','0.15','mm','A',1,'Profile of pocket floor')

  d.ch('Linear','100.0','±0.10','mm',null,1,'Hole pattern length')
  d.ch('Linear','60.0','±0.10','mm',null,1,'Hole pattern width')
  d.sf(px+mm(60),py+ph/2,'0.8'); d.ch('Surface Finish','0.8','Ra max','μm',null,1,'Pocket floor finish')

  d.vl('FRONT VIEW',px+mm(55),py+ph+mm(3))
  d.vl('RIGHT SIDE VIEW',sx-mm(5),sy+sh+mm(3))
  d.notes(['ALL DATUM TARGETS ESTABLISHED BEFORE MEASUREMENT.',
    'GD&T PER ASME Y14.5-2018.',
    'MATERIAL: 4140 ALLOY STEEL, HT TO 28-32 HRC.',
    'INSPECT ALL GD&T FEATURES WITH CMM.'])
  return d.end()
}

// ─── Drawing 3: Threaded Part ─────────────────────────────────────────────────
async function threadedPart() {
  const d = new ED('threaded_part.pdf', { title:'Threaded Shaft', dwg:'FAI-BM-003',
    mat:'STEEL 316 SS', finish:'PASSIVATE PER AMS 2700', scale:'1:1', rev:'A' })
  d.border().titleBlock()

  // Shaft profile (front view as section): vertical axis
  // Overall shaft: Ø30 × 120mm long
  const sx=mm(80), sy=mm(20), sw=mm(120), shaftR=mm(15)
  // Draw as rect (shaft outline)
  d.doc.rect(sx,sy,sw,shaftR*2).lineWidth(0.7).stroke(BK)
  d.cl(sx-mm(5),sy+shaftR,sx+sw+mm(5),sy+shaftR)  // axis center line

  // Shoulder 1: Ø40 section (20mm long at left)
  d.doc.rect(sx,sy-mm(5),mm(20),shaftR*2+mm(10)).lineWidth(0.7).stroke(BK)

  // Thread 1: M30×2.0 (external, right-hand 40mm long from right end)
  const t1x=sx+sw-mm(40)
  // Thread root lines (simplified)
  d.doc.moveTo(t1x,sy).lineTo(sx+sw,sy).lineWidth(0.35).dash(3,{space:1}).stroke(BK)
  d.doc.moveTo(t1x,sy+shaftR*2).lineTo(sx+sw,sy+shaftR*2).lineWidth(0.35).dash(3,{space:1}).stroke(BK)
  d.doc.undash()
  d.doc.rect(t1x,sy+mm(1),mm(40),shaftR*2-mm(2)).lineWidth(0.3).stroke(BK)

  // Keyway (25mm long, 8mm wide, 4mm deep)
  const kwx=sx+mm(25), kwy=sy, kww=mm(25), kwh=mm(4)
  d.doc.rect(kwx,kwy,kww,kwh).lineWidth(0.5).stroke(BK)
  d.hl(kwx,kwy+kwh,kwx+kww,kwy+kwh)

  // M12 blind hole in shoulder
  const h1x=sx+mm(10), h1y=sy+shaftR, h1r=mm(6)
  d.doc.moveTo(h1x-h1r,sy-mm(5)).lineTo(h1x-h1r,sy-mm(5)+mm(15)).lineWidth(0.5).stroke(BK)
  d.doc.moveTo(h1x+h1r,sy-mm(5)).lineTo(h1x+h1r,sy-mm(5)+mm(15)).lineWidth(0.5).stroke(BK)
  d.doc.moveTo(h1x-h1r,sy-mm(5)+mm(15)).lineTo(h1x,sy-mm(5)+mm(20)).lineTo(h1x+h1r,sy-mm(5)+mm(15)).lineWidth(0.5).stroke(BK)
  d.cm(h1x,sy,mm(8))

  // Thread relief groove
  const grx=t1x-mm(4)
  d.doc.rect(grx,sy,mm(4),shaftR*2).lineWidth(0.5).stroke(BK)
  d.doc.moveTo(grx,sy+mm(2)).lineTo(grx+mm(4),sy+mm(2)).lineWidth(0.35).stroke(BK)
  d.doc.moveTo(grx,sy+shaftR*2-mm(2)).lineTo(grx+mm(4),sy+shaftR*2-mm(2)).lineWidth(0.35).stroke(BK)

  // Section lines (hatching) on section view
  for (let i=0; i<6; i++) {
    d.doc.moveTo(sx+mm(22)+i*mm(4),sy).lineTo(sx+mm(16)+i*mm(4),sy+shaftR*2).lineWidth(0.2).stroke(BK)
  }

  // Dimensions
  d.ldim(sx,sy,sx+sw,sy,-mm(12),'120.0'); d.ch('Linear','120.0','±0.20','mm',null,1,'Overall shaft length')
  d.ldim(sx,sy,sx+mm(20),sy,-mm(6),'20.0',6); d.ch('Linear','20.0','±0.10','mm',null,1,'Shoulder length')
  d.ldim(sx+sw-mm(40),sy,sx+sw,sy,-mm(6),'40.0',6); d.ch('Linear','40.0','±0.10','mm',null,1,'Thread length M30')
  d.ldim(sx+mm(20),sy,sx+sw-mm(44),sy,-mm(6),'56.0',6); d.ch('Linear','56.0','±0.10','mm',null,1,'Shaft mid-section length')
  d.ddim(sx-mm(5)+mm(10),sy+shaftR,mm(20),Math.PI/2,'40.0'); d.ch('Diameter','40.0','±0.05','mm',null,1,'Shoulder diameter')
  d.ddim(sx+mm(60),sy+shaftR,shaftR,Math.PI/2,'30.0'); d.ch('Diameter','30.0','±0.05','mm',null,1,'Main shaft diameter')

  // Thread callouts
  d.lead(sx+sw,sy,   'M30 x 2.0 - 6g EXTERNAL THREAD', Math.PI/4, mm(10)); d.ch('Thread','M30×2.0','6g','mm',null,1,'External thread M30×2.0')
  d.lead(h1x,sy-mm(5),'M12 x 1.75 - 6H BLIND ↧20mm MIN FULL THD',     -Math.PI/4, mm(10)); d.ch('Thread','M12×1.75','6H','mm',null,1,'M12 blind hole')

  // Keyway
  d.ldim(kwx,kwy,kwx+kww,kwy,-mm(6),'25.0',6); d.ch('Linear','25.0','±0.10','mm',null,1,'Keyway length')
  d.ldim(sx+mm(20)+mm(5),kwy,sx+mm(20)+mm(5),kwy+kwh,mm(4),'8.0',6); d.ch('Linear','8.0','±0.05','mm',null,1,'Keyway width')
  d.ch('Linear','4.0','±0.05','mm',null,1,'Keyway depth')
  d.doc.fontSize(6.5).font('Helvetica').fillColor(BK).text('KEY: 8×7×25 TO ISO 773',sx+kwx-sx+mm(2),kwy-mm(4))

  // Thread relief
  d.lead(grx,sy,'THREAD RELIEF: 4×3mm TO ISO 3508', -Math.PI/4, mm(10))
  d.ch('Linear','4.0','±0.20','mm',null,1,'Thread relief width')

  d.sf(sx+mm(70),sy+shaftR*2+mm(3),'0.8'); d.ch('Surface Finish','0.8','Ra max','μm',null,1,'Bearing journal Ra0.8')
  d.sf(sx+mm(40),sy-mm(5),'3.2'); d.ch('Surface Finish','3.2','Ra max','μm',null,1,'Thread crest Ra3.2')

  d.vl('SECTION A-A',sx+mm(55),sy+shaftR*2+mm(8))
  d.notes(['ALL THREADS RIGHT-HAND UNLESS NOTED.',
    'THREAD FORM TO ISO 68-1.',
    'PASSIVATE PER AMS 2700 METHOD 1 TYPE 2.',
    'HARDNESS: 18-22 HRC.',
    'MARK DRAWING NUMBER AND REVISION ON PART.'])
  return d.end()
}

// ─── Drawing 4: Aerospace Bracket ────────────────────────────────────────────
async function aerospaceBracket() {
  const d = new ED('aerospace_bracket.pdf', { title:'Aerospace Mounting Bracket', dwg:'FAI-BM-004',
    mat:'Ti-6Al-4V AMS 4928', finish:'ANODIZE TYPE I CLASS 1', scale:'1:1', rev:'A' })
  d.border().titleBlock()

  // L-bracket: horizontal flange 100×80mm + vertical flange 60×80mm + 5mm thick
  const ox=mm(20), oy=mm(20)
  // Horizontal flange (bottom, top view style)
  const hfw=mm(100), hfh=mm(80), hft=mm(5)
  // Vertical flange (left side)
  const vfw=mm(5), vfh=mm(60)

  // Front view: L-bracket outline
  d.doc.moveTo(ox,oy).lineTo(ox,oy+vfh).lineTo(ox+vfw,oy+vfh)
    .lineTo(ox+vfw,oy+hft).lineTo(ox+hfw,oy+hft)
    .lineTo(ox+hfw,oy).closePath().lineWidth(0.7).stroke(BK)

  // Gusset fillet R8
  d.doc.arc(ox+vfw,oy+hft,mm(8),0,-Math.PI/2,true).lineWidth(0.5).stroke(BK)
  d.rdim(ox+vfw,oy+hft,ox+vfw+mm(5),oy+hft-mm(5),mm(8),'8 FILLET')
  d.ch('Radius','8.0','±0.50','mm',null,1,'Gusset fillet radius')

  // Mounting holes on horizontal flange: 4x Ø8 csink on 80×60 pattern
  const hh=[[ox+mm(20),oy+mm(20)],[ox+mm(80),oy+mm(20)],[ox+mm(20),oy+mm(60)],[ox+mm(80),oy+mm(60)]]
  hh.forEach(([hx,hy])=>{ d.doc.circle(hx,hy,mm(4)).lineWidth(0.5).stroke(BK); d.cm(hx,hy) })
  // Countersink representation (outer circle)
  hh.forEach(([hx,hy])=>{ d.doc.circle(hx,hy,mm(6.5)).lineWidth(0.35).stroke(BK) })

  // Vertical flange holes: 2x Ø6 through
  const vh=[[ox+vfw/2,oy+mm(15)],[ox+vfw/2,oy+mm(45)]]
  vh.forEach(([hx,hy])=>{ d.doc.circle(hx,hy,mm(3)).lineWidth(0.5).stroke(BK); d.cm(hx,hy) })

  // Datum targets
  d.datum(ox+mm(10),oy+hft,'A')
  d.datum(ox+mm(60),oy+hft,'B')
  d.datum(ox+hfw,oy+hft/2,'C')

  // Side view
  const svx=ox+hfw+mm(20), svy=oy, svw=mm(5), svh=vfh
  d.doc.rect(svx,svy,svw,svh).lineWidth(0.7).stroke(BK)

  // Top view
  const tvx=ox, tvy=oy+vfh+mm(15)
  d.doc.rect(tvx,tvy,hfw,mm(5)).lineWidth(0.7).stroke(BK)
  d.hl(tvx+mm(20),tvy,tvx+mm(20),tvy+mm(5))
  d.hl(tvx+mm(80),tvy,tvx+mm(80),tvy+mm(5))
  hh.forEach(([hx,_])=>{ d.cl(hx,tvy-mm(3),hx,tvy+mm(8)) })

  // Dimensions
  d.ldim(ox,oy,ox+hfw,oy,-mm(12),'100.0'); d.ch('Linear','100.0','±0.05','mm','B',1,'Horizontal flange length')
  d.ldim(ox+hfw,oy,ox+hfw,oy+vfh,mm(12),'80.0'); d.ch('Linear','80.0','±0.05','mm','A',1,'Part height')
  d.ldim(svx,svy,svx+svw,svy,-mm(8),'5.0',6); d.ch('Linear','5.0','±0.05','mm',null,1,'Flange thickness')
  d.ldim(ox,oy,ox,oy+vfh,-mm(8),'60.0'); d.ch('Linear','60.0','±0.05','mm','A',1,'Vertical flange height')
  d.ldim(hh[0][0],oy,hh[1][0],oy,-mm(6),'60.0',6); d.ch('Linear','60.0','±0.03','mm','B',1,'Mount hole pitch X')
  d.ldim(ox+hfw,hh[0][1],ox+hfw,hh[2][1],mm(6),'40.0',6); d.ch('Linear','40.0','±0.03','mm','A',1,'Mount hole pitch Y')
  d.ddim(hh[0][0],hh[0][1],mm(4),-Math.PI/4,'⌀ 8.0'); d.ch('Diameter','8.0','±0.05','mm',null,1,'4x mount holes')
  d.lead(hh[0][0]+mm(6.5),hh[0][1],'4x ⌀ 8.0 THRU, ⌀ 13 ∠ 90° CSINK',-Math.PI/4)
  d.ch('Diameter','13.0','±0.10','mm',null,1,'Countersink diameter')
  d.ch('Angle','90','±1','deg',null,1,'Countersink angle')

  // GD&T
  d.gdt(ox+mm(30),oy+vfh+mm(35),'⊥','⊥ 0.05','A B')
  d.ch('GD&T','0','0.05','mm','A B',1,'Perpendicularity of vertical flange')
  d.gdt(ox+mm(30),oy+vfh+mm(44),'⊕','⊕ ⌀ 0.08','A B C')
  d.ch('GD&T','0','0.08','mm','A B C',1,'Position of 4x mount holes')
  d.gdt(svx+mm(10),svy+mm(25),'▯','▯ 0.02','A')
  d.ch('GD&T','0','0.02','mm','A',1,'Flatness of flange face')

  d.sf(ox+mm(50),oy+mm(2),'0.8'); d.ch('Surface Finish','0.8','Ra max','μm',null,1,'Mating face finish')
  d.sf(ox+mm(50),oy+hft+mm(2),'1.6'); d.ch('Surface Finish','1.6','Ra max','μm',null,1,'General surface')

  d.vl('FRONT VIEW',ox+mm(48),oy+vfh+mm(4))
  d.vl('RIGHT VIEW',svx-mm(2),svy+svh+mm(4))
  d.vl('TOP VIEW',tvx+mm(46),tvy+mm(5)+mm(4))
  d.notes(['MATERIAL: Ti-6Al-4V ELI PLATE PER AMS 4928.',
    'ANODIZE TYPE I CLASS 1 PER MIL-A-8625.',
    'ALL SURFACES TO BE FREE OF BURRS, CRACKS, AND TOOL MARKS.',
    'CRITICAL DIMENSIONS REQUIRE CMM VERIFICATION.',
    'TRACEABILITY: CERT OF CONFORMANCE REQUIRED.'])
  return d.end()
}

// ─── Drawing 5: Sheet Metal Part ─────────────────────────────────────────────
async function sheetMetal() {
  const d = new ED('sheet_metal_part.pdf', { title:'Sheet Metal Enclosure Panel', dwg:'FAI-BM-005',
    mat:'STEEL SPCC 2.0mm', finish:'ZINC PLATE + CLEAR CHROMATE', scale:'1:2', rev:'A' })
  d.border().titleBlock()

  const ox=mm(20), oy=mm(25)

  // Flat pattern: 200×120mm overall
  const fpw=mm(100), fph=mm(60)  // at 1:2 scale
  d.doc.rect(ox,oy,fpw,fph).lineWidth(0.7).stroke(BK)

  // Bend lines (dashed) at 20mm from left/right edges
  const bleft=ox+mm(10), bright=ox+fpw-mm(10)
  d.doc.moveTo(bleft,oy).lineTo(bleft,oy+fph).lineWidth(0.5).dash(6,{space:3}).stroke(BK); d.doc.undash()
  d.doc.moveTo(bright,oy).lineTo(bright,oy+fph).lineWidth(0.5).dash(6,{space:3}).stroke(BK); d.doc.undash()

  // Bend label
  d.doc.fontSize(6).font('Helvetica').fillColor(BK)
    .text('BEND UP 90°', bleft-mm(8), oy+fph+mm(3))
    .text('BEND UP 90°', bright-mm(8), oy+fph+mm(3))
    .text('R BEND 3.0mm', bleft-mm(8), oy+fph+mm(7))
    .text('R BEND 3.0mm', bright-mm(8), oy+fph+mm(7))

  // Hole pattern: 4x Ø8 slots
  const h1=[[ox+mm(14),oy+mm(15)],[ox+mm(14),oy+mm(45)],[ox+fpw-mm(14),oy+mm(15)],[ox+fpw-mm(14),oy+mm(45)]]
  h1.forEach(([hx,hy])=>{ d.doc.circle(hx,hy,mm(4)).lineWidth(0.5).stroke(BK); d.cm(hx,hy,mm(5)) })

  // 3x slots in centre panel
  const slotW=mm(25), slotH=mm(5)
  const slots=[[ox+fpw/2-slotW/2,oy+mm(10)],[ox+fpw/2-slotW/2,oy+mm(30)],[ox+fpw/2-slotW/2,oy+mm(50)]]
  slots.forEach(([sx,sy])=>d.doc.rect(sx,sy,slotW,slotH).lineWidth(0.5).stroke(BK))

  // Knockout Ø30
  const kox=ox+fpw/2, koy=oy+fph/2
  d.doc.circle(kox,koy,mm(15)).lineWidth(0.5).dash(4,{space:2}).stroke(BK); d.doc.undash()
  d.doc.fontSize(6.5).font('Helvetica').fillColor(BK).text('KO Ø30',kox-mm(6),koy-mm(2.5))

  // Thickness annotation
  d.lead(ox,oy+fph/2,'MATERIAL THICKNESS: 2.0 ±0.15mm', Math.PI,-mm(8))
  d.ch('Linear','2.0','±0.15','mm',null,1,'Sheet material thickness')

  // Dimensions (at 1:2 scale, drawing shows half actual; values are ACTUAL)
  d.ldim(ox,oy,ox+fpw,oy,-mm(12),'200.0 (FLAT PATTERN)')
  d.ch('Linear','200.0','±0.50','mm',null,1,'Overall flat pattern length')
  d.ldim(ox+fpw,oy,ox+fpw,oy+fph,mm(12),'120.0 (FLAT PATTERN)')
  d.ch('Linear','120.0','±0.50','mm',null,1,'Overall flat pattern width')
  d.ldim(ox,oy,bleft,oy,-mm(6),'20.0',6); d.ch('Linear','20.0','±0.20','mm',null,1,'Left bend flange width')
  d.ldim(bright,oy,ox+fpw,oy,-mm(6),'20.0',6); d.ch('Linear','20.0','±0.20','mm',null,1,'Right bend flange width')
  d.ldim(h1[0][0],oy,h1[1][0],oy,-mm(6),'0.0',6)  // placeholder for hole spacing
  d.ch('Linear','30.0','±0.20','mm',null,1,'Hole pitch Y on flange')
  d.ddim(h1[0][0],h1[0][1],mm(4),-Math.PI/4,'⌀ 8.0'); d.ch('Diameter','8.0','±0.15','mm',null,1,'4x flange holes')
  d.ldim(slots[0][0],oy,slots[0][0]+slotW,oy,-mm(6),'50.0',6); d.ch('Linear','50.0','±0.30','mm',null,1,'Slot length')
  d.ch('Linear','10.0','±0.20','mm',null,1,'Slot width')
  d.ddim(kox,koy,mm(15),Math.PI/4,'30.0'); d.ch('Diameter','30.0','±0.30','mm',null,1,'Knockout diameter')

  d.ch('Angle','90','±1','deg',null,1,'Bend angle')
  d.ch('Radius','3.0','±0.50','mm',null,1,'Inside bend radius')

  // Notes
  d.notes(['SCALE 1:2 — ALL DIMENSIONS ARE ACTUAL (NOT SCALED).',
    'MATERIAL: STEEL SPCC 2.0mm PER JIS G3141.',
    'K-FACTOR: 0.33 FOR BEND ALLOWANCE CALCULATION.',
    'MINIMUM DISTANCE HOLE-TO-BEND: 5.0mm.',
    'ZINC PLATE + CLEAR CHROMATE FINISH.',
    'DEBURR ALL PUNCHED EDGES R0.1 MAX.'])
  return d.end()
}

// ─── Drawing 6: Assembly Drawing ─────────────────────────────────────────────
async function assemblyDrawing() {
  const d = new ED('assembly.pdf', { title:'Valve Body Assembly', dwg:'FAI-BM-006',
    mat:'SEE BOM', finish:'SEE INDIVIDUAL PARTS', scale:'1:1', rev:'A' })
  d.border().titleBlock()

  const ox=mm(20), oy=mm(25)

  // Housing (body): rect 80×50
  d.doc.rect(ox,oy,mm(80),mm(50)).lineWidth(0.7).stroke(BK)
  d.doc.fontSize(6.5).font('Helvetica').fillColor(BK).text('ITEM 1: HOUSING',ox+mm(5),oy+mm(22))

  // Cover plate: rect 80×10 on top of housing
  d.doc.rect(ox,oy-mm(10),mm(80),mm(10)).lineWidth(0.5).stroke(BK)
  // Hatching on cover
  for (let i=0;i<8;i++) d.doc.moveTo(ox+i*mm(10),oy-mm(10)).lineTo(ox+i*mm(10)+mm(8),oy).lineWidth(0.2).stroke(BK)
  d.doc.fontSize(6.5).font('Helvetica').fillColor(BK).text('ITEM 2: COVER',ox+mm(15),oy-mm(8))

  // Fasteners: 4x circles (bolts through cover into housing)
  const bolts=[[ox+mm(10),oy],[ox+mm(70),oy],[ox+mm(10),oy-mm(10)],[ox+mm(70),oy-mm(10)]]
  bolts.forEach(([bx,by])=>{ d.doc.circle(bx,by,mm(2.5)).lineWidth(0.5).stroke(BK); d.cm(bx,by,mm(4)) })

  // O-ring groove on housing top face
  d.doc.rect(ox+mm(5),oy-mm(3),mm(70),mm(3)).lineWidth(0.35).stroke(BK)
  d.doc.fontSize(6).font('Helvetica').fillColor(BK).text('O-RING GROOVE',ox+mm(20),oy-mm(6))

  // Inlet/outlet ports
  d.doc.circle(ox+mm(15),oy+mm(25),mm(8)).lineWidth(0.5).stroke(BK)
  d.cm(ox+mm(15),oy+mm(25))
  d.doc.circle(ox+mm(65),oy+mm(25),mm(8)).lineWidth(0.5).stroke(BK)
  d.cm(ox+mm(65),oy+mm(25))

  // Balloons
  d.balloon(ox+mm(100),oy+mm(5),1,ox+mm(40),oy+mm(25))     // Housing
  d.balloon(ox+mm(100),oy+mm(20),2,ox+mm(40),oy-mm(5))     // Cover
  d.balloon(ox+mm(100),oy+mm(35),3,bolts[1][0],bolts[1][1]) // Fastener
  d.balloon(ox+mm(100),oy+mm(50),4,ox+mm(15),oy+mm(25))     // Port
  d.balloon(ox+mm(100),oy+mm(65),5,ox+mm(40),oy-mm(1.5))    // O-Ring

  // Assembly dimensions
  d.ldim(ox,oy-mm(10),ox+mm(80),oy-mm(10),-mm(12),'80.0'); d.ch('Linear','80.0','±0.20','mm',null,1,'Assembly width')
  d.ldim(ox+mm(80),oy-mm(10),ox+mm(80),oy+mm(50),mm(12),'60.0'); d.ch('Linear','60.0','±0.20','mm',null,1,'Assembly height')
  d.ddim(ox+mm(15),oy+mm(25),mm(8),-Math.PI/4,'⌀ 16.0'); d.ch('Diameter','16.0','±0.10','mm',null,1,'Port bore diameter')

  // BOM table
  const bomX=mm(10), bomY=PH-mm(90)
  d.doc.rect(bomX,bomY,mm(150),mm(35)).lineWidth(0.6).stroke(BK)
  d.doc.moveTo(bomX,bomY+mm(8)).lineTo(bomX+mm(150),bomY+mm(8)).lineWidth(0.4).stroke(BK)
  const bomCols=[mm(15),mm(55),mm(30),mm(30),mm(20)]
  let cx2=bomX
  bomCols.forEach(cw=>{ cx2+=cw; d.doc.moveTo(cx2,bomY).lineTo(cx2,bomY+mm(35)).lineWidth(0.4).stroke(BK) })
  d.doc.fontSize(6.5).font('Helvetica-Bold').fillColor(BK)
    .text('ITEM',bomX+mm(1),bomY+mm(2)).text('DESCRIPTION',bomX+mm(16),bomY+mm(2))
    .text('MATERIAL',bomX+mm(71),bomY+mm(2)).text('DRAWING',bomX+mm(101),bomY+mm(2))
    .text('QTY',bomX+mm(131),bomY+mm(2))
  const bom=[
    ['1','VALVE HOUSING','AL 6061-T6','FAI-BM-001','1'],
    ['2','COVER PLATE','AL 6061-T6','DWG-002','1'],
    ['3','M5 HEX BOLT','STEEL 316SS','COMMERCIAL','4'],
    ['4','PORT INSERT','BRASS C36000','DWG-004','2'],
    ['5','O-RING','VITON 70A','DWG-005','1'],
  ]
  bom.forEach((row,i)=>{
    const ry=bomY+mm(8)+i*mm(5)+mm(1.5)
    d.doc.fontSize(6).font('Helvetica').fillColor(BK)
    let cx3=bomX
    const widths=[mm(14),mm(54),mm(29),mm(29),mm(19)]
    row.forEach((cell,j)=>{
      d.doc.text(cell,cx3+mm(1),ry,{width:widths[j]-mm(2)})
      cx3+=bomCols[j]
    })
  })
  d.doc.fontSize(7).font('Helvetica-Bold').fillColor(BK).text('BILL OF MATERIALS',bomX+mm(55),bomY-mm(6))

  d.ch('Linear','3.0','±0.10','mm',null,1,'O-ring groove width')
  d.ch('Linear','2.4','±0.10','mm',null,1,'O-ring groove depth')

  d.vl('ASSEMBLY VIEW (TOP REMOVED)',ox+mm(35),oy+mm(50)+mm(4))
  d.notes(['ASSEMBLY TORQUE: M5 BOLTS 5.5 N·m ± 10%.',
    'LUBRICATE O-RING WITH CLEAN ASSEMBLY GREASE BEFORE INSTALLATION.',
    'PRESSURE TEST TO 10 BAR FOR 5 MIN — ZERO LEAKAGE PERMITTED.',
    'ALL ITEMS TO HAVE CERT OF CONFORMANCE BEFORE ASSEMBLY.'])
  return d.end()
}

// ─── Drawing 7: AS9102 Validation Drawing (25 characteristics) ───────────────
async function as9102Validation() {
  const d = new ED('as9102_validation.pdf', { title:'AS9102 FAI Validation Part', dwg:'FAI-BM-007',
    mat:'AL 7075-T7351', finish:'ANODIZE HARD TYPE III', scale:'1:1', rev:'A' })
  d.border().titleBlock()

  const ox=mm(18), oy=mm(18)
  const pw=mm(130), ph=mm(70)  // main body

  // Main body outline
  d.doc.rect(ox,oy,pw,ph).lineWidth(0.7).stroke(BK)

  // Step feature: right side raised by 15mm tall × 40mm wide
  const stx=ox+pw-mm(40), sty=oy-mm(15)
  d.doc.rect(stx,sty,mm(40),mm(15)).lineWidth(0.7).stroke(BK)

  // Datum A on bottom face
  d.datum(ox+mm(65),oy+ph,'A')
  // Datum B on left face
  d.datum(ox,oy+ph/2,'B')
  // Datum C on right face
  d.datum(ox+pw,oy+ph/2,'C')

  // 8x Ø6 holes on PCD 100×50
  const hbase=[[ox+mm(15),oy+mm(15)],[ox+mm(50),oy+mm(15)],[ox+mm(85),oy+mm(15)],[ox+mm(115),oy+mm(15)],
    [ox+mm(15),oy+mm(55)],[ox+mm(50),oy+mm(55)],[ox+mm(85),oy+mm(55)],[ox+mm(115),oy+mm(55)]]
  hbase.forEach(([hx,hy])=>{ d.doc.circle(hx,hy,mm(3)).lineWidth(0.5).stroke(BK); d.cm(hx,hy,mm(5)) })

  // Central bore Ø25
  const bcx=ox+mm(55), bcy=oy+ph/2
  d.doc.circle(bcx,bcy,mm(12.5)).lineWidth(0.6).stroke(BK); d.cm(bcx,bcy,mm(16))

  // Counterbore Ø40 × 10 deep
  d.doc.circle(bcx,bcy,mm(20)).lineWidth(0.35).stroke(BK)
  d.lead(bcx+mm(20),bcy,'⌀ 40.0 ┇ 10.0 DEEP / ⌀ 25.0 THRU',-Math.PI/6)
  d.ch('Diameter','40.0','±0.05','mm',null,1,'Counterbore diameter')
  d.ch('Linear','10.0','±0.05','mm',null,1,'Counterbore depth')
  d.ch('Diameter','25.0','±0.025','mm','A',1,'Central through bore')

  // 2x M8 threaded holes (counter side)
  const m8h=[[stx+mm(10),sty+mm(7.5)],[stx+mm(30),sty+mm(7.5)]]
  m8h.forEach(([hx,hy])=>{ d.doc.circle(hx,hy,mm(4)).lineWidth(0.5).stroke(BK); d.cm(hx,hy,mm(5)) })
  d.lead(m8h[1][0]+mm(4),m8h[1][1],'2x M8 x 1.25 - 6H ↧16mm',Math.PI/4)
  d.ch('Thread','M8×1.25','6H','mm',null,1,'2x M8 threaded holes')
  d.ch('Linear','16.0','±0.10','mm',null,1,'M8 thread minimum depth')

  // Radius on top corners of step
  const rr=mm(3)
  d.doc.arc(stx,sty,rr,Math.PI,Math.PI/2,true).lineWidth(0.5).stroke(BK)
  d.doc.arc(stx+mm(40),sty,rr,0,Math.PI/2).lineWidth(0.5).stroke(BK)
  d.ch('Radius','3.0','±0.30','mm',null,1,'Step corner radii 2x')

  // Side view
  const svx=ox+pw+mm(18), svy=oy, svw=mm(35), svh=ph
  d.doc.rect(svx,svy,svw,svh).lineWidth(0.7).stroke(BK)
  d.doc.rect(svx,svy-mm(15),svw,mm(15)).lineWidth(0.7).stroke(BK)  // step on side view
  d.hl(svx,bcy-mm(12.5),svx+svw,bcy-mm(12.5))
  d.hl(svx,bcy+mm(12.5),svx+svw,bcy+mm(12.5))

  // Dimensions
  d.ldim(ox,oy,ox+pw,oy,-mm(14),'130.0'); d.ch('Linear','130.0','±0.10','mm','B',1,'Overall length')
  d.ldim(ox+pw,oy,ox+pw,oy+ph,mm(14),'70.0'); d.ch('Linear','70.0','±0.10','mm','A',1,'Overall height')
  d.ldim(svx,svy,svx+svw,svy,-mm(12),'35.0'); d.ch('Linear','35.0','±0.05','mm','C',1,'Part depth')
  d.ldim(stx,oy,ox+pw,oy,-mm(7),'40.0',6); d.ch('Linear','40.0','±0.05','mm','C',1,'Step length')
  d.ldim(stx,sty,stx,oy,-mm(7),'15.0',6); d.ch('Linear','15.0','±0.05','mm','A',1,'Step height')
  d.ldim(hbase[0][0],oy,hbase[1][0],oy,-mm(6),'35.0',6); d.ch('Linear','35.0','±0.05','mm','B',1,'Hole pitch col 1-2')
  d.ldim(ox+pw,hbase[0][1],ox+pw,hbase[4][1],mm(6),'40.0',6); d.ch('Linear','40.0','±0.05','mm','A',1,'Hole pitch row 1-2')

  // GD&T
  d.gdt(ox+mm(40),oy+ph+mm(15),'▯','▯ 0.03','A'); d.ch('GD&T','0','0.03','mm','A',1,'Flatness of bottom face')
  d.doc.moveTo(ox+mm(65),oy+ph).lineTo(ox+mm(65),oy+ph+mm(14.75)).lineWidth(0.35).stroke(BK)

  d.gdt(svx+mm(40),svy+mm(15),'∥','∥ 0.04','A'); d.ch('GD&T','0','0.04','mm','A',1,'Parallelism top to A')
  d.doc.moveTo(svx+svw/2,svy).lineTo(svx+svw/2+mm(2),svy).lineTo(svx+mm(38),svy).lineTo(svx+mm(38),svy+mm(14.75)).lineWidth(0.35).stroke(BK)

  d.gdt(svx+mm(40),svy+mm(30),'⊥','⊥ 0.04','A B'); d.ch('GD&T','0','0.04','mm','A B',1,'Perpendicularity of left face')
  d.gdt(ox+mm(60),oy+ph+mm(25),'⊕','⊕ ⌀ 0.08','A B C'); d.ch('GD&T','0','0.08','mm','A B C',1,'Position of 8x holes')
  d.doc.moveTo(hbase[4][0],hbase[4][1]).lineTo(hbase[4][0],oy+ph+mm(24.75)).lineWidth(0.35).stroke(BK)

  d.gdt(svx+mm(40),svy+mm(45),'↺','↺ 0.05','A'); d.ch('GD&T','0','0.05','mm','A',1,'Circular runout of bore to A')

  d.ddim(hbase[0][0],hbase[0][1],mm(3),-Math.PI/4,'8x ⌀ 6.0 THRU'); d.ch('Diameter','6.0','±0.03','mm',null,1,'8x hole diameter')

  // Surface finishes
  d.sf(ox+mm(65),oy+ph-mm(5),'0.4'); d.ch('Surface Finish','0.4','Ra max','μm','A',1,'Bore surface Ra0.4')
  d.sf(ox+mm(90),oy-mm(3),'1.6'); d.ch('Surface Finish','1.6','Ra max','μm',null,1,'Top face Ra1.6')
  d.ch('Surface Finish','3.2','Ra max','μm',null,1,'General surfaces Ra3.2')

  // Angle dimension on chamfer
  const chmx=ox+pw, chmy=oy+ph
  d.doc.moveTo(chmx,chmy).lineTo(chmx-mm(10),chmy-mm(10)).lineWidth(0.7).stroke(BK)
  d.lead(chmx-mm(7),chmy-mm(7),'C5 x 45°',Math.PI/4)
  d.ch('Linear','5.0','±0.30','mm',null,1,'Chamfer length C5')
  d.ch('Angle','45','±1','deg',null,1,'Chamfer angle 45°')

  d.vl('FRONT VIEW',ox+mm(60),oy+ph+mm(38))
  d.vl('RIGHT SIDE VIEW',svx+mm(10),svy+svh+mm(4))

  // AS9102 notes block (characteristic summary)
  const nb=mm(12), nby=PH-mm(58)
  d.doc.rect(nb,nby,mm(180),mm(12)).lineWidth(0.5).stroke(BK)
  d.doc.fontSize(6.5).font('Helvetica-Bold').fillColor(BK).text('AS9102D NOTES:',nb+mm(2),nby+mm(1.5))
  d.doc.fontSize(6).font('Helvetica').fillColor(BK)
    .text('1. ALL CHARACTERISTICS REQUIRE FIRST ARTICLE INSPECTION PER AS9102D SECTION 4.',nb+mm(2),nby+mm(5.5),{width:mm(176)})
    .text('2. SUBMIT COMPLETED FORM 3 WITH FAI PACKAGE.',nb+mm(2),nby+mm(8.5),{width:mm(176)})

  d.notes(['MATERIAL: AL 7075-T7351 PER AMS 2770.',
    'HARD ANODIZE TYPE III PER MIL-A-8625, 0.025-0.038mm COATING.',
    'INSPECT ALL GD&T WITH CMM — REPORT ACTUAL VALUES ON FORM 3.',
    'CRITICAL CHARACTERISTICS MARKED WITH ★ REQUIRE 100% INSPECTION.',
    'FIRST ARTICLE APPROVAL REQUIRED BEFORE PRODUCTION RELEASE.'],nb,nby+mm(14))
  return d.end()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nFAI Engineer — Benchmark Drawing Generator')
  console.log('Output:', OUT, '\n')

  const results = await Promise.all([
    machinedPart(),
    gdtPart(),
    threadedPart(),
    aerospaceBracket(),
    sheetMetal(),
    assemblyDrawing(),
    as9102Validation(),
  ])

  // Aggregate expected characteristics JSON
  const json = {
    version: '1.0',
    generated: new Date().toISOString().slice(0, 10),
    description: 'FAI Engineer regression suite — expected characteristics per drawing',
    totalDrawings: results.length,
    totalCharacteristics: results.reduce((s,r)=>s+r.characteristics.length,0),
    drawings: Object.fromEntries(results.map(r => [
      r.drawingNumber, {
        file: r.file,
        title: r.title,
        drawingNumber: r.drawingNumber,
        characteristicCount: r.characteristics.length,
        characteristics: r.characteristics,
      }
    ])),
  }

  writeFileSync(join(OUT, 'expected_characteristics.json'), JSON.stringify(json, null, 2))
  console.log(`\n  ✓ expected_characteristics.json  (${json.totalCharacteristics} total characteristics across ${json.totalDrawings} drawings)`)
  console.log('\nDone.\n')
}

main().catch(e => { console.error(e); process.exit(1) })
