'use client'

import { useState, useEffect } from 'react'
import { Bot, Key, User, Power, Save, Eye, EyeOff, AlertCircle, CheckCircle, Webhook, Trash2, RefreshCw, CreditCard } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoInput } from '@/components/ui/neo-input'
import { NeoBadge } from '@/components/ui/neo-badge'
import { saveBotSettingsAction, toggleBotStatusAction } from '@/actions/settings.actions'
import { saveQrisSettings, getQrisSettings } from '@/actions/qris.actions'
import type { BotSettings, QrisSettings } from '@/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null)
  const [qrisSettings, setQrisSettings] = useState<QrisSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingQris, setSavingQris] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [showQrisToken, setShowQrisToken] = useState(false)
  const [showQrisApiKey, setShowQrisApiKey] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [webhookInfo, setWebhookInfo] = useState<{ url: string; pending_update_count: number } | null>(null)
  const [settingWebhook, setSettingWebhook] = useState(false)
  const [qrisFormData, setQrisFormData] = useState({
    username: '',
    apiKey: '',
    token: '',
  })

  useEffect(() => {
    fetchSettings()
    fetchWebhookInfo()
    fetchQrisSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchWebhookInfo() {
    try {
      const res = await fetch('/api/telegram/set-webhook')
      if (res.ok) {
        const data = await res.json()
        setWebhookInfo(data.webhookInfo)
      }
    } catch (error) {
      console.error('Error fetching webhook info:', error)
    }
  }

  async function fetchQrisSettings() {
    try {
      const qrisData = await getQrisSettings('admin')
      if (qrisData) {
        setQrisSettings(qrisData)
        setQrisFormData({
          username: qrisData.username || '',
          apiKey: '', // Don't show for security
          token: '', // Don't show for security
        })
      }
    } catch (error) {
      console.error('Error fetching QRIS settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSetWebhook() {
    setSettingWebhook(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        fetchWebhookInfo()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memasang webhook' })
    } finally {
      setSettingWebhook(false)
    }
  }

  async function handleDeleteWebhook() {
    setSettingWebhook(true)
    setMessage(null)
    
    try {
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'DELETE',
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setWebhookInfo(null)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus webhook' })
    } finally {
      setSettingWebhook(false)
    }
  }

  async function handleSubmitQrisSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingQris(true)
    setMessage(null)

    try {
      if (!qrisFormData.username || !qrisFormData.apiKey || !qrisFormData.token) {
        setMessage({ type: 'error', text: 'Semua field QRIS harus diisi' })
        setSavingQris(false)
        return
      }

      const result = await saveQrisSettings(
        'admin',
        qrisFormData.username,
        qrisFormData.apiKey,
        qrisFormData.token
      )

      if (result.success) {
        setMessage({ type: 'success', text: 'Pengaturan QRIS berhasil disimpan!' })
        setQrisFormData({ username: qrisFormData.username, apiKey: '', token: '' })
        fetchQrisSettings()
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal menyimpan QRIS settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan QRIS settings' })
    } finally {
      setSavingQris(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    setMessage(null)
    
    const result = await saveBotSettingsAction(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' })
      fetchSettings()
    }
    
    setSaving(false)
  }

  async function handleToggle() {
    setToggling(true)
    setMessage(null)
    
    const result = await toggleBotStatusAction()
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: `Bot ${result.isActive ? 'diaktifkan' : 'dinonaktifkan'}!` })
      fetchSettings()
    }
    
    setToggling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 bg-primary/20 rounded-xl animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-primary animate-ping" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Bot</h1>
        <p className="text-muted-foreground text-sm">Konfigurasi token dan Owner ID untuk menjalankan bot Anda</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-success/10 text-success border border-success/20' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="font-medium text-sm">{message.text}</span>
        </div>
      )}

      {/* Bot Status Card */}
      <div className={`p-5 rounded-xl border ${
        settings?.isActive 
          ? 'bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30' 
          : 'bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              settings?.isActive ? 'bg-accent/20 text-accent' : 'bg-warning/20 text-warning'
            }`}>
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">Status Bot</p>
              <div className="flex items-center gap-2 mt-1">
                <NeoBadge variant={settings?.isActive ? 'success' : 'warning'}>
                  {settings?.isActive ? 'Aktif' : 'Nonaktif'}
                </NeoBadge>
                {settings?.botName && (
                  <span className="text-sm text-muted-foreground">@{settings.botName}</span>
                )}
              </div>
            </div>
          </div>
          
          <NeoButton
            variant={settings?.isActive ? 'destructive' : 'success'}
            onClick={handleToggle}
            disabled={toggling || !settings}
            className="w-full sm:w-auto"
          >
            <Power className="w-4 h-4" />
            {toggling ? 'Memproses...' : settings?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </NeoButton>
        </div>
      </div>

      {/* Webhook Status Card */}
      <div className={`p-5 rounded-xl border ${
        webhookInfo?.url 
          ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30' 
          : 'bg-card border-border'
      }`}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                webhookInfo?.url ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <Webhook className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Webhook Telegram</p>
                <div className="flex items-center gap-2 mt-1">
                  <NeoBadge variant={webhookInfo?.url ? 'success' : 'destructive'}>
                    {webhookInfo?.url ? 'Terpasang' : 'Belum Dipasang'}
                  </NeoBadge>
                  {webhookInfo?.pending_update_count !== undefined && webhookInfo.pending_update_count > 0 && (
                    <span className="text-xs text-muted-foreground">({webhookInfo.pending_update_count} pending)</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <NeoButton
                variant="default"
                onClick={handleSetWebhook}
                disabled={settingWebhook || !settings?.botToken}
                className="flex-1 sm:flex-none"
              >
                {webhookInfo?.url ? <RefreshCw className="w-4 h-4" /> : <Webhook className="w-4 h-4" />}
                {settingWebhook ? 'Memproses...' : webhookInfo?.url ? 'Perbarui' : 'Pasang Webhook'}
              </NeoButton>
              {webhookInfo?.url && (
                <NeoButton
                  variant="destructive"
                  size="icon"
                  onClick={handleDeleteWebhook}
                  disabled={settingWebhook}
                >
                  <Trash2 className="w-4 h-4" />
                </NeoButton>
              )}
            </div>
          </div>
          
          {webhookInfo?.url && (
            <div className="bg-muted/50 p-3 rounded-lg text-xs font-mono break-all text-muted-foreground border border-border/50">
              {webhookInfo.url}
            </div>
          )}
          
          {!settings?.botToken && (
            <p className="text-sm text-muted-foreground">
              Simpan pengaturan bot terlebih dahulu sebelum memasang webhook.
            </p>
          )}
        </div>
      </div>

      {/* Bot Configuration */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="mb-5">
          <h3 className="font-semibold">Konfigurasi Bot</h3>
          <p className="text-sm text-muted-foreground">
            Masukkan token bot dari BotFather dan ID Telegram Anda
          </p>
        </div>
        
        <form action={handleSubmit}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="botToken" className="text-sm font-medium text-muted-foreground">
                Bot Token
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="botToken"
                  name="botToken"
                  type={showToken ? 'text' : 'password'}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                  className="pl-11 pr-12 font-mono text-sm"
                  defaultValue={settings?.botToken || ''}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Dapatkan token dari @BotFather di Telegram
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="ownerId" className="text-sm font-medium text-muted-foreground">
                Owner ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="ownerId"
                  name="ownerId"
                  type="text"
                  placeholder="123456789"
                  className="pl-11 font-mono"
                  defaultValue={settings?.ownerId || ''}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ID Telegram Anda. Dapatkan dari @userinfobot
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="botName" className="text-sm font-medium text-muted-foreground">
                Nama Bot (Opsional)
              </label>
              <div className="relative">
                <Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="botName"
                  name="botName"
                  type="text"
                  placeholder="mybot"
                  className="pl-11"
                  defaultValue={settings?.botName || ''}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Username bot tanpa @ (untuk referensi)
              </p>
            </div>

            <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                defaultChecked={settings?.isActive || false}
                className="w-5 h-5 rounded border-border accent-primary cursor-pointer"
              />
              <span className="font-medium text-sm">
                Aktifkan bot setelah menyimpan
              </span>
            </label>

            <NeoButton type="submit" disabled={saving} className="w-full sm:w-auto">
              <Save className="w-4 h-4" />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </NeoButton>
          </div>
        </form>
      </div>

      {/* Help Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
        <h3 className="font-semibold mb-3">Cara Mendapatkan Token Bot</h3>
        <ol className="list-decimal list-inside flex flex-col gap-2 text-sm text-muted-foreground">
          <li>Buka Telegram dan cari @BotFather</li>
          <li>Kirim perintah /newbot untuk membuat bot baru</li>
          <li>Ikuti instruksi dan beri nama bot Anda</li>
          <li>Salin token yang diberikan ke field di atas</li>
          <li>Untuk Owner ID, cari @userinfobot dan kirim pesan apapun</li>
        </ol>
      </div>

      {/* QRIS Configuration */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Pengaturan QRIS Orkut (Default)</h3>
              <p className="text-sm text-muted-foreground">
                Konfigurasi akun Orkut untuk pembayaran QRIS default
              </p>
            </div>
          </div>
        </div>

        {qrisSettings?.isActive && (
          <div className="mb-5 p-4 bg-green-50/50 border border-green-200/50 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-green-900">
                Konfigurasi QRIS Aktif
              </p>
              <p className="text-xs text-green-700">
                Username: <span className="font-mono">{qrisSettings.username}</span>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitQrisSettings}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="qrisUsername" className="text-sm font-medium text-muted-foreground">
                Username Orkut
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="qrisUsername"
                  type="text"
                  placeholder="username_orkut"
                  className="pl-11"
                  value={qrisFormData.username}
                  onChange={(e) => setQrisFormData({ ...qrisFormData, username: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Username akun Orkut Anda
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="qrisApiKey" className="text-sm font-medium text-muted-foreground">
                API Key Orkut
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="qrisApiKey"
                  type={showQrisApiKey ? 'text' : 'password'}
                  placeholder="Masukkan API Key"
                  className="pl-11 pr-12 font-mono text-sm"
                  value={qrisFormData.apiKey}
                  onChange={(e) => setQrisFormData({ ...qrisFormData, apiKey: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowQrisApiKey(!showQrisApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showQrisApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                API Key dari dashboard Orkut
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="qrisToken" className="text-sm font-medium text-muted-foreground">
                Token Orkut
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <NeoInput
                  id="qrisToken"
                  type={showQrisToken ? 'text' : 'password'}
                  placeholder="Masukkan Token"
                  className="pl-11 pr-12 font-mono text-sm"
                  value={qrisFormData.token}
                  onChange={(e) => setQrisFormData({ ...qrisFormData, token: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowQrisToken(!showQrisToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showQrisToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Token dari dashboard Orkut
              </p>
            </div>

            <NeoButton type="submit" disabled={savingQris} className="w-full sm:w-auto">
              <Save className="w-4 h-4" />
              {savingQris ? 'Menyimpan...' : 'Simpan Pengaturan QRIS'}
            </NeoButton>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50/50 border border-blue-200/50 rounded-lg">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">Cara Mendapatkan Kredensial Orkut:</h4>
          <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
            <li>Buka dashboard Orkut</li>
            <li>Cari halaman API Settings atau Integration</li>
            <li>Salin Username, API Key, dan Token</li>
            <li>Paste ke form di atas</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
