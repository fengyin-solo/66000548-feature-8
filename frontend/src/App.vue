<template>
  <div class="app-root" :class="{ readonly: store.readOnly }">
    <header class="top-bar">
      <div class="title-wrap">
        <h1>📊 分布式日志聚合与智能异常检测平台</h1>
        <el-tag v-if="store.readOnly" type="info" size="small" effect="dark">只读 · 受控视图</el-tag>
      </div>
      <div class="toolbar">
        <el-tooltip :disabled="!store.readOnly" content="只读模式：不可切换用例，当前为受控视图" placement="bottom">
          <span>
            <el-select v-model="store.logType" size="small" style="width:140px" :disabled="store.readOnly">
              <el-option v-for="t in ['nginx','apache','json_app','custom']" :key="t" :label="t" :value="t"/>
            </el-select>
          </span>
        </el-tooltip>
        <template v-if="!store.readOnly">
          <el-input v-model="store.searchQuery" placeholder="搜索关键词..." size="small" style="width:200px" clearable/>
          <el-button size="small" @click="store.generate()" :loading="store.loading">🔍 生成日志</el-button>
          <el-button size="small" type="warning" @click="store.detect()" :disabled="!store.result">⚠ 检测异常</el-button>
        </template>
        <el-tooltip :disabled="!store.readOnly" content="只读模式：保存入口不可用，已有结果不会被改动" placement="bottom">
          <span>
            <el-button size="small" type="success" :disabled="store.readOnly || !store.result" @click="store.saveSnapshot()">💾 保存结果</el-button>
          </span>
        </el-tooltip>
        <el-button size="small" :type="store.readOnly ? 'primary' : 'info'" @click="store.toggleReadOnly()">
          {{ store.readOnly ? '✏️ 退出只读' : '👁 只读模式' }}
        </el-button>
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
import { watch } from 'vue'
import LogTable from './components/LogTable.vue'
import AnomalyChart from './components/AnomalyChart.vue'
import AlertPanel from './components/AlertPanel.vue'
import TrendChart from './components/TrendChart.vue'
import HeatmapChart from './components/HeatmapChart.vue'
import { useLogStore } from './store/log'
const store = useLogStore()

// 切换模式后页面标题与受控视图口径保持一致（含刷新后恢复）
watch(() => store.readOnly, (ro) => {
  document.title = ro ? '日志异常检测 · 只读模式' : '日志异常检测'
}, { immediate: true })
</script>

<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,monospace;background:#0f172a;color:#e2e8f0}
.app-root{min-height:100vh}
.top-bar{display:flex;justify-content:space-between;align-items:center;padding:10px 20px;background:#1e293b;border-bottom:1px solid #334155}
.title-wrap{display:flex;align-items:center;gap:10px}
.top-bar h1{font-size:1.1rem;color:#38bdf8}
.toolbar{display:flex;gap:8px;align-items:center}
.main-grid{display:grid;grid-template-columns:1fr 400px;gap:12px;padding:12px 20px;min-height:50vh}
.grid-col{overflow:hidden}
.bottom-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 20px 16px}
/* 只读模式：隐去改动入口后，按更大比例铺开日志表格与各图表面板 */
.app-root.readonly .main-grid{grid-template-columns:3fr 2fr;min-height:68vh}
.app-root.readonly .bottom-row{padding-bottom:24px}
</style>
