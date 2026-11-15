import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue'), meta: { title: '目录' } },
  { path: '/method', name: 'method', component: () => import('../views/Method.vue'), meta: { title: '方法与回测' } },
  { path: '/top50', name: 'top50', component: () => import('../views/Top50.vue'), meta: { title: '综合前50' } },
  { path: '/p/:tid', name: 'pattern', component: () => import('../views/Pattern.vue'), meta: { title: '形态' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 80 }
    return { top: 0 }
  },
})

router.afterEach((to) => {
  const base = '24 种启动形态排查 · 2026-11-13'
  document.title = to.meta.title ? `${to.meta.title} · ${base}` : base
})

export default router
