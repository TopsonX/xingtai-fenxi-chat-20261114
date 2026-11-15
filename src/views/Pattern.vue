<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { loadJson, pct, num, signedPct } from '../lib/templates.js'
import CandidateViewer from '../components/CandidateViewer.vue'
import StatTables from '../components/StatTables.vue'

const route = useRoute()
const data = ref(null)
const err = ref('')
const loading = ref(true)

async function load() {
  loading.value = true
  err.value = ''
  data.value = null
  try {
    data.value = await loadJson('patterns/' + route.params.tid + '.json')
  } catch (e) {
    err.value = String(e.message || e)
  } finally {
    loading.value = false
  }
}
watch(() => route.params.tid, load, { immediate: true })

function lab(name, S, B) {
  if (!S || !S.n_mature40) return { name, empty: true }
  const lift = B && B.p_行情起点 ? S.p_行情起点 / B.p_行情起点 : null
  return { name, n: S.n_mature40, start: pct(S.p_行情起点), lift: lift == null ? '—' : num(lift), trip: pct(S.p_几日游), none: pct(S.p_无行情), mid: pct(S.p_一般) }
}
</script>

<template>
  <div v-if="loading" class="loading">正在读取 {{ route.params.tid }} …</div>
  <div v-else-if="err" class="err">{{ err }}</div>
  <div v-else-if="data">
    <p><router-link to="/">← 目录</router-link> ｜ <router-link to="/top50">综合前50</router-link> ｜ <router-link to="/method">方法</router-link></p>
    <h1>{{ data.id }} · {{ data.name }}</h1>
    <div class="meta">数据截至 <b>{{ data.asof }} 收盘</b>（Asia/Taipei，UTC+8）｜ 生成于 {{ data.generated_at }}</div>

    <section class="card">
      <h2>结论先看</h2>
      <ul>
        <li>当前候选（已过相位过滤）：<b class="t-更贴">更贴 {{ data.tiers['更贴'] || 0 }}</b> / <b class="t-次贴">次贴 {{ data.tiers['次贴'] || 0 }}</b> / 观察 {{ data.tiers['观察'] || 0 }}；近似未入选 {{ data.n_near }}。分层不凑数：资金面不达标的一律放观察。</li>
        <li>
          历史回测：全库 {{ data.stats && data.stats.n || '—' }} 个事件，40 日「行情起点」概率
          <b>{{ pct(data.stats && data.stats.p_行情起点) }}</b>
          （基准 {{ pct(data.baseline && data.baseline.p_行情起点) }}，倍数 {{ num(data.lift) }}），
          「几日游」{{ pct(data.stats && data.stats.p_几日游) }}。
          → {{ data.verdict }}
        </li>
        <li>{{ data.one_liner }}</li>
      </ul>
    </section>

    <section class="card">
      <h2>1. 模板说明：你的原始标准与样例</h2>
      <p><b>原话/意思</b>：{{ data.user }}</p>
      <p><b>机械化规则</b>：{{ data.rule }}</p>
      <p class="note">K 线颜色：MA7 白、MA45 蓝、MA120 橙、MA200 紫、<b>MA180 黄色虚线</b>；橙框=模板识别段；绿标记=样例标定日；红点=当前候选的失效价。</p>
    </section>

    <section class="card">
      <h2>2. 怎么排查的：规则能否在样例的对的阶段识别</h2>
      <table>
        <thead><tr><th>样例</th><th>标定日</th><th>为什么标这一天</th><th>结果（±5日内）</th></tr></thead>
        <tbody>
          <tr v-for="row in data.calib_rows" :key="row.code + row.date">
            <td>{{ row.name }} {{ row.code }}</td>
            <td>{{ row.date }}</td>
            <td>{{ row.note }}</td>
            <td>{{ row.result }}</td>
          </tr>
        </tbody>
      </table>
      <p><b>规则沿革</b>：{{ data.fix }}</p>
    </section>

    <CandidateViewer :entries="data.entries" title="3. 样例与当前候选 K 线（样例在最前；点选切换）" />

    <section class="card">
      <h2>4. 历史数据归纳（全库至 {{ data.asof }}，无未来函数）</h2>
      <p class="note">{{ data.history_note }}</p>
      <StatTables :stats="data.stats" title="全部事件" />
      <StatTables :stats="data.stats && data.stats.L3" title="其中「更像」(level 3)" />
      <StatTables :stats="data.baseline" title="全市场基准" />
      <h3>行情起点 vs 几日游（40日成熟事件）</h3>
      <table>
        <thead><tr><th>分组</th><th>40日成熟事件</th><th>行情起点</th><th>相对基准倍数</th><th>几日游</th><th>无行情</th><th>一般</th></tr></thead>
        <tbody>
          <tr v-for="r in data.lab_rows" :key="r.name">
            <template v-if="r.empty"><td>{{ r.name }}</td><td colspan="6">样本不足</td></template>
            <template v-else>
              <td>{{ r.name }}</td><td>{{ r.n }}</td><td><b>{{ r.start }}</b></td><td>{{ r.lift }}</td><td>{{ r.trip }}</td><td>{{ r.none }}</td><td>{{ r.mid }}</td>
            </template>
          </tr>
        </tbody>
      </table>
      <h3>最近已满 40 日的事件（按时间，不挑选）</h3>
      <table>
        <thead><tr><th>代码</th><th>名称</th><th>触发日</th><th>相似度</th><th>20日MFE</th><th>20日MAE</th><th>40日MFE</th><th>40日收益</th><th>结果</th></tr></thead>
        <tbody>
          <tr v-for="e in data.recent_events" :key="e.code + e.date">
            <td>{{ e.code }}</td><td>{{ e.name }}</td><td>{{ e.date }}</td><td>{{ e.level }}</td>
            <td>{{ e.mfe20 }}</td><td>{{ e.mae20 }}</td><td>{{ e.mfe40 }}</td><td>{{ e.ret40 }}</td><td>{{ e.label }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>5. 当前名单分档（资金面优先）</h2>
      <p class="note">{{ data.tier_note }}</p>
      <table>
        <thead>
          <tr>
            <th>#</th><th>代码</th><th>名称</th><th>层级</th><th>相似度</th><th>排序分</th><th>资金分</th>
            <th>主力10日(亿)</th><th>机构龙虎榜60日(亿)</th><th>风格</th><th>营收/净利同比</th><th>相位</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!data.candidates.length"><td colspan="12">今日无通过相位过滤的候选。</td></tr>
          <tr v-for="(x, j) in data.candidates" :key="x.code">
            <td>{{ j + 1 }}</td>
            <td><a :href="'#' + x.code" @click.prevent="$router.replace({ hash: '#' + x.code })">{{ x.code }}</a></td>
            <td>{{ x.name }}</td>
            <td :class="'t-' + x.tier">{{ x.tier }}</td>
            <td>{{ x.level_lab }}</td>
            <td>{{ x.score }}</td>
            <td>{{ x.cap }}</td>
            <td>{{ x.mf10 }}</td>
            <td>{{ x.org_net60 }}</td>
            <td>{{ x.style }}</td>
            <td>{{ x.fin }}</td>
            <td>{{ x.phase }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>6. 近似未入选（near-miss）</h2>
      <p class="note">包括：今天触发但被相位/流动性过滤剔除的（多为已经走出一段，不追）；以及近 15 个交易日内触发过、今天条件已不满足的。按资金分排序，最多 20 只。</p>
      <table>
        <thead><tr><th>代码</th><th>名称</th><th>原因</th><th>资金分</th><th>形态</th></tr></thead>
        <tbody>
          <tr v-if="!data.near.length"><td colspan="5">无</td></tr>
          <tr v-for="x in data.near" :key="x.code">
            <td>{{ x.code }}</td><td>{{ x.name }}</td><td>{{ x.why }}</td><td>{{ x.cap }}</td><td>{{ x.phase }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>7. 局限</h2>
      <ul class="note">
        <li v-for="(x, i) in data.limits" :key="i">{{ x }}</li>
      </ul>
    </section>
  </div>
</template>
