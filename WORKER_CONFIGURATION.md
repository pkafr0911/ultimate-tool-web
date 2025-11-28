# Web Worker Configuration Guide

## Webpack Configuration

If you're using Webpack 5+, Web Workers are supported natively with the `new URL()` syntax used in the code.

No additional configuration needed! The code already uses the correct pattern:

```typescript
new Worker(new URL('../workers/imageProcessor.worker.ts', import.meta.url), { type: 'module' });
```

### For Webpack 4

If you're using Webpack 4, install `worker-loader`:

```bash
npm install --save-dev worker-loader
```

And update the worker initialization:

```typescript
import Worker from 'worker-loader!../workers/imageProcessor.worker.ts';
const worker = new Worker();
```

## Vite Configuration

Vite supports Web Workers out of the box with the `?worker` suffix:

### Option 1: Using ?worker suffix (Recommended for Vite)

Update `useImageWorker.tsx`:

```typescript
import ImageProcessorWorker from '../workers/imageProcessor.worker.ts?worker';

// In useEffect:
workerRef.current = new ImageProcessorWorker();
```

### Option 2: Current implementation (works in Vite too)

The current implementation using `new URL()` also works in Vite without changes.

## Create React App (CRA)

For CRA v5+, the current implementation should work without changes.

For older CRA versions, you may need to eject or use CRACO to configure worker support.

## TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "target": "ES2015",
    "lib": ["ES2015", "DOM", "WebWorker"],
    "moduleResolution": "node"
  }
}
```

## Testing the Worker

### Quick Test

Add this to your browser console:

```javascript
// Check if Web Workers are supported
if (typeof Worker !== 'undefined') {
  console.log('✅ Web Workers supported');
} else {
  console.log('❌ Web Workers not supported');
}
```

### Performance Test

Add to `ImageEditor` component:

```typescript
useEffect(() => {
  console.log('Worker processing:', isWorkerProcessing ? 'ACTIVE' : 'idle');
}, [isWorkerProcessing]);
```

## Troubleshooting

### Worker not loading

**Error**: `Failed to construct 'Worker'`

**Solutions**:

1. Check file path is correct
2. Ensure worker file has correct extension (`.ts` or `.js`)
3. Check bundler configuration

### CORS issues

**Error**: `Failed to load worker script`

**Solutions**:

1. Ensure worker is served from same origin
2. Check dev server configuration
3. Add proper CORS headers if using CDN

### Module not found

**Error**: `Cannot find module 'worker.ts'`

**Solutions**:

1. Check TypeScript configuration
2. Ensure worker file exists
3. Verify import path is correct

### Worker not processing

**Symptoms**: Loading indicator never appears

**Solutions**:

1. Check browser console for errors
2. Verify `processImage` is passed correctly
3. Test worker initialization in `useImageWorker`

## Development Tips

### Hot Module Replacement (HMR)

Workers may not hot-reload automatically. If you modify the worker:

1. Save the worker file
2. Refresh the browser
3. Or restart dev server

### Debugging Workers

```typescript
// In worker file:
console.log('Worker: Processing started');

// In main thread:
workerRef.current.onmessage = (e) => {
  console.log('Main: Received result', e.data);
};
```

### Performance Monitoring

```typescript
const start = performance.now();
await processImage(imageData, effects);
console.log(`Processing time: ${performance.now() - start}ms`);
```

## Build Configuration Examples

### Vite (vite.config.ts)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  worker: {
    format: 'es', // or 'iife'
  },
  build: {
    target: 'esnext',
  },
});
```

### Webpack (webpack.config.js)

```javascript
module.exports = {
  module: {
    rules: [
      {
        test: /\.worker\.ts$/,
        use: { loader: 'worker-loader' },
      },
    ],
  },
};
```

### Next.js (next.config.js)

```javascript
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader' },
    });
    return config;
  },
};
```

## Production Build

Ensure workers are properly bundled:

```bash
# Build
npm run build

# Check output
ls -la dist/assets/*.worker.js
```

Workers should be separate chunks in the build output.

## Browser DevTools

### Chrome/Edge DevTools

1. Open DevTools → Sources
2. Look for worker threads in the left sidebar
3. Set breakpoints in worker code
4. Monitor worker messages in Console

### Firefox DevTools

1. Open DevTools → Debugger
2. Check "Workers" in the left panel
3. Debug worker code directly

## Security Considerations

Workers run in a separate context with:

- No DOM access
- No access to `window` object
- Limited `self` global scope
- Same-origin policy applies

This makes them safe for processing untrusted data.

## Known Issues

### Issue: Worker fails in development but works in production

**Cause**: Different bundler behavior

**Solution**: Test production build locally:

```bash
npm run build
npm run preview
```

### Issue: TypeScript errors in worker

**Cause**: Missing worker types

**Solution**: Add to tsconfig.json:

```json
{
  "compilerOptions": {
    "lib": ["DOM", "ES2015", "WebWorker"]
  }
}
```

### Issue: Memory leaks

**Cause**: Worker not terminated

**Solution**: Already handled in `useImageWorker` cleanup:

```typescript
return () => {
  if (workerRef.current) {
    workerRef.current.terminate();
  }
};
```
