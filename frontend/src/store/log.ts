import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { AnalysisResult, AlertRule } from '@/types'

const MODE_KEY = 'log-platform-mode'
const ACCOUNT_KEY = 'log-platform-account'

export const useLogStore = defineStore('log', () => {
  const result = ref<AnalysisResult | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const searchQuery = ref('')
  const logType = ref('nginx')
  // 账号与模式：刷新后仍停在进入前的模式（localStorage 持久化）
  const account = ref(localStorage.getItem(ACCOUNT_KEY) || 'admin')
  const readOnly = ref(localStorage.getItem(MODE_KEY) === 'readonly' || account.value === 'viewer')
  const rules = ref<AlertRule[]>([
    { id:1, name:'高频ERROR', type:'level', threshold:5, enabled:true },
    { id:2, name:'异常流量', type:'count', threshold:200, enabled:false },
    { id:3, name:'关键词命中', type:'keyword', threshold:0, enabled:true }
  ])

  // 所有请求携带账号与模式标识，后端据此拦截越权改动，已有结果不被篡改
  axios.interceptors.request.use(cfg => {
    cfg.headers['X-User-Role'] = account.value
    cfg.headers['X-Read-Only'] = readOnly.value ? 'true' : 'false'
    return cfg
  })

  // 只读访客账号强制受控视图；切回管理员后保持当前模式，可手动退出
  watch(account, acc => {
    localStorage.setItem(ACCOUNT_KEY, acc)
    if (acc === 'viewer') setReadOnly(true)
  })

  function setReadOnly(v: boolean) {
    readOnly.value = v
    localStorage.setItem(MODE_KEY, v ? 'readonly' : 'normal')
  }

  function blocked(): boolean {
    if (readOnly.value) {
      ElMessage.warning('只读模式：改动入口已关闭，现有分析结果保持不变')
      return true
    }
    return false
  }

  async function generate() {
    if (blocked()) return
    loading.value=true
    try { const {data} = await axios.post('/api/generate',{type:logType.value,count:1000}) ; result.value=data }
    finally { loading.value=false }
  }

  async function detect() {
    if (blocked() || !result.value) return
    loading.value=true
    try { const {data} = await axios.post('/api/detect',{logs:result.value.logs,rules:rules.value.filter(r=>r.enabled),query:searchQuery.value}) ; result.value=data }
    finally { loading.value=false }
  }

  async function save() {
    if (readOnly.value) { ElMessage.warning('只读模式下不可保存分析结果'); return }
    if (!result.value) return
    saving.value=true
    try {
      const {data} = await axios.post('/api/save',{result:result.value})
      ElMessage.success(`结果已保存（${data.savedBy} @ ${data.savedAt}）`)
    } catch (e:any) {
      ElMessage.error(e?.response?.data?.detail || '保存失败')
    } finally { saving.value=false }
  }

  return { result, loading, saving, searchQuery, logType, rules, account, readOnly, setReadOnly, generate, detect, save }
})
