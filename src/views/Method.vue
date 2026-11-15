<script setup>
import { ref, onMounted } from 'vue'
import { loadJson, pct, num } from '../lib/templates.js'
import StatTables from '../components/StatTables.vue'

const meta = ref(null)
const method = ref(null)
const err = ref('')

onMounted(async () => {
  try {
    meta.value = await loadJson('meta.json')
    method.value = await loadJson('method.json')
  } catch (e) { err.value = String(e.message || e) }
})
</script>

<template>
  <div v-if="err" class="err">{{ err }}</div>
  <div v-else-if="!method" class="loading">正在读取方法说明…</div>
  <div v-else>
    <h1>方法、排查与历史归纳</h1>
    <div class="meta">数据截至 <b>{{ method.asof }} 收盘</b>（Asia/Taipei，UTC+8）</div>

    <section class="card">
      <h2>1. 模板怎么定义</h2>
      <p>每套形态都来自用户指定的样例票，对齐的是「启动前夕 / 刚刚启动」那一段，而不是已经走出主升浪之后的延伸。规则在任意交易日 t 只使用 t 及以前的前复权日线，没有未来函数。</p>
      <p>均线固定为 MA7 / MA45 / MA120 / MA200；若图上出现黄线，按 MA180（虚线）理解。成交量库内单位为「手」（100 股）。</p>
      <p class="note">{{ method.alignment_note }}</p>
    </section>

    <section class="card">
      <h2>2. 怎么排查</h2>
      <ul>
        <li v-for="(x, i) in method.screen_steps" :key="i">{{ x }}</li>
      </ul>
    </section>

    <section class="card">
      <h2>3. 历史怎么度量</h2>
      <ul>
        <li v-for="(x, i) in method.history_steps" :key="i">{{ x }}</li>
      </ul>
      <p v-if="meta && meta.baseline">
        本轮全市场基准（每 10 个交易日抽样）：40 日成熟样本 {{ meta.baseline.n_mature40 }}，行情起点 <b>{{ pct(meta.baseline.p_行情起点) }}</b>，几日游 {{ pct(meta.baseline.p_几日游) }}，无行情 {{ pct(meta.baseline.p_无行情) }}。
      </p>
      <StatTables v-if="meta" :stats="meta.baseline" title="全市场基准" />
    </section>

    <section class="card">
      <h2>4. 各模板规则摘要</h2>
      <table>
        <thead><tr><th>#</th><th>模板</th><th>样例与对齐相位</th><th>机械化规则（摘要）</th><th>本轮校准</th></tr></thead>
        <tbody>
          <tr v-for="p in method.templates" :key="p.id">
            <td><router-link :to="'/p/' + p.id">{{ p.id }}</router-link></td>
            <td>{{ p.name }}</td>
            <td>
              <div>{{ p.user }}</div>
              <div class="note" v-for="s in p.samples" :key="s[0] + s[2]">{{ s[1] }} {{ s[0] }}，标定 {{ s[2] }}</div>
            </td>
            <td>{{ p.rule }}</td>
            <td>
              <span v-for="c in p.calib" :key="c[0]">{{ c[0] }}{{ c[2] ? '✅' : '❌' }}；</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>5. 局限</h2>
      <ul class="note">
        <li v-for="(x, i) in method.limits" :key="i">{{ x }}</li>
      </ul>
    </section>
  </div>
</template>
