<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import StockPanel from './StockPanel.vue'

const props = defineProps({
  entries: { type: Array, default: () => [] },
  title: { type: String, default: 'K 线与解读' },
})

const route = useRoute()
const tier = ref('全部')
const q = ref('')
const sel = ref(null)

const tiers = computed(() => ['全部', ...Array.from(new Set(props.entries.map(e => e.tier)))])
const filtered = computed(() => props.entries.filter(e =>
  (tier.value === '全部' || e.tier === tier.value) &&
  (!q.value || (e.name && e.name.includes(q.value)) || (e.code && e.code.includes(q.value)))
))
const stock = computed(() => props.entries.find(e => e.id === sel.value) || null)

function select(id) { sel.value = id }

function pickFromHash() {
  const h = decodeURIComponent((route.hash || '').replace(/^#/, ''))
  const e = props.entries.find(x => x.code === h || x.id === h)
  if (e) { tier.value = '全部'; sel.value = e.id }
}

function keys(e) {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
  if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
  e.preventDefault()
  const a = filtered.value
  const i = a.findIndex(s => s.id === sel.value)
  const j = Math.max(0, Math.min(a.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))
  if (a[j]) select(a[j].id)
}

watch(() => props.entries, (v) => {
  if (!v.length) { sel.value = null; return }
  const keep = v.find(e => e.id === sel.value)
  if (!keep) {
    const h = decodeURIComponent((route.hash || '').replace(/^#/, ''))
    const e = v.find(x => x.code === h || x.id === h) || v[0]
    sel.value = e.id
  }
}, { immediate: true })

watch(() => route.hash, pickFromHash)
watch(filtered, (v) => {
  if (v.length && !v.some(s => s.id === sel.value)) select(v[0].id)
})

onMounted(() => {
  window.addEventListener('keydown', keys)
  pickFromHash()
})
onBeforeUnmount(() => window.removeEventListener('keydown', keys))
</script>

<template>
  <section class="card" id="viewer">
    <h2>{{ title }}</h2>
    <div class="ctl">
      层级
      <select v-model="tier"><option v-for="t in tiers" :key="t">{{ t }}</option></select>
      搜索 <input v-model="q" placeholder="代码/名称" size="10">
      <span class="note">键盘 ↑↓ 切换名单</span>
    </div>
    <div class="wrap">
      <div class="list">
        <table>
          <thead><tr><th>#</th><th>代码</th><th>名称</th><th>层级</th><th>说明</th></tr></thead>
          <tbody>
            <tr v-for="e in filtered" :key="e.id" :class="{ sel: e.id === sel }" @click="select(e.id)">
              <td>{{ e.rank }}</td>
              <td>{{ e.code }}</td>
              <td>{{ e.name }}</td>
              <td :class="'t-' + e.tier">{{ e.tier }}</td>
              <td>{{ e.sub }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <StockPanel :stock="stock" />
    </div>
  </section>
</template>
