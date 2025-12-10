import type { ExtractedVocab } from '@/types'

interface ExtractionResult {
  success: boolean
  vocabulary?: ExtractedVocab[]
  error?: string
  rawOutput?: string
}

const EXTRACTION_PROMPT = `You are parsing vocabulary lists from textbook pages.

Extract all vocabulary entries for the language pair:
SOURCE_LANG → TARGET_LANG.

Return JSON ONLY using the schema:
[
  {
    "source": "...",
    "target": "...",
    "gender": "...",
    "partOfSpeech": "...",
    "example": "...",
    "notes": ""
  }
]

Important:
- "source" is the word in SOURCE_LANG
- "target" is the translation in TARGET_LANG
- "gender" should be "m", "f", "n", or empty if not applicable
- "partOfSpeech" should be "noun", "verb", "adjective", "adverb", etc. or empty
- "example" is an example sentence if visible, otherwise empty
- "notes" for any additional info or empty

Ignore headings, numbering, unrelated text, example sentences unless they directly illustrate the vocabulary word, and any non-vocabulary content.
Do not include explanations or comments. Return only valid JSON array.`

export async function extractVocabFromImage(
  apiKey: string,
  base64Image: string,
  sourceLang: string,
  targetLang: string
): Promise<ExtractionResult> {
  try {
    // Remove data URL prefix if present
    const imageData = base64Image.includes(',')
      ? base64Image.split(',')[1]
      : base64Image

    // Determine MIME type from base64 or default to jpeg
    let mimeType = 'image/jpeg'
    if (base64Image.includes('data:')) {
      const match = base64Image.match(/data:([^;]+);/)
      if (match) {
        mimeType = match[1]
      }
    }

    const prompt = EXTRACTION_PROMPT
      .replace(/SOURCE_LANG/g, sourceLang)
      .replace(/TARGET_LANG/g, targetLang)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageData,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 65536,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `API error: ${response.status}`
      return { success: false, error: errorMessage }
    }

    const data = await response.json()

    // Check if response was truncated
    const finishReason = data.candidates?.[0]?.finishReason
    if (finishReason === 'MAX_TOKENS') {
      return {
        success: false,
        error: 'Response was truncated. Try with a smaller image or fewer vocabulary items.',
        rawOutput: JSON.stringify(data, null, 2),
      }
    }

    // Extract text from response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return {
        success: false,
        error: 'No text in API response',
        rawOutput: JSON.stringify(data, null, 2),
      }
    }

    // Parse JSON from response
    try {
      // Strip markdown code fences if present
      let cleanedText = text
      const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        cleanedText = codeBlockMatch[1].trim()
      }

      // Try to find JSON array in the response
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        return {
          success: false,
          error: 'No JSON array found in response',
          rawOutput: text,
        }
      }

      const vocabulary = JSON.parse(jsonMatch[0]) as ExtractedVocab[]

      // Validate structure
      if (!Array.isArray(vocabulary)) {
        return {
          success: false,
          error: 'Response is not an array',
          rawOutput: text,
        }
      }

      // Clean up and validate entries
      const cleanedVocab = vocabulary
        .filter((item) => item.source && item.target)
        .map((item) => ({
          source: String(item.source || '').trim(),
          target: String(item.target || '').trim(),
          gender: item.gender ? String(item.gender).trim() : undefined,
          partOfSpeech: item.partOfSpeech ? String(item.partOfSpeech).trim() : undefined,
          example: item.example ? String(item.example).trim() : undefined,
          notes: item.notes ? String(item.notes).trim() : undefined,
        }))

      if (cleanedVocab.length === 0) {
        return {
          success: false,
          error: 'No valid vocabulary entries found',
          rawOutput: text,
        }
      }

      return { success: true, vocabulary: cleanedVocab }
    } catch (parseError) {
      return {
        success: false,
        error: 'Failed to parse JSON from response',
        rawOutput: text,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )
    return response.ok
  } catch {
    return false
  }
}
