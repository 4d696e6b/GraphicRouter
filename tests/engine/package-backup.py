"""Build labelled offline backups from actual engine-rendered images; no browser calls."""
import hashlib
import json
from pathlib import Path
import sys
import zipfile

import fitz
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas

root = Path(sys.argv[1]).resolve()
pdf = root / 'graphicrouter-pitch-backup.pdf'
document = canvas.Canvas(str(pdf), pagesize=(960, 540))
document.setTitle('GraphicRouter - raster presentation backup')
document.setSubject('Engine SVG raster backup; use PowerPoint for editable elements. Not a Canva export.')
for number in range(1, 6):
    document.drawImage(str(root / 'backup-images' / f'slide{number}.png'), 0, 0, 960, 540)
    document.showPage()
document.save()
with fitz.open(pdf) as verified:
    if len(verified) != 5 or any(page.rect.width != 960 or page.rect.height != 540 for page in verified):
        raise ValueError('The PDF backup failed its five-page 16:9 check.')

font = ImageFont.load_default(size=24)
small = ImageFont.load_default(size=18)
frames = []
for source, message in [
    ('slide3.png', 'Original prepared slide'),
    ('slide3.png', 'Request: change only slide three headline to violet'),
    ('slide3-violet.png', 'Prepared revision: slide3.headline is violet'),
    ('slide3-violet.png', 'Verification: four other slide files are unchanged'),
]:
    frame = Image.new('RGB', (1200, 790), '#191724')
    draw = ImageDraw.Draw(frame)
    draw.text((24, 16), 'GRAPHICROUTER / PRECOMPUTED ENGINE REPLAY', fill='white', font=font)
    draw.text((24, 52), 'Scripted SVG animation. Not a live tool call or screen recording.', fill='#D6CEE8', font=small)
    slide = Image.open(root / 'backup-images' / source).convert('RGB').resize((1200, 675))
    frame.paste(slide, (0, 90))
    draw.text((24, 766), message, fill='white', font=small)
    frames.append(frame)
animation = root / 'precomputed-revision-replay.gif'
frames[0].save(animation, save_all=True, append_images=frames[1:], duration=[2000, 2500, 2500, 2500], loop=0)
with Image.open(animation) as verified:
    if verified.n_frames != 4:
        raise ValueError('The labelled replay needs four frames.')

names = [
    'graphicrouter-pitch-v1.pptx', 'graphicrouter-pitch-v2-violet.pptx',
    'speaker-notes.md', 'offline-rehearsal.html', 'revision-proof.json',
    'graphicrouter-pitch-backup.pdf', 'precomputed-revision-replay.gif', 'backup-context.json',
    'stage-runbook.md',
]
for optional in ['graphicrouter-pitch-expanded.pptx', 'create-deck.json', 'verification-context.json']:
    if (root / optional).is_file():
        names.append(optional)
manifest = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in names}
(root / 'manifest-sha256.json').write_text(json.dumps(manifest, indent=2) + '\n')
archive = root / 'graphicrouter-stage-backup.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as bundle:
    for name in names + ['manifest-sha256.json']:
        bundle.write(root / name, name)
with zipfile.ZipFile(archive) as bundle:
    if bundle.testzip() is not None:
        raise ValueError('Backup ZIP integrity failed.')
    for name, digest in manifest.items():
        if hashlib.sha256(bundle.read(name)).hexdigest() != digest:
            raise ValueError(f'Backup digest mismatch: {name}')
print(json.dumps({'pdfPages': 5, 'replayFrames': 4, 'archive': str(archive), 'verifiedFiles': len(manifest)}))
