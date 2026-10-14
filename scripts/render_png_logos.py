import os
import subprocess
import time

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
html_dark_path = os.path.abspath("scripts/logo_dark.html")
html_light_path = os.path.abspath("scripts/logo_light.html")
svg_path = os.path.abspath("public/images/logo-core.svg")

with open(svg_path, 'r', encoding='utf-8') as f:
    svg_dark = f.read()

# Versao light muda o fill do texto para #0f172a
svg_light = svg_dark.replace('fill="#ffffff"', 'fill="#0f172a"').replace('fill="#94a3b8"', 'fill="#64748b"')

with open("public/images/logo-core-light.svg", 'w', encoding='utf-8') as f:
    f.write(svg_light)

# Template HTML
def make_html(svg_str):
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {{
    margin: 0;
    padding: 10px;
    background: transparent !important;
    overflow: hidden;
  }}
  .logo-box {{
    width: 720px;
    height: 180px;
  }}
</style>
</head>
<body>
  <div class="logo-box">
    {svg_str}
  </div>
</body>
</html>"""

with open(html_dark_path, 'w', encoding='utf-8') as f:
    f.write(make_html(svg_dark))

with open(html_light_path, 'w', encoding='utf-8') as f:
    f.write(make_html(svg_light))

png_dark = os.path.abspath("public/images/logo-core-dark-transparent.png")
png_light = os.path.abspath("public/images/logo-core-light-transparent.png")

# Comando headless Edge
cmd_dark = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    "--window-size=740,200",
    f"--screenshot={png_dark}",
    f"file:///{html_dark_path.replace(os.sep, '/')}"
]

cmd_light = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--default-background-color=00000000",
    "--window-size=740,200",
    f"--screenshot={png_light}",
    f"file:///{html_light_path.replace(os.sep, '/')}"
]

print("Renderizando PNGs transparentes de altissima definicao...")
subprocess.run(cmd_dark, check=True)
subprocess.run(cmd_light, check=True)
print("PNGs gerados com sucesso!")
