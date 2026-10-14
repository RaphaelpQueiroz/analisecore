from PIL import Image
import numpy as np
import os

input_path = 'C:/Users/Usuario/.gemini/antigravity/brain/87924983-34a1-473b-b94b-296e9ca8b9bf/analises_core_logo_1790345815372.jpg'
img = Image.open(input_path).convert('RGB')
arr = np.array(img, dtype=np.float32)
h, w, _ = arr.shape

# Estimativa precisa do gradiente de fundo
bg_top = np.mean(arr[:30, :, :3], axis=(0, 1))
bg_bottom = np.mean(arr[-30:, :, :3], axis=(0, 1))

y_coords = np.linspace(0, 1, h)[:, np.newaxis, np.newaxis]
bg_model = bg_top * (1 - y_coords) + bg_bottom * y_coords
bg_full = np.repeat(bg_model, w, axis=1)

# Diferença de cor
diff = arr - bg_full
# O logo é mais brilhante que o fundo
lum_diff = (0.299 * diff[:, :, 0] + 0.587 * diff[:, :, 1] + 0.114 * diff[:, :, 2])
chroma_diff = np.sqrt(np.sum(np.maximum(0, diff)**2, axis=2))

# Distância combinada
dist = np.maximum(lum_diff * 1.2, chroma_diff)

# Rampa suave de alpha para preservar o brilho ciano suave
t_low = 12.0
t_high = 32.0
alpha = np.clip((dist - t_low) / (t_high - t_low), 0.0, 1.0)

# Un-premultiply suave
norm_alpha = alpha[:, :, np.newaxis]
clean_rgb = arr.copy()
mask = norm_alpha[:, :, 0] > 0.03
clean_rgb[mask] = np.clip(
    (clean_rgb[mask] - bg_full[mask] * (1.0 - norm_alpha[mask])) / np.maximum(norm_alpha[mask], 0.15),
    0, 255
)

out = np.dstack([clean_rgb.astype(np.uint8), (alpha * 255).astype(np.uint8)])
final_img = Image.fromarray(out)

# Recorta com respiro
bbox = final_img.getbbox()
if bbox:
    pad = 25
    x0 = max(0, bbox[0] - pad)
    y0 = max(0, bbox[1] - pad)
    x1 = min(w, bbox[2] + pad)
    y1 = min(h, bbox[3] + pad)
    cropped = final_img.crop((x0, y0, x1, y1))
    
    out_path = 'public/images/analises-core-original-transparent.png'
    cropped.save(out_path, format='PNG')
    print(f'Logo original salvo com fundo 100% transparente em {out_path} ({cropped.size[0]}x{cropped.size[1]})')

    # Salva também como logo-core-dark-transparent.png para substituir no login
    cropped.save('public/images/logo-core-dark-transparent.png', format='PNG')
    print('Substituido logo-core-dark-transparent.png!')
