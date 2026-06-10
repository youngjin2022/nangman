"""PWA 아이콘 생성 스크립트 - accent 배경 + '낭' 글자 (Header 로고와 동일 컨셉)
사용: python scripts/generate-icons.py
"""
from PIL import Image, ImageDraw, ImageFont
import os

ACCENT = (37, 99, 235)  # #2563EB
WHITE = (255, 255, 255)

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')


def make_icon(size: int, filename: str) -> None:
    img = Image.new('RGB', (size, size), ACCENT)
    draw = ImageDraw.Draw(img)

    text = '낭'
    font = None
    for font_path in (
        'C:/Windows/Fonts/malgunbd.ttf',
        'C:/Windows/Fonts/malgun.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ):
        if os.path.exists(font_path):
            font = ImageFont.truetype(font_path, int(size * 0.55))
            break
    if font is None:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(((size - w) / 2 - bbox[0], (size - h) / 2 - bbox[1]), text, fill=WHITE, font=font)

    img.save(os.path.join(OUT_DIR, filename))


if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    make_icon(192, 'icon-192.png')
    make_icon(512, 'icon-512.png')
    print('done')
