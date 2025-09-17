# Production Crash Debugging Guide

## Current Status

- ✅ Preview builds work
- ✅ Development builds work
- ❌ Production builds crash on app open

## Enhanced Debugging Strategy

### 1. **Check Build Logs**

Recent builds:

- **Latest Production**: `4872932f-7033-4b36-905b-8550ae570a1d` (crashes)
- **Latest Preview**: `dbd33265-687b-4572-ab00-2164ace0c7ea` (works)
- **Production Debug**: `e416a6bc-5ccc-458c-9a95-88d3954d9f03` (building)

### 2. **Compare Working vs Crashing Builds**

| Aspect       | Preview (Works) | Production (Crashes) |
| ------------ | --------------- | -------------------- |
| Distribution | internal        | store                |
| Build Type   | APK             | AAB                  |
| Minification | Partial         | Full                 |
| Environment  | preview         | production           |

### 3. **Debugging Steps**

#### Step 1: Test Production Debug Build

```bash
# Wait for build to complete, then test
eas build:list --platform=android --limit=1
```

#### Step 2: Check Android Logs

```bash
# Connect your Android device and run:
adb logcat | grep -E "(ReactNativeJS|MSeller|Expo)"
```

#### Step 3: Compare Bundle Outputs

```bash
# Check bundle analysis
eas build:inspect [BUILD_ID]
```

### 4. **Common Production Crash Causes**

#### A. **Code Minification Issues**

- Dynamic imports not handled properly
- Reflection-based code broken by minification

#### B. **Bundle Size/Memory Issues**

- Production bundles might be too large
- Memory pressure on app startup

#### C. **Native Module Compatibility**

- React Native Firebase issues in production
- Expo modules not working in standalone builds

#### D. **Certificate/Signing Issues**

- App might be signed incorrectly
- Play Store vs development certificates

### 5. **Enhanced Error Logging Added**

The following debugging enhancements have been added:

1. **Global Error Handler** in `app/_layout.tsx`
2. **Enhanced Error Boundary** in `components/common/ErrorBoundary.tsx`
3. **Firebase Config Validation** in `config/firebase.ts`
4. **Production Debug Profile** in `eas.json`

### 6. **Testing Strategy**

1. **Test production-debug build** (building now)
2. **If debug build works**: Issue is likely bundle optimization
3. **If debug build fails**: Issue is likely environment or native modules
4. **Compare logs** between working and failing builds

### 7. **Potential Quick Fixes**

#### Option 1: Disable Bundle Optimization

```json
// eas.json - add to production profile
"production": {
  "autoIncrement": true,
  "android": {
    "buildType": "apk"
  }
}
```

#### Option 2: Match Preview Configuration

```json
// eas.json - make production identical to preview
"production": {
  "distribution": "internal",
  "autoIncrement": true
}
```

#### Option 3: Gradual Migration

```json
// eas.json - create intermediate profile
"production-lite": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```

### 8. **Next Steps**

1. ⏳ Wait for production-debug build
2. 🧪 Test on device and check logs
3. 📊 Compare error outputs
4. 🔧 Apply targeted fix based on findings

### 9. **Log Collection Commands**

```bash
# Android device logs
adb logcat | grep -E "(ReactNativeJS|ExpoModulesCore|Firebase)"

# EAS build logs
eas build:view [BUILD_ID]

# Environment variables check
eas env:list production
eas env:list preview
```
