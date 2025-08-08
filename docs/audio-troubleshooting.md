# Audio Issues Troubleshooting Guide

## Common Browser Console Errors and Solutions

### 1. ERR_CACHE_OPERATION_NOT_SUPPORTED / ERR_CACHE_READ_FAILURE
**Error**: 
- `Failed to load resource: net::ERR_CACHE_OPERATION_NOT_SUPPORTED`
- `Failed to load resource: net::ERR_CACHE_READ_FAILURE`

**Cause**: Browser cache corruption or cache compatibility issues with audio files, especially MP3 files.

**Solutions**:
1. **Use Audio Diagnostics Tool**:
   - Click "🔊 Audio Debug" in bottom-left corner
   - Look for red indicators (🔴) showing failed files
   - Click "🔧 Fix Failed Audio" to try alternative loading for all failed files
   - Use individual "🔧" buttons for specific files

2. **Clear Browser Cache**:
   - **Chrome**: Press `Ctrl+Shift+Delete` → Select "Cached images and files" → Clear data
   - **Firefox**: Press `Ctrl+Shift+Delete` → Select "Cache" → Clear Now
   - **Edge**: Press `Ctrl+Shift+Delete` → Select "Cached images and files" → Clear

3. **Hard Refresh**: Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

4. **Disable Cache** (for development):
   - Open DevTools (F12)
   - Go to Network tab
   - Check "Disable cache" checkbox
   - Refresh the page

### 2. MUI Select Warnings
**Error**: `MUI: The anchorEl prop provided to the component is invalid`

**Status**: ✅ FIXED - Updated Select component to properly handle refs and anchor elements.

### 3. React Prop Warnings
**Error**: `React does not recognize the ownerState prop on a DOM element`

**Status**: ✅ FIXED - Added prop filtering in the Select component.

### 4. Audio Autoplay Restrictions
**Error**: `NotAllowedError: play() failed because the user didn't interact with the document first`

**Status**: ✅ FIXED - Added user interaction detection and graceful autoplay handling.

**How it works now**:
- Background music will only start after the first user interaction (click, key press, or touch)
- No more console errors for blocked autoplay
- Audio service gracefully handles autoplay restrictions

## Development Tools

### Audio Diagnostics Component
In development mode, you'll see an "🔊 Audio Debug" button in the bottom-left corner. This tool helps you:

1. **Monitor Audio Loading Status**:
   - 🟢 Green = Audio loaded successfully
   - 🟡 Yellow = Audio still loading
   - 🔴 Red = Audio failed to load

2. **Test Audio Playback**:
   - Click the ▶️ button to test individual audio files
   - Verify that sounds are working correctly

3. **Reload Audio Files**:
   - Click the 🔄 button to reload individual files
   - Use "🔄 Reload All Audio" to reload everything with cache busting

4. **Alternative Loading** (NEW):
   - Click the 🔧 button (appears for failed files) to try alternative loading strategy
   - Use "🔧 Fix Failed Audio" to apply alternative loading to all failed files
   - Alternative loading uses different preload strategies and CORS settings

### Smart Loading Strategies
The audio service now uses intelligent loading strategies:

- **MP3 files**: Loaded without cache busting to avoid compatibility issues
- **WAV files**: Use cache busting in development for freshness
- **Failed files**: Automatically retry without cache parameters
- **Alternative loading**: Uses different preload modes and CORS settings

### Cache Busting
In development mode, all audio files are loaded with a timestamp parameter (`?v=timestamp`) to prevent cache issues.

## Best Practices

1. **Always test audio after making changes** using the Audio Diagnostics tool
2. **Clear browser cache** if you encounter persistent loading issues
3. **Use hard refresh** when audio files seem to be cached incorrectly
4. **Check the browser's Network tab** in DevTools to see which files are failing to load

## File Structure
All audio files are located in:
```
client/public/assets/audio/
├── achievements/
│   ├── win.wav
│   └── README.md
├── gameplay/
│   ├── beep.wav
│   ├── correct-answer.wav
│   ├── wrong-answer.wav
│   └── README.md
├── music/
│   ├── game.mp3
│   ├── general.mp3
│   └── README.md
├── ui/
│   ├── click.wav
│   └── README.md
└── README.md
```

## Troubleshooting Steps

If you encounter audio issues:

1. **Check the Audio Diagnostics** - Look for any red indicators
2. **Try reloading individual files** - Use the 🔄 button for specific files
3. **Try reloading all audio** - Use the "🔄 Reload All Audio" button
4. **Hard refresh the browser** - Press Ctrl+Shift+R
5. **Clear browser cache completely** - Use DevTools or browser settings
6. **Check if files exist** - Verify the audio files are in the correct locations
7. **Check browser console** - Look for specific error messages

## Notes

- The Audio Diagnostics component only appears in development mode
- Cache busting is only applied in development to avoid unnecessary network requests in production
- All audio loading errors are handled gracefully with user-friendly warnings
