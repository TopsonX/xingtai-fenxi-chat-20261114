<script setup>
import { ref, onMounted } from 'vue'
import { loadJson, pct, num } from '../lib/templates.js'

const meta = ref(null)
const err = ref('')

onMounted(async () => {
  try { meta.value = await loadJson('meta.json') }
  catch (e) { err.value = String(e.message || e) }
})
</script>

<template>
  <div v-if="err" class="err">{{ err }}</div>
  <div v-else-if="!meta" class="loading">正在读取排查结果…</div>
  <div v-else>
    <h1>24 种启动形态 · 全市场排查</h1>
    <div class="meta">
      日线截止 <b>{{ meta.asof }} 收盘</b>（Asia/Taipei，UTC+8）｜
      有效池 {{ meta.universe }} 只（前复权，扶摇接口）｜
      库内文件 {{ meta.library_files }}，其中已到截止日 {{ meta.target_count }}，未到该日 {{ meta.stale_count }}｜
      生成于 {{ meta.generated_at }}
    </div>

    <section class="card">
      <h2>先看结论</h2>
      <ul>
        <li>市场背景：有效池中仅 <b>{{ pct(meta.market && meta.market.pct_above_ma200, 0) }}</b> 收在 MA200 上方，近 5 日涨幅中位 {{ meta.market ? ((meta.market.median_ret5 * 100).toFixed(1)) : '—' }}%。</li>
        <li>通过相位过滤、且至少命中一个模板的股票 <b>{{ meta.pass_gate }}</b> 只。综合名单资格：更贴 {{ meta.composite && meta.composite['更贴'] || 0 }}、次贴 {{ meta.composite && meta.composite['次贴'] || 0 }}、观察 {{ meta.composite && meta.composite['观察'] || 0 }}。</li>
        <li>单靠形态规则，多数模板 40 日「行情起点」概率接近全市场随机抽样；排序以资金面为主，形态只是入口。详见各形态页与方法说明。</li>
        <li><router-link to="/top50">综合推荐前 {{ meta.top50_n }} 只</router-link>（不够 50 不会凑数）｜ <router-link to="/method">方法、规则与历史回测口径</router-link></li>
      </ul>
      <p class="note">{{ meta.refresh_text }}</p>
    </section>

    <section class="card">
      <h2>24 套形态目录</h2>
      <div class="grid24">
        <router-link class="pcard" v-for="p in meta.patterns" :key="p.id" :to="'/p/' + p.id">
          <h3>{{ p.id }} {{ p.name }}</h3>
          <p class="counts">
            <b class="t-更贴">更贴 {{ p.tiers['更贴'] || 0 }}</b>
            <b class="t-次贴">次贴 {{ p.tiers['次贴'] || 0 }}</b>
            <b class="t-观察">观察 {{ p.tiers['观察'] || 0 }}</b>
          </p>
          <p class="note">历史 40 日行情起点 {{ pct(p.p_start) }}（基准倍数 {{ num(p.lift) }}）；{{ p.verdict }}</p>
          <p>{{ p.one_liner }}</p>
        </router-link>
      </div>
    </section>
  </div>
</template>
