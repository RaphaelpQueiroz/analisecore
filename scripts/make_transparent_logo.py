from PIL import Image
import numpy as np
import os

input_path = 'C:/Users/Usuario/.gemini/antigravity/brain/87924983-34a1-473b-b94b-296e9ca8b9bf/analises_core_logo_1790345815372.jpg'
out_dir = os.path.join(os.getcwd(), 'public', 'images')
os.makedirs(out_dir, exist_ok=True)

img = Image.open(input_path).convert('RGBA')
arr = np.array(img, dtype=np.float32)

# Cor de fundo mdia medida nos cantos
# ~ [28, 38, 48]
bg_color = np.array([28.0, 38.0, 48.0], dtype=np.float32)

# Distncia euclidiana de cor em relao ao fundo
diff = arr[:, :, :3] - bg_color
dist = np.sqrt(np.sum(np.maximum(0, diff)**2, axis=2))
luminance = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
bg_lum = 0.299 * 28 + 0.587 * 38 + 0.114 * 48 # ~36

lum_diff = np.maximum(0, luminance - bg_lum)

# Soft threshold para alpha suave (sem bordas pretas serrilhadas)
low_threshold = 12.0
high_threshold = 38.0

alpha = np.clip((lum_diff - low_threshold) / (high_threshold - low_threshold), 0.0, 1.0) * 255.0

# Descontaminar a cor do fundo (Un-premultiply background) para as bordas brilharem limpas
clean_rgb = arr[:, :, :3].copy()
norm_alpha = (alpha / 255.0)[:, :, np.newaxis]
# Onde alpha > 0, restauramos a cor pura
mask = norm_alpha[:, :, 0] > 0.05
clean_rgb[mask] = np.clip((clean_rgb[mask] - bg_color * (1.0 - norm_alpha[mask])) / np.maximum(norm_alpha[mask], 0.1), 0, 255)

out_arr = np.dstack([clean_rgb.astype(np.uint8), alpha.astype(np.uint8)])
out_img = Image.fromarray(out_arr)

# Salva versao transparente completa
full_out_path = os.path.join(out_dir, 'logo-core-transparent.png')
out_img.save(full_out_path, format='PNG')
print(f"Salvo logo transparente completo em: {full_out_path}")

# Recorte apenas do continer com conteudo (crop bounding box)
bbox = out_img.getbbox()
if bbox:
    cropped = out_img.crop(bbox)
    # Adiciona um respiro de 20px
    pad = 30
    w, h = cropped.size
    padded = Image.new('RGBA', (w + pad*2, h + pad*2), (0, 0, 0, 0))
    padded.paste(cropped, (pad, pad))
    cropped_out_path = os.path.join(out_dir, 'logo-core-cropped.png')
    padded.save(cropped_out_path, format='PNG')
    print(f"Salvo logo recortado em: {cropped_out_path}")

    # E recortar apenas o icone (o hexgono cristalino da esquerda)
    # Na imagem original, o icone est aproximadamente entre x=120 e x=360, y=360 e y=640
    icon_box = (120, 360, 360, 640)
    icon_crop = out_img.crop(icon_box)
    icon_bbox = icon_crop.getbbox()
    if icon_bbox:
        icon_final = icon_crop.crop(icon_bbox)
        icon_pad = 16
        iw, ih = icon_final.size
        icon_padded = Image.new('RGBA', (iw + icon_pad*2, ih + icon_pad*2), (0, 0, 0, 0))
        icon_padded.paste(icon_final, (icon_pad, icon_pad))
        icon_out = os.path.join(out_dir, 'logo-core-icon.png')
        icon_padded.save(icon_out, format='PNG')
        print(f"Salvo icone transparente em: {icon_out}")
