"""Small, dependency-free utilities shared by source readers."""
import hashlib
import io
from pathlib import Path, PurePosixPath
import zipfile
import xml.etree.ElementTree as ET


class SourceError(ValueError):
    """An input cannot be read without losing or misinterpreting content."""


def read_zip(data: bytes, label: str) -> dict[str, bytes]:
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            entries = archive.infolist()
            if len(entries) > 5000 or sum(e.file_size for e in entries) > 256 * 1024 * 1024:
                raise SourceError(f'{label}: archive exceeds ingestion limits')
            result = {}
            for entry in entries:
                name = entry.filename.replace('\\', '/')
                path = PurePosixPath(name)
                if path.is_absolute() or '..' in path.parts or ':' in name:
                    raise SourceError(f'{label}: unsafe member {name!r}')
                if name in result:
                    raise SourceError(f'{label}: duplicate archive member {name!r}')
                if entry.file_size > 64 * 1024 * 1024:
                    raise SourceError(f'{label}: member exceeds ingestion limit: {name}')
                if not entry.is_dir():
                    result[name] = archive.read(entry)
            return result
    except (zipfile.BadZipFile, RuntimeError, OSError, NotImplementedError) as exc:
        raise SourceError(f'{label}: invalid or unsupported ZIP: {exc}') from exc


class _NoDoctype(ET.TreeBuilder):
    def doctype(self, name, pubid, system):
        raise SourceError('DOCTYPE declarations are not supported')


def parse_xml(data: bytes, label: str) -> ET.Element:
    try:
        return ET.fromstring(data, parser=ET.XMLParser(target=_NoDoctype()))
    except (ET.ParseError, SourceError) as exc:
        raise SourceError(f'{label}: invalid or unsupported XML: {exc}') from exc


def source_info(path: Path, root: Path) -> dict:
    return {'file': path.resolve().relative_to(root.resolve()).as_posix(),
            'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}


def local_name(element: ET.Element) -> str:
    return element.tag.rsplit('}', 1)[-1]


def xml_value(element: ET.Element | None):
    """Preserve attributes, nonblank element text and children; omit XML layout tails."""
    if element is None:
        return None
    return {'tag': element.tag, 'attributes': dict(element.attrib),
            'text': element.text if element.text and element.text.strip() else None,
            'children': [xml_value(c) for c in element]}


def issue(code: str, source: dict, message: str, severity='warning', **extra) -> dict:
    return {'code': code, 'severity': severity, 'message': message, 'source': source, **extra}
