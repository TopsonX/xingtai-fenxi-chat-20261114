<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { drawKline, hoverText, unpack } from '../lib/kline.js'

const props = defineProps({
  stock: { type: Object, default: null },
})

const cv = ref(null)
const hover = ref(-1)
const my = ref(-1)
const status = ref('')
const view = reactive({ start: 0, count: 200 })
let drag = null
let ro = null

function readyStock() {
  return props.stock ? unpack(props.stock) : null
}

function clamp(s, c) {
  const st = readyStock()
  if (!st) return
  const n = st.kline.length
  view.count = Math.max(Math.min(40, n), Math.min(n, Math.round(c)))
  view.start = Math.max(0, Math.min(n - view.count, Math.round(s)))
}

function draw() {
  const st = readyStock()
  if (st && cv.value) {
    drawKline(cv.value, st, hover.value, view, my.value)
    const sl = st.kline.slice(view.start, view.start + view.count)
    const i = hover.value >= 0 ? Math.min(sl.length - 1, hover.value) : sl.length - 1
    status.value = sl.length ? hoverText({ kline: sl }, i) : ''
  }
}

function reset() {
  const st = readyStock()
  if (!st) return
  clamp(st.defaultStart ?? Math.max(0, st.kline.length - (st.defaultCount || 220)), st.defaultCount || 220)
  hover.value = -1
  nextTick(draw)
}

function pos(e) {
  const r = cv.value.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width }
}
function down(e) {
  const p = pos(e)
  drag = { x: p.x, start: view.start }
  try { cv.value.setPointerCapture(e.pointerId) } catch (_) {}
}
function move(e) {
  const p = pos(e)
  my.value = p.y
  if (drag) {
    clamp(drag.start - (p.x - drag.x) / (p.w - 72) * view.count, view.count)
    hover.value = -1
  } else {
    hover.value = Math.max(0, Math.min(view.count - 1, Math.floor((p.x - 56) / (p.w - 72) * view.count)))
  }
  draw()
}
function up() { drag = null }
function leave() {
  if (!drag) { hover.value = -1; my.value = -1; draw() }
}
function zoom(f, a = 0.5) {
  const st = readyStock()
  if (!st) return
  const an = view.start + a * view.count
  const n = Math.max(40, Math.min(st.kline.length, Math.round(view.count * f)))
  clamp(an - a * n, n)
  hover.value = -1
  draw()
}
function wheel(e) {
  const p = pos(e)
  zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, Math.max(0, Math.min(1, (p.x - 56) / (p.w - 72))))
}
function pan(n) { clamp(view.start + n, view.count); draw() }

watch(() => props.stock && (props.stock.id || props.stock.code), () => nextTick(reset))

onMounted(() => {
  if (cv.value) {
    ro = new ResizeObserver(() => draw())
    ro.observe(cv.value)
  }
  if (props.stock) reset()
})
onBeforeUnmount(() => { if (ro) ro.disconnect() })

defineExpose({ reset, zoom, pan, draw })
</script>

<template>
  <div class="chartbox">
    <div class="ctl">
      <button type="button" @click="zoom(1/1.3)">放大</button>
      <button type="button" @click="zoom(1.3)">缩小</button>
      <button type="button" @click="pan(-20)">◀</button>
      <button type="button" @click="pan(20)">▶</button>
      <button type="button" @click="reset">复位</button>
      <span class="note">可拖动、滚轮缩放；白 MA7 / 蓝 MA45 / 橙 MA120 / 紫 MA200 / 黄虚线 MA180</span>
    </div>
    <canvas
      ref="cv"
      class="kline"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointerleave="leave"
      @wheel.prevent="wheel"
    />
    <div class="status" v-html="status"></div>
  </div>
</template>
