#!/bin/bash

# 创建临时目录
mkdir -p /tmp/nexusai-icons

# 使用 ImageMagick 或 Inkscape 生成图标（如果可用）
# 或者手动创建简单的 PNG 图标

# 创建 1024x1024 的源图
cat > /tmp/nexusai-icons/generate.py << 'EOF'
from PIL import Image, ImageDraw, ImageFont
import os

# 创建 1024x1024 图像
size = 1024
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# 绘制渐变背景
for y in range(size):
    r = int(99 + (139 - 99) * y / size)
    g = int(102 + (92 - 102) * y / size)
    b = int(241 + (246 - 241) * y / size)
    draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

# 绘制圆角矩形
radius = 180
draw.rounded_rectangle([0, 0, size, size], radius, fill=None)

# 添加文字
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 480)
except:
    font = ImageFont.load_default()

text = "N"
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
x = (size - text_width) // 2
y = (size - text_height) // 2 - 50

draw.text((x, y), text, font=font, fill="white")

# 保存各种尺寸
sizes = [1024, 512, 256, 128, 64, 32, 16]
for s in sizes:
    resized = img.resize((s, s), Image.Resampling.LANCZOS)
    if s == 1024:
        resized.save("icon.png")
    elif s == 128:
        resized.save("128x128.png")
        resized.save("128x128@2x.png")
        resized.save("icon.ico")
    elif s == 32:
        resized.save("32x32.png")

print("Icons generated successfully!")
EOF

# 如果 PIL 可用，运行脚本
if python3 -c "import PIL" 2>/dev/null; then
    cd src-tauri/icons && python3 /tmp/nexusai-icons/generate.py
else
    echo "PIL not available, creating placeholder files..."
    touch src-tauri/icons/icon.png
    touch src-tauri/icons/128x128.png
    touch src-tauri/icons/128x128@2x.png
    touch src-tauri/icons/32x32.png
    touch src-tauri/icons/icon.ico
    touch src-tauri/icons/icon.icns
fi

rm -rf /tmp/nexusai-icons
