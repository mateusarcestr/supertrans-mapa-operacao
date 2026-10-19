"""Phase 0: inventory source packages without assuming their process semantics."""
import hashlib
import io
import json
import sys
import zipfile
from collections import Counter
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'inventory'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def tag(element):
    return element.tag.rsplit('}', 1)[-1]


def run():
    OUT.mkdir(parents=True, exist_ok=True)
    inventory = []
    for folder, pattern in [('Processos em bpm', '*.zip'), ('POP', '*.docx')]:
        for path in sorted((ROOT / folder).glob(pattern)):
            raw = path.read_bytes()
            item = {'file': path.relative_to(ROOT).as_posix(), 'size': len(raw),
                    'sha256': hashlib.sha256(raw).hexdigest()}
            target = OUT / path.stem
            target.mkdir(exist_ok=True)
            with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                item['members'] = archive.namelist()
                item['crcError'] = archive.testzip()
                if folder == 'Processos em bpm':
                    item['diagrams'] = []
                    for name in archive.namelist():
                        if name.lower().endswith('.xml') and '/' not in name.strip('/'):
                            (target / Path(name).name).write_bytes(archive.read(name))
                        if not name.lower().endswith('.diag'):
                            continue
                        data = archive.read(name)
                        diag = {'member': name, 'isZip': zipfile.is_zipfile(io.BytesIO(data))}
                        if diag['isZip']:
                            with zipfile.ZipFile(io.BytesIO(data)) as inner:
                                diag['members'] = inner.namelist()
                                diag['crcError'] = inner.testzip()
                                dest = target / Path(name).stem
                                dest.mkdir(exist_ok=True)
                                diag['xml'] = []
                                for member in inner.namelist():
                                    if member.lower().endswith('.xml'):
                                        content = inner.read(member)
                                        root = ET.fromstring(content)
                                        (dest / Path(member).name).write_bytes(content)
                                        diag['xml'].append({'member': member, 'root': root.tag,
                                                            'tags': dict(Counter(tag(e) for e in root.iter()))})
                        item['diagrams'].append(diag)
                else:
                    root = ET.fromstring(archive.read('word/document.xml'))
                    (target / 'document.xml').write_bytes(archive.read('word/document.xml'))
                    blocks = []
                    for idx, child in enumerate(root.find('w:body', NS)):
                        if tag(child) == 'p':
                            blocks.append({'bodyIndex': idx, 'type': 'paragraph',
                                           'text': ''.join(child.itertext())})
                        elif tag(child) == 'tbl':
                            rows = []
                            for row in child.findall('w:tr', NS):
                                rows.append(['\n'.join(''.join(t.itertext()) for t in cell.findall('w:p', NS))
                                             for cell in row.findall('w:tc', NS)])
                            blocks.append({'bodyIndex': idx, 'type': 'table', 'rows': rows})
                    item['paragraphs'] = sum(b['type'] == 'paragraph' for b in blocks)
                    item['tables'] = sum(b['type'] == 'table' for b in blocks)
                    item['media'] = [m for m in archive.namelist() if m.startswith('word/media/')]
                    item['trackedChanges'] = {k: len(root.findall('.//w:' + k, NS)) for k in ('ins', 'del')}
                    (target / 'blocks.json').write_text(json.dumps(blocks, ensure_ascii=False, indent=2), encoding='utf-8')
            inventory.append(item)
    (OUT / 'inventory.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2), encoding='utf-8')
    for item in inventory:
        if 'diagrams' in item:
            print(item['file'], 'diagrams:', len(item['diagrams']), 'members:', len(item['members']))
            for diag in item['diagrams']:
                print(' ', diag['member'], diag['isZip'], diag.get('members'))
        else:
            print(item['file'], 'paragraphs:', item['paragraphs'], 'tables:', item['tables'], 'media:', len(item['media']))


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    run()
