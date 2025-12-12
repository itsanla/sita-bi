# Gemini Models Configuration

## Environment Variable

Tambahkan di file `.env`:

```env
GEMINI_MODELS=model1,model2,model3
```

## Format
- **Comma-separated** list of model names
- **Priority order**: Model pertama akan dicoba dulu, lalu fallback ke model berikutnya
- **No spaces** around commas (atau akan di-trim otomatis)

## Contoh Konfigurasi

### Default (Recommended)
```env
GEMINI_MODELS=gemini-2.5-flash-lite,gemini-2.5-flash,gemini-robotics-er-1.5-preview
```

### Hanya Flash Models
```env
GEMINI_MODELS=gemini-2.5-flash-lite,gemini-2.5-flash
```

### Prioritas Robotics (Quota Besar)
```env
GEMINI_MODELS=gemini-robotics-er-1.5-preview,gemini-2.5-flash-lite,gemini-2.5-flash
```

### Single Model
```env
GEMINI_MODELS=gemini-2.5-flash-lite
```

## Keuntungan

✅ **No Rebuild Required** - Ubah model tanpa rebuild Docker
✅ **Flexible** - Ganti model sesuai kebutuhan
✅ **Easy Testing** - Test model baru dengan mudah
✅ **Production Ready** - Update model via environment variable saja

## Cara Update di Production

### Docker Compose
```yaml
environment:
  - GEMINI_MODELS=gemini-2.5-flash-lite,gemini-2.5-flash
```

### Kubernetes
```yaml
env:
  - name: GEMINI_MODELS
    value: "gemini-2.5-flash-lite,gemini-2.5-flash"
```

### Docker Run
```bash
docker run -e GEMINI_MODELS="gemini-2.5-flash-lite,gemini-2.5-flash" your-image
```

## Model List (Update 2025)

Available models:
- `gemini-2.5-flash-lite` - Tercepat, 20 RPD
- `gemini-2.5-flash` - Terbaru, 20 RPD
- `gemini-2.0-flash` - Stable, 20 RPD
- `gemini-robotics-er-1.5-preview` - Experimental, 250 RPD

Check latest models: https://ai.google.dev/gemini-api/docs/models
