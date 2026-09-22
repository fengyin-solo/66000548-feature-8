import { defineStore } from 'pinia'
import { ref, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { AnalysisResult, AlertRule } from '@/types'

const MODE_KEY = 'lap.viewMode'
const SNAPSHOT_KEY = 'lap.snapshots'

export const useLogStore = defineStore('log', () => {
  const result = ref<AnalysisResult | null>(null)
  const loading = ref(false)
  const searchQuery = ref('')
  const logType = ref('nginx')
  // 只读模式：刷新后仍停留在进入前的模式
  const readOnly = ref(localStorage.getItem(MODE_KEY) === 'readonly')
  let savedScrollY = 0
  const rules = ref<AlertRule[]>([
    { id:1, name:'高频ERROR', type:'level', threshold:5, enabled:true },
    { id:2, name:'异常流量', type:'count', threshold:200, enabled:false },
    { id:3, name:'关键词命中', type:'keyword', threshold:0, enabled:true }
  ])

  // 变更类请求携带视图模式，后端据此拦截越权操作
  const viewHeaders = () => ({ 'X-View-Mode': readOnly.value ? 'readonly' : 'normal' })

  function enterReadOnly() {
    savedScrollY = window.scrollY
    readOnly.value = true
    localStorage.setItem(MODE_KEY, 'readonly')
  }

  function exitReadOnly() {
    readOnly.value = false
    localStorage.setItem(MODE_KEY, 'normal')
    // 布局还原后回到进入前的滚动位置
    nextTick(() => window.scrollTo(0, savedScrollY))
  }

  function toggleReadOnly() {
    readOnly.value ? exitReadOnly() : enterReadOnly()
  }

  // 只读模式下的统一拦截：入口不可用并说明原因
  function guardReadOnly(action: string) {
    if (!readOnly.value) return false
    ElMessage.warning(`只读模式：${action}不可用，当前为受控视图，已有结果不会被改动`)
    return true
  }

  async function generate() {
    if (guardReadOnly('生成日志')) return
    loading.value=true
    try { const {data} = await axios.post('/api/generate',{type:logType.value,count:1000},{headers:viewHeaders()}) ; result.value=data }
    catch (e:any) { ElMessage.error(e?.response?.data?.detail || '生成日志失败') }
    finally { loading.value=false }
  }

  async function detect() {
    if (guardReadOnly('检测异常')) return
    if (!result.value) return
    loading.value=true
    try { const {data} = await axios.post('/api/detect',{logs:result.value.logs,rules:rules.value.filter(r=>r.enabled),query:searchQuery.value},{headers:viewHeaders()}) ; result.value=data }
    catch (e:any) { ElMessage.error(e?.response?.data?.detail || '检测异常失败') }
    finally { loading.value=false }
  }

  function saveSnapshot() {
    if (guardReadOnly('保存结果')) return
    if (!result.value) { ElMessage.info('暂无可保存的分析结果'); return }
    const snapshots = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '[]')
    snapshots.push({
      savedAt: new Date().toISOString(),
      logType: logType.value,
      totalLogs: result.value.totalLogs,
      alertCount: result.value.alerts.length,
      result: result.value
    })
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots))
    ElMessage.success('已保存当前分析结果快照')
  }

  return { result, loading, searchQuery, logType, rules, readOnly, generate, detect, saveSnapshot, toggleReadOnly }
})
