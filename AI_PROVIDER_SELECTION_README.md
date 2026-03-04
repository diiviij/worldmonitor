# AI Provider Selection Feature

## Overview
This feature provides a **floating bar at the top of the world map** for quick AI provider selection, allowing users to easily switch between different AI API providers (Groq, OpenAI, Gemini, OpenRouter, and Ollama) without digging through settings.

## Changes Made

### 1. **New Service: AI Provider Manager** (`src/services/ai-provider-manager.ts`)
   - Manages user's preferred AI provider selection
   - Stores selection in localStorage for persistence
   - Provides metadata for all available providers
   - Includes helper function to check provider readiness

### 2. **Updated Runtime Config** (`src/services/runtime-config.ts`)
   - Added new secret keys: `OPENAI_API_KEY` and `GEMINI_API_KEY`
   - Added new feature IDs: `aiOpenAI` and `aiGemini`
   - Defined feature configurations for OpenAI and Gemini

### 3. **Updated Summarization Service** (`src/services/summarization.ts`)
   - Modified to respect user's provider selection
   - Selected provider is tried first in the fallback chain
   - Maintains automatic fallback to other providers if selected one fails
   - Updated `SummarizationProvider` type to include 'openai' and 'gemini'

### 4. **Floating Map Bar Component** (`src/components/AIProviderSelector.ts`)
   - Created new floating bar component mounted on top of map
   - Shows all available providers with their status (✓ ready / ✗ needs key)
   - Real-time status updates when switching providers
   - Direct link to get API key for selected provider
   - Persists selection across browser sessions
   - Positioned at top-center of map for easy access

### 5. **Updated Settings Constants** (`src/services/settings-constants.ts`)
   - Added signup URLs for OpenAI and Gemini
   - Added human-readable labels for new API keys
   - Updated AI category to include new providers

### 6. **Enhanced Styling** (`src/styles/settings-window.css`)
   - New styles for AI provider selector card
   - Status indicator styling (green for ready, yellow for needs key)
   - Consistent with existing settings UI design

### 7. **Updated Configuration Files**
   - `.env.example`: Added OpenAI and Gemini API key placeholders
   - `.env.local`: Updated comments to explain new provider selection UI

## How to Use

### For Users:

1. **Look at Top of Map**
   - The AI Provider selector is prominently displayed at the top-center of the world map
   - No need to open settings!

2. **Select Your Preferred Provider**
   - Use the dropdown to select your preferred AI provider
   - Options: Groq, OpenAI, Gemini, OpenRouter, or Ollama (local)
   - The dropdown shows which providers are ready (✓) and which need keys (○)

3. **Add API Keys**
   - Click "Get Key" link next to the status if provider needs API key
   - Or go to Settings → AI & Summarization to configure individual provider keys
   - Keys are validated automatically

4. **Automatic Fallback**
   - Your selected provider is used first for summarization
   - If unavailable, automatically falls back to other configured providers
   - Final fallback to browser-based T5 model

### For Developers:

```typescript
import { getSelectedAIProvider, setSelectedAIProvider } from '@/services/ai-provider-manager';

// Get current selection
const provider = getSelectedAIProvider(); // Returns: 'groq' | 'openrouter' | 'openai' | 'gemini' | 'ollama'

// Change selection
setSelectedAIProvider('openai');

// Check if provider is ready
const { getSecretState } = require('./runtime-config');
const isOpenAIReady = getSecretState('OPENAI_API_KEY').valid;
```

## Provider Priority Order

When a summarization request is made:
1. **Selected Provider** (from dropdown) - tried first
2. **Other API Providers** - in order: Ollama → Groq → OpenRouter → OpenAI → Gemini
3. **Browser T5** - local model as final fallback

## Benefits

- ✅ **User-Friendly**: No need to edit `.env.local` file
- ✅ **Flexible**: Easy to switch between providers
- ✅ **Transparent**: See which providers are configured at a glance
- ✅ **Resilient**: Maintains automatic fallback chain
- ✅ **Persistent**: Selection saved across sessions
- ✅ **Cross-Platform**: Works on web and desktop versions

## Testing

To test the implementation:

1. Start the application
2. Open Settings → AI & Summarization
3. Select different providers from dropdown
4. Observe status indicators change
5. Add API keys for different providers
6. Test summarization with different providers selected
7. Verify fallback behavior by testing with invalid keys

## Migration Notes

- Existing `.env.local` API keys continue to work
- Default provider is Groq (maintains backward compatibility)
- No breaking changes to existing functionality
- All existing features and fallbacks preserved
