# Play Store AAB Testing Strategy

## The Problem

- APK works for testing but Play Store requires AAB
- AAB format might be causing the production crashes
- Need to test AAB format before publishing

## Solution: Multi-Step Testing Approach

### Step 1: Test APK Equivalent of Production

```bash
# Test production settings with APK format
eas build -p android --profile production-debug --clear-cache
```

### Step 2: Test AAB with Internal Distribution

```bash
# Test AAB format with same settings as production
eas build -p android --profile production-aab --clear-cache
```

### Step 3: Use Google Play Internal App Sharing

1. Build production AAB:

   ```bash
   eas build -p android --profile production --clear-cache
   ```

2. Upload to Internal App Sharing:
   - Go to: https://play.google.com/console/
   - Select your app → Testing → Internal app sharing
   - Upload the AAB file
   - Share with testers for immediate testing

### Step 4: Compare Results

- **APK (production-debug)**: Works ✅ → Issue is AAB-specific
- **APK fails**: Issue is production configuration
- **AAB (internal)**: Works ✅ → Issue might be Play Store signing
- **AAB fails**: Issue is AAB format or bundle optimization

## Key Differences: APK vs AAB

### APK Format

- Single file with all resources
- Direct installation
- Less optimized
- What preview builds use

### AAB Format (Android App Bundle)

- Split into multiple APKs by Google Play
- Dynamic delivery
- More optimized/compressed
- Code splitting by architecture/density
- **Potential issue**: Aggressive optimization might break something

## Debugging AAB Issues

### Common AAB Problems:

1. **Resource splitting** breaks dynamic imports
2. **Code minification** more aggressive
3. **Native library** issues with split APKs
4. **Play Store signing** vs development signing

### Solutions:

1. **Disable dynamic delivery** for testing
2. **Reduce bundle optimization**
3. **Test with Play Console internal sharing**

## Updated EAS Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production-debug": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production-aab": {
      "distribution": "internal",
      "android": {
        "buildType": "aab"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

## Testing Workflow

1. **Build APK version**: `eas build -p android --profile production-debug`
2. **Test APK**: Install and verify it works
3. **Build AAB version**: `eas build -p android --profile production-aab`
4. **Test AAB**: Use Internal App Sharing
5. **Compare**: Identify which format causes the crash
6. **Fix accordingly**: Either fix AAB issues or stick with working format

## Play Store Deployment

Once you identify the working configuration:

- Use that exact setup for production builds
- Upload AAB to Play Store (required)
- Use Internal Testing track first, then promote to production
