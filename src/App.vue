<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { TNAMES } from './lib/templates.js'

const route = useRoute()
const patterns = Object.entries(TNAMES).map(([k, name]) => ({
  id: `T${String(k).padStart(2, '0')}`,
  k: Number(k),
  name,
}))

const currentTid = computed(() => route.params.tid || '')
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <router-link class="brand" to="/">形态排查 <span>2026-11-13</span></router-link>
      <nav>
        <router-link to="/" active-class="" exact-active-class="on">目录</router-link>
        <router-link to="/method" active-class="on">方法与回测</router-link>
        <router-link to="/top50" active-class="on">综合前50</router-link>
        <label class="jump">
          跳转
          <select :value="currentTid" @change="$router.push('/p/' + $event.target.value)">
            <option value="" disabled>选择形态</option>
            <option v-for="p in patterns" :key="p.id" :value="p.id">{{ p.id }} {{ p.name.split('·')[0] }}</option>
          </select>
        </label>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
    <footer class="disc">以上仅为形态与数据研究，不构成投资建议。</footer>
  </div>
</template>
