export const TNAMES = {
  1: '中国广核·多头回踩洗盘突破前',
  2: '甘咨询·堆量后缩量待再启',
  3: '澳洋健康·无量下杀V反首板',
  4: '纳芯微·MA7刚上穿全部均线',
  5: '奥佳华·MA7刚上穿MA45',
  6: '紫金龙净·温和上穿全部贴线',
  7: '美诺华·缩量粘合垫后首放量',
  8: '中科曙光/神剑·长底座均线交汇',
  9: '青木/昂利康·粘合后MA7上穿全部',
  10: '欧圣电气·回踩汇合放量板回前高',
  11: '宁波东力·板-姿势下来-再板',
  12: '斯菱·创业板板后横盘守结构',
  13: '钧达·深跌低位多日异动量',
  14: '善水·黄金坑修复',
  15: '瑞芯微·老鸭头前夕',
  16: '视源/华正·深洗后跳空三日不补',
  17: '金开新能·粘合后阴跌洗盘末',
  18: '康龙化成·破MA200挖坑放量V回',
  19: '先导智能·首波后缩量强调整待主升',
  20: '蓝思科技·回踩MA200短破阳包阴收回',
  21: '正裕/天洋/圣阳/九阳/电光·连板后缩量再放量',
  22: '力聚热能·贴平MA200底座首次放量',
  23: '福建水泥·深坑底部刚反转',
  24: '华安证券·抛物线后长均线筑底再放量',
}

export const SLUG = {
  1: 'T01_zhongguanghe', 2: 'T02_ganzixun', 3: 'T03_aoyang', 4: 'T04_naxinwei',
  5: 'T05_aojiahua', 6: 'T06_zijinlongjing', 7: 'T07_meinuohua', 8: 'T08_shuguang_shenjian',
  9: 'T09_qingmu_anglikang', 10: 'T10_oushengdianqi', 11: 'T11_ningbodongli', 12: 'T12_siling',
  13: 'T13_junda', 14: 'T14_shanshui', 15: 'T15_ruixinwei', 16: 'T16_shiyuan_huazheng',
  17: 'T17_jinkai', 18: 'T18_kanglong', 19: 'T19_xiandao', 20: 'T20_lansi',
  21: 'T21_lianban_family', 22: 'T22_liju', 23: 'T23_fujianshuini', 24: 'T24_huaanzhengquan',
}

export function tidOf(k) {
  return 'T' + String(k).padStart(2, '0')
}

export function pct(x, d = 1) {
  if (x == null || !Number.isFinite(x)) return '—'
  return (x * 100).toFixed(d) + '%'
}

export function signedPct(x, d = 1) {
  if (x == null || !Number.isFinite(x)) return '—'
  const s = (x * 100).toFixed(d)
  return (x >= 0 ? '+' : '') + s + '%'
}

export function num(x, d = 2) {
  if (x == null || !Number.isFinite(Number(x))) return '—'
  return Number(x).toFixed(d)
}

export function dataUrl(path) {
  const base = import.meta.env.BASE_URL || './'
  return base.replace(/\/?$/, '/') + 'data/' + path.replace(/^\//, '')
}

export async function loadJson(path) {
  const r = await fetch(dataUrl(path))
  if (!r.ok) throw new Error('无法读取 ' + path + '（' + r.status + '）')
  return r.json()
}
