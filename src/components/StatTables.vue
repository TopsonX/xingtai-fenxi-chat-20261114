<script setup>
import { signedPct, pct, num } from '../lib/templates.js'

defineProps({
  stats: { type: Object, default: null },
  baseline: { type: Object, default: null },
  title: { type: String, default: '历史回测' },
})

function mfe(S, h, i) {
  const a = S && S['mfe' + h]
  return a ? signedPct(a[i]) : '—'
}
function mae(S, h, i) {
  const a = S && S['mae' + h]
  return a ? signedPct(a[i]) : '—'
}
function labRow(name, S, B) {
  if (!S || !S.n_mature40) return { name, empty: true }
  const lift = B && B.p_行情起点 ? (S.p_行情起点 / B.p_行情起点) : null
  return {
    name,
    n: S.n_mature40,
    start: pct(S.p_行情起点),
    lift: lift == null ? '—' : num(lift),
    trip: pct(S.p_几日游),
    none: pct(S.p_无行情),
    mid: pct(S.p_一般),
    empty: false,
  }
}
</script>

<template>
  <div v-if="stats && stats.n">
    <h3>{{ title }}（事件 {{ stats.n }}，40日成熟 {{ stats.n_mature40 || 0 }}）</h3>
    <table>
      <thead>
        <tr>
          <th>期限</th><th>样本</th><th>MFE 25/50/75分位</th><th>MAE 25/50/75分位</th>
          <th>收益中位</th><th>上涨占比</th><th>MFE≥10%</th><th>MFE≥20%</th><th>MAE≤-10%</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="h in [10, 20, 40]" :key="h" v-show="stats['mfe' + h]">
          <td>{{ h }}日</td>
          <td>{{ stats['n' + h] }}</td>
          <td>{{ mfe(stats, h, 0) }} / <b>{{ mfe(stats, h, 1) }}</b> / {{ mfe(stats, h, 2) }}</td>
          <td>{{ mae(stats, h, 0) }} / <b>{{ mae(stats, h, 1) }}</b> / {{ mae(stats, h, 2) }}</td>
          <td>{{ signedPct((stats['ret' + h] || [])[1]) }}</td>
          <td>{{ pct(stats['win' + h], 0) }}</td>
          <td>{{ pct(stats['p_mfe10_' + h], 0) }}</td>
          <td>{{ pct(stats['p_mfe20_' + h], 0) }}</td>
          <td>{{ pct(stats['p_mae10_' + h], 0) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p v-else class="note">{{ title }}：无事件。</p>
</template>
