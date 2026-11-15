<script setup>
import { ref, onMounted } from 'vue'
import { loadJson, pct, num } from '../lib/templates.js'
import CandidateViewer from '../components/CandidateViewer.vue'

const data = ref(null)
const err = ref('')

onMounted(async () => {
  try { data.value = await loadJson('top50.json') }
  catch (e) { err.value = String(e.message || e) }
})
</script>

<template>
  <div v-if="err" class="err">{{ err }}</div>
  <div v-else-if="!data" class="loading">正在读取综合名单…</div>
  <div v-else>
    <p><router-link to="/">← 目录</router-link> ｜ <router-link to="/method">方法</router-link></p>
    <h1>综合推荐前 {{ data.n }}</h1>
    <div class="meta">数据截至 <b>{{ data.asof }} 收盘</b>（Asia/Taipei，UTC+8）｜ 生成于 {{ data.generated_at }}</div>

    <section class="card">
      <h2>结论先看</h2>
      <ul>
        <li v-for="(x, i) in data.headlines" :key="i">{{ x }}</li>
      </ul>
      <p class="note" v-if="data.note">{{ data.note }}</p>
    </section>

    <section class="card">
      <h2>市场背景与数据口径</h2>
      <p v-if="data.market">有效池 {{ data.market.n }} 只中仅 <b>{{ pct(data.market.pct_above_ma200, 0) }}</b> 在 MA200 上方，5 日涨幅中位 {{ (data.market.median_ret5 * 100).toFixed(1) }}%。</p>
      <table v-if="data.market">
        <thead><tr><th>日期</th><th>上涨</th><th>下跌</th><th>涨停</th><th>跌停</th><th>向上跳空</th></tr></thead>
        <tbody>
          <tr v-for="(v, d) in data.market.per_day" :key="d">
            <td>{{ d }}</td><td>{{ v.up }}</td><td>{{ v.dn }}</td><td>{{ v.lu }}</td><td>{{ v.ld }}</td><td>{{ v.gap }}</td>
          </tr>
        </tbody>
      </table>
      <p class="note">{{ data.refresh_text }}</p>
    </section>

    <section class="card">
      <h2>24 套模板一览（本轮回测 / 当前分层 / 前{{ data.n }}中命中）</h2>
      <table>
        <thead>
          <tr><th>#</th><th>模板</th><th>样例校准</th><th>历史事件</th><th>40日行情起点</th><th>相对基准</th><th>几日游</th><th>当前 更贴/次贴/观察</th><th>名单中命中</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in data.patterns" :key="p.id">
            <td><router-link :to="'/p/' + p.id">{{ p.id }}</router-link></td>
            <td>{{ p.name }}</td>
            <td>{{ p.calib_text }}</td>
            <td>{{ p.n || '—' }}</td>
            <td>{{ pct(p.p_start) }}</td>
            <td>{{ num(p.lift) }}</td>
            <td>{{ pct(p.p_trip) }}</td>
            <td>{{ (p.tiers['更贴']||0) }}/{{ (p.tiers['次贴']||0) }}/{{ (p.tiers['观察']||0) }}</td>
            <td>{{ p.in_top }}</td>
          </tr>
        </tbody>
      </table>
      <p class="note" v-if="data.baseline">基准（全库每10日抽样）：行情起点 {{ pct(data.baseline.p_行情起点) }}、几日游 {{ pct(data.baseline.p_几日游) }}。</p>
    </section>

    <section class="card">
      <h2>名单</h2>
      <table>
        <thead>
          <tr><th>#</th><th>代码</th><th>名称</th><th>层级</th><th>综合分</th><th>来源模板</th><th>资金分</th><th>主力10日(亿)</th><th>机构龙虎榜60日(亿)</th><th>营收/净利同比</th><th>风格</th><th>风险</th></tr>
        </thead>
        <tbody>
          <tr v-for="x in data.rows" :key="x.code">
            <td>{{ x.rank }}</td>
            <td><a :href="'#' + x.code" @click.prevent="$router.replace({ hash: '#' + x.code })">{{ x.code }}</a></td>
            <td>{{ x.name }}</td>
            <td :class="'t-' + x.tier">{{ x.tier }}</td>
            <td>{{ x.score }}</td>
            <td>
              <router-link v-for="t in x.templates" :key="t.id" :to="'/p/' + t.id + '#' + x.code" style="margin-right:6px">{{ t.id }}</router-link>
            </td>
            <td>{{ x.cap }}</td>
            <td>{{ x.mf10 }}</td>
            <td>{{ x.org_net60 }}</td>
            <td>{{ x.fin }}</td>
            <td>{{ x.style }}</td>
            <td>{{ x.risk }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <CandidateViewer :entries="data.entries" title="前序名单 K 线与四要素（点选切换；来源模板可跳转）" />

    <section class="card">
      <h2>局限</h2>
      <ul class="note">
        <li v-for="(x, i) in data.limits" :key="i">{{ x }}</li>
      </ul>
    </section>
  </div>
</template>
