import hashlib
import json
import re
import unicodedata
from urllib.parse import quote


def clean(value):
    return ' '.join(unicodedata.normalize('NFKC', value or '').split())


def key(value):
    return clean(value).casefold()


def uid(*parts):
    return str(parts[0]) + ''.join(':' + quote(str(p), safe='-._') for p in parts[1:])


def digest(value):
    return hashlib.sha256(key(value).encode()).hexdigest()[:20]


def sources(kind, *locators):
    return unique([{'kind': kind, **loc} for loc in locators if loc])


def unique(items):
    seen, result = set(), []
    for item in items:
        token = json.dumps(item, sort_keys=True, ensure_ascii=False)
        if token not in seen:
            result.append(item)
            seen.add(token)
    return result


def entity(identifier, name, refs, **kwargs):
    return {'id': identifier, 'name': name or '', 'sources': unique(refs), **kwargs}


def tree_child(tree, tag):
    return next((c for c in (tree or {}).get('children', []) if c['tag'].rsplit('}', 1)[-1] == tag), None)


def code_text(value):
    text = clean(value)
    match = re.match(r'^((?:S-)?\d+(?:\.\d+)*)(?:\.\s*|\s+|$)', text, re.I)
    return (match[1].upper(), text[match.end():]) if match else (None, text)


def lexical(value):
    return ' '.join(re.findall(r'\w+', key(value)))


def diagnostic(code, pid, ids, refs, message, **details):
    ident = uid(pid, 'diagnostic', code, hashlib.sha256(json.dumps([ids, details], sort_keys=True).encode()).hexdigest()[:20])
    return entity(ident, code, refs, code=code, processId=pid, entityIds=ids,
                  severity='warning', message=message, details=details)


def unknown_stage():
    return {'stage': 'unknown', 'classification': 'unknown', 'evidence': []}
