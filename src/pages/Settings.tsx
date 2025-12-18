import { useState } from 'react'
import { Eye, EyeOff, Download, Upload, Trash2, User, Cloud, CloudOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useSettingsStore } from '@/stores/settingsStore'
import { useVocabStore } from '@/stores/vocabStore'
import { useAuthStore } from '@/stores/authStore'
import { useAuthContext } from '@/hooks/useAuth'
import { LANGUAGES } from '@/types'
import type { ExportData } from '@/types'

const APP_VERSION = '0.1.0'

export function Settings() {
  const { settings, updateSettings } = useSettingsStore()
  const { lists, importLists, clearAll } = useVocabStore()
  const { user, signOut, isLoading: authLoading } = useAuthStore()
  const { isFirebaseEnabled, showAuthModal } = useAuthContext()

  const [showApiKey, setShowApiKey] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const handleExport = () => {
    const exportData: ExportData = {
      version: APP_VERSION,
      exportedAt: Date.now(),
      settings: {
        ...settings,
        apiKey: '', // Don't export API key for security
      },
      lists,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flashcards-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData

        // Basic validation
        if (!data.version || !data.lists || !Array.isArray(data.lists)) {
          throw new Error('Invalid file format')
        }

        // Import lists
        importLists(data.lists)

        // Import settings (except API key)
        if (data.settings) {
          updateSettings({
            sourceLang: data.settings.sourceLang,
            targetLang: data.settings.targetLang,
            keepImages: data.settings.keepImages,
          })
        }

        setImportError(null)
        alert(`Successfully imported ${data.lists.length} list(s)!`)
      } catch {
        setImportError('Failed to import file. Please check the file format.')
      }
    }
    reader.readAsText(file)

    // Reset file input
    event.target.value = ''
  }

  const handleClearAll = () => {
    clearAll()
    setShowClearConfirm(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your API key, languages, and preferences
        </p>
      </div>

      {/* API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Gemini API Key</CardTitle>
          <CardDescription>
            Your API key is stored locally and never sent to any server except Google's Gemini API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your Gemini API key..."
                value={settings.apiKey}
                onChange={(e) => updateSettings({ apiKey: e.target.value })}
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google AI Studio
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
          <CardDescription>
            Set your source language (what you're learning from) and target language (what you're learning).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sourceLang">Source Language</Label>
              <Select
                id="sourceLang"
                value={settings.sourceLang}
                onChange={(e) => updateSettings({ sourceLang: e.target.value })}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetLang">Target Language</Label>
              <Select
                id="targetLang"
                value={settings.targetLang}
                onChange={(e) => updateSettings({ targetLang: e.target.value })}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Keep Uploaded Images</Label>
              <p className="text-sm text-muted-foreground">
                Store uploaded images for re-extraction later
              </p>
            </div>
            <Switch
              checked={settings.keepImages}
              onCheckedChange={(checked) => updateSettings({ keepImages: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Spaced Repetition Info */}
      <Card>
        <CardHeader>
          <CardTitle>Spaced Repetition</CardTitle>
          <CardDescription>
            Cards are automatically scheduled based on how well you know them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Again:</strong> Resets the card for more frequent review
            </p>
            <p>
              <strong>Hard:</strong> Increases interval slightly
            </p>
            <p>
              <strong>Good:</strong> Normal interval increase
            </p>
            <p>
              <strong>Easy:</strong> Larger interval increase
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Use "Due for Review" in Study mode to see only cards that are ready for review.
          </p>
        </CardContent>
      </Card>

      {/* Account - only show if Firebase is configured */}
      {isFirebaseEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account
            </CardTitle>
            <CardDescription>
              Sign in to sync your vocabulary lists across devices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <Cloud className="h-4 w-4 text-green-600" />
                  <span>Syncing to cloud</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Signed in as {user.email}
                </p>
                <Button variant="outline" onClick={signOut} disabled={authLoading}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CloudOff className="h-4 w-4" />
                  <span>Data stored locally only</span>
                </div>
                <Button onClick={showAuthModal}>
                  Sign In / Create Account
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export or import your vocabulary data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <label>
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Data
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {importError && (
            <p className="text-sm text-destructive">{importError}</p>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will delete all your vocabulary lists and flashcards. This cannot be undone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Language Flashcards v{APP_VERSION}
          </p>
          <p className="text-sm text-muted-foreground">
            Your data is stored locally in your browser. No account required.
          </p>
        </CardContent>
      </Card>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent onClose={() => setShowClearConfirm(false)}>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete all your data? This will remove {lists.length} list(s) and all flashcards. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Clear All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
