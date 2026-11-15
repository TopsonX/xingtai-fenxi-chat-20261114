<script setup>
import KlineChart from './KlineChart.vue'

defineProps({
  stock: { type: Object, default: null },
})
</script>

<template>
  <div v-if="stock" class="panel">
    <KlineChart :stock="stock" />
    <div class="w">
      <p class="kv">
        <b>{{ stock.name }} {{ stock.code }}</b>
        <span :class="'t-' + stock.tier">{{ stock.tier }}</span>
        <span class="tag" v-for="t in stock.tags" :key="t">{{ t }}</span>
      </p>
      <p v-if="stock.links && stock.links.length">
        来源模板：
        <router-link v-for="l in stock.links" :key="l.href" :to="l.href" style="margin-right:8px">{{ l.text }}</router-link>
      </p>
      <p v-for="kv in stock.w" :key="kv[0]"><b>{{ kv[0] }}</b>：{{ kv[1] }}</p>
      <p class="risk" v-if="stock.tier !== '样例'">
        <b>风险</b>：{{ stock.risk && stock.risk.length ? stock.risk.join('；') : '无硬性风险标签（不代表无风险）' }}。{{ stock.inv }}
      </p>
    </div>
  </div>
  <p v-else class="note">请从左侧名单选择一只股票。</p>
</template>
