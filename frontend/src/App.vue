<template>
  <div class="app-root" :class="{readonly: store.readOnly}">
    <header class="top-bar">
      <h1>
        📊 分布式日志聚合与智能异常检测平台
        <span v-if="store.readOnly" class="ro-badge">只读模式</span>
      </h1>
      <div class="toolbar">
        <el-select v-model="store.account" size="small" style="width:110px">
          <el-option label="管理员" value="admin"/>
          <el-option label="只读访客" value="viewer"/>
        </el-select>
        <el-tooltip :disabled="!store.readOnly" content="只读模式下不可切换用例" placement="bottom">
          <span>
            <el-select v-model="store.logType" size="small" style="width:140px" :disabled="store.readOnly">
              <el-option v-for="t in ['nginx','apache','json_app','custom']" :key="t" :label="t" :value="t"/>
            </el-select>
          </span>
        </el-tooltip>
        <el-tooltip :disabled="!store.readOnly" content="只读模式下检索条件已锁定" placement="bottom">
          <span>
            <el-input v-model="store.searchQuery" placeholder="搜索关键词..." size="small" style="width:200px" clearable :disabled="store.readOnly"/>
          </span>
        </el-tooltip>
        <template v-if="!store.readOnly">
          <el-button size="small" @click="store.generate()" :loading="store.loading">🔍 生成日志</el-button>
          <el-button size="small" type="warning" @click="store.detect()" :disabled="!store.result">⚠ 检测异常</el-button>
        </template>
        <el-tooltip :disabled="!store.readOnly" content="只读模式下不可保存分析结果" placement="bottom">
          <span>
            <el-button size="small" type="primary" @click="store.save()" :loading="store.saving" :disabled="store.readOnly || !store.result">💾 保存结果</el-button>
          </span>
        </el-tooltip>
        <el-tooltip :disabled="store.account!=='viewer'" content="只读访客账号仅可查看受控视图" placement="bottom">
          <span>
            <el-button size="small" :type="store.readOnly?'success':'info'" :disabled="store.account==='viewer'" @click="toggleMode">
              {{ store.readOnly ? '🔓 退出只读' : '🔒 只读模式' }}
            </el-button>
          </span>
        </el-tooltip>
      </div>
    </header>
    <div class="main-grid">
      <div class="grid-col">
        <LogTable />
      </div>
      <div class="grid-col">
        <AnomalyChart />
        <AlertPanel />
      </div>
    </div>
    <div class="bottom-row">
      <TrendChart />
      <HeatmapChart />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, watch } from 'vue'
import LogTable from './components/LogTable.vue'
import AnomalyChart from './components/AnomalyChart.vue'
import AlertPanel from './components/AlertPanel.vue'
import TrendChart from './components/TrendChart.vue'
import HeatmapChart from './components/HeatmapChart.vue'
import { useLogStore } from './store/log'
const store = useLogStore()

let scrollBeforeReadonly = 0
function toggleMode() {
  if (store.readOnly) {
    // 退出只读：恢复原布局，并回到进入前的滚动位置
    store.setReadOnly(false)
    nextTick(() => window.scrollTo({ top: scrollBeforeReadonly }))
  } else {
    scrollBeforeReadonly = window.scrollY
    store.setReadOnly(true)
  }
}

// 页面标题与各面板口径随模式保持一致
watch(() => store.readOnly, ro => {
  document.title = ro ? '只读模式 · 日志异常检测' : '日志异常检测'
}, { immediate: true })
</script>

<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,monospace;background:#0f172a;color:#e2e8f0}
.app-root{min-height:100vh}
.top-bar{display:flex;justify-content:space-between;align-items:center;padding:10px 20px;background:#1e293b;border-bottom:1px solid #334155}
.top-bar h1{font-size:1.1rem;color:#38bdf8}
.toolbar{display:flex;gap:8px;align-items:center}
.main-grid{display:grid;grid-template-columns:1fr 400px;gap:12px;padding:12px 20px;min-height:50vh}
.grid-col{overflow:hidden}
.bottom-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 20px 16px}
/* 只读模式：按更大比例铺开日志表格与各图表面板 */
.app-root.readonly .main-grid{grid-template-columns:2fr 1fr;min-height:64vh}
.app-root.readonly .bottom-row{grid-template-columns:3fr 2fr}
.ro-badge{display:inline-block;font-size:10px;line-height:1;color:#fbbf24;border:1px solid #fbbf24;border-radius:3px;padding:2px 5px;margin-left:6px;vertical-align:middle}
</style>
