import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Upload as UploadIcon,
  Loader2,
  AlertCircle,
  Check,
  Trash2,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useSettingsStore } from '@/stores/settingsStore'
import { useVocabStore } from '@/stores/vocabStore'
import { extractVocabFromImage } from '@/services/gemini'
import type { ExtractedVocab } from '@/types'
import { LANGUAGES } from '@/types'

export function Upload() {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const { lists, createList, addFlashcards } = useVocabStore()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawOutput, setRawOutput] = useState<string | null>(null)
  const [extractedVocab, setExtractedVocab] = useState<ExtractedVocab[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [selectedListId, setSelectedListId] = useState<string>('new')

  const sourceLangName = LANGUAGES.find((l) => l.code === settings.sourceLang)?.name || settings.sourceLang
  const targetLangName = LANGUAGES.find((l) => l.code === settings.targetLang)?.name || settings.targetLang

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setRawOutput(null)
      setExtractedVocab([])

      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile)
      setError(null)
      setRawOutput(null)
      setExtractedVocab([])

      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(droppedFile)
    }
  }, [])

  const handleExtract = async () => {
    if (!file || !preview) return

    if (!settings.apiKey) {
      setError('Please add your Gemini API key in Settings first.')
      return
    }

    setIsExtracting(true)
    setError(null)
    setRawOutput(null)

    try {
      const result = await extractVocabFromImage(
        settings.apiKey,
        preview,
        sourceLangName,
        targetLangName
      )

      if (result.success && result.vocabulary) {
        setExtractedVocab(result.vocabulary)
      } else {
        setError(result.error || 'Failed to extract vocabulary')
        if (result.rawOutput) {
          setRawOutput(result.rawOutput)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleEditVocab = (index: number, field: keyof ExtractedVocab, value: string) => {
    setExtractedVocab((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const handleRemoveVocab = (index: number) => {
    setExtractedVocab((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddVocab = () => {
    setExtractedVocab((prev) => [...prev, { source: '', target: '' }])
  }

  const handleSave = () => {
    if (extractedVocab.length === 0) return

    let listId: string

    if (selectedListId === 'new') {
      const name = newListName.trim() || `Import ${new Date().toLocaleDateString()}`
      const newList = createList(name)
      listId = newList.id
    } else {
      listId = selectedListId
    }

    const flashcards = extractedVocab
      .filter((v) => v.source.trim() && v.target.trim())
      .map((v) => ({
        source: v.source.trim(),
        target: v.target.trim(),
        gender: v.gender?.trim(),
        partOfSpeech: v.partOfSpeech?.trim(),
        example: v.example?.trim(),
        notes: v.notes?.trim(),
        tags: [],
      }))

    addFlashcards(listId, flashcards)
    setShowSaveDialog(false)
    navigate(`/list/${listId}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Upload Image</h1>
          <p className="text-muted-foreground">
            Extract vocabulary from a textbook page ({sourceLangName} → {targetLangName})
          </p>
        </div>
      </div>

      {/* API Key Warning */}
      {!settings.apiKey && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">API Key Required</p>
              <p className="text-sm text-yellow-700">
                Please add your Gemini API key in{' '}
                <Link to="/settings" className="underline">
                  Settings
                </Link>{' '}
                to use vocabulary extraction.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      {!preview && (
        <Card>
          <CardContent className="py-12">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            >
              <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                Drag and drop an image here
              </p>
              <p className="text-muted-foreground mb-4">
                or click to select a file
              </p>
              <label>
                <Button asChild>
                  <span>Select Image</span>
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview & Extract */}
      {preview && extractedVocab.length === 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Image Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={preview}
                alt="Preview"
                className="w-full rounded-lg border"
              />
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                >
                  Choose Different Image
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Extract Vocabulary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Click the button below to extract vocabulary from this image using Gemini AI.
              </p>

              <div className="p-4 bg-muted rounded-lg flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-source)]"></div>
                  <span className="text-sm"><strong>Source:</strong> {sourceLangName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-target)]"></div>
                  <span className="text-sm"><strong>Target:</strong> {targetLangName}</span>
                </div>
              </div>

              <Button
                onClick={handleExtract}
                disabled={isExtracting || !settings.apiKey}
                className="w-full"
                size="lg"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>Extract Vocabulary</>
                )}
              </Button>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                  <p className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                  {rawOutput && (
                    <div className="mt-2">
                      <p className="text-sm mb-1">Raw API output:</p>
                      <Textarea
                        value={rawOutput}
                        readOnly
                        className="font-mono text-xs"
                        rows={6}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Extracted Vocabulary */}
      {extractedVocab.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Extracted Vocabulary ({extractedVocab.length} items)
            </CardTitle>
            <Button onClick={handleAddVocab} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {extractedVocab.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-[var(--color-source)] font-medium">Source</Label>
                      <Input
                        value={item.source}
                        onChange={(e) =>
                          handleEditVocab(index, 'source', e.target.value)
                        }
                        placeholder="Source word"
                        className="border-[var(--color-source)]/30 focus-visible:ring-[var(--color-source)]/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[var(--color-target)] font-medium">Target</Label>
                      <Input
                        value={item.target}
                        onChange={(e) =>
                          handleEditVocab(index, 'target', e.target.value)
                        }
                        placeholder="Target word"
                        className="border-[var(--color-target)]/30 focus-visible:ring-[var(--color-target)]/50"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVocab(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setExtractedVocab([])
                  setFile(null)
                  setPreview(null)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button
                onClick={() => setShowSaveDialog(true)}
                className="flex-1"
                disabled={extractedVocab.filter((v) => v.source && v.target).length === 0}
              >
                <Check className="mr-2 h-4 w-4" />
                Save {extractedVocab.filter((v) => v.source && v.target).length} Flashcards
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent onClose={() => setShowSaveDialog(false)}>
          <DialogHeader>
            <DialogTitle>Save Flashcards</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Save to</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
              >
                <option value="new">Create new list</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedListId === 'new' && (
              <div className="space-y-2">
                <Label>New list name</Label>
                <Input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Flashcards</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
