import io
import hashlib
import json
from pathlib import Path
import unittest
import zipfile
from contextlib import contextmanager
import shutil
from uuid import uuid4

from scripts.ingest.bizagi import extract_bizagi, parse_diagram
from scripts.ingest.pop import extract_pop, parse_document
from scripts.ingest.common import SourceError, read_zip, parse_xml
from scripts.extract_sources import build_dataset, discover_pairs

ROOT = Path(__file__).resolve().parents[1]
XNS = 'http://www.wfmc.org/2009/XPDL2.2'
WNS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'


@contextmanager
def workspace_temp():
    """Use inherited Windows permissions; Python's mode-0700 temp dirs deny the sandbox."""
    base = (ROOT / 'data' / 'test-workspaces').resolve()
    base.mkdir(parents=True, exist_ok=True)
    path = base / str(uuid4())
    path.mkdir()
    try:
        yield str(path)
    finally:
        if path.resolve().parent != base:
            raise RuntimeError('Refusing cleanup outside test workspace')
        shutil.rmtree(path)


def archive_bytes(members):
    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w') as z:
        for name, value in members.items():
            z.writestr(name, value)
    return out.getvalue()


def minimal_diagram(activities='', transitions=''):
    return f'<Package xmlns="{XNS}" Id="diagram" Name="Example"><WorkflowProcesses><WorkflowProcess Id="flow"><Activities>{activities}</Activities><Transitions>{transitions}</Transitions></WorkflowProcess></WorkflowProcesses></Package>'.encode()


class RealSourcesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pairs = discover_pairs(ROOT)
        cls.bizagi = [extract_bizagi(a, ROOT) for _, a, _ in cls.pairs]
        cls.pops = [extract_pop(b, ROOT) for _, _, b in cls.pairs]

    def test_ten_pairs_and_expected_counts(self):
        self.assertEqual([p[0] for p in self.pairs], [f'P{i:03}' for i in range(1, 11)])
        self.assertEqual([len(p['diagrams']) for p in self.bizagi], [2, 2, 1, 3, 1, 1, 1, 1, 1, 1])
        counts = [sum(len(w['nodes']) for d in p['diagrams'] for w in d['workflows']) for p in self.bizagi]
        self.assertEqual(counts, [269, 161, 61, 256, 252, 54, 37, 90, 49, 121])
        self.assertEqual([len(p['activityRows']) for p in self.pops], [215, 130, 47, 201, 201, 44, 32, 69, 36, 106])

    def test_nodes_events_gateways_flows_and_sources(self):
        totals = {}
        flows = 0
        for source in self.bizagi:
            self.assertEqual(len(source['source']['sha256']), 64)
            for d in source['diagrams']:
                self.assertIn('Diagram.xml', d['members'])
                self.assertEqual(d['format'], 'XPDL2.2')
                for w in d['workflows']:
                    ids = {a['originalId'] for a in w['nodes']}
                    for a in w['nodes']:
                        totals[a['type']] = totals.get(a['type'], 0) + 1
                        self.assertEqual(a['source']['elementId'], a['originalId'])
                        self.assertTrue(a['graphics'])
                    for f in w['flows']:
                        flows += 1
                        self.assertIn(f['from'], ids)
                        self.assertIn(f['to'], ids)
        self.assertEqual(totals, {'startEvent': 14, 'task': 1065, 'gateway': 87, 'endEvent': 25, 'intermediateEvent': 145, 'subprocess': 14})
        self.assertEqual(flows, 1354)

    def test_duplicate_original_diagram_ids_are_not_collapsed(self):
        ids = [p['diagrams'][0]['originalId'] for p in self.bizagi]
        self.assertLess(len(set(ids)), len(ids))
        self.assertEqual(len(self.bizagi), 10)
        self.assertNotEqual(self.bizagi[1]['source']['file'], self.bizagi[2]['source']['file'])

    def test_broken_subprocess_references_are_diagnosed(self):
        codes = [x['code'] for x in self.bizagi[3]['diagnostics']]
        self.assertIn('unresolved-subflow', codes)
        self.assertNotIn('dangling-flow', codes)

    def test_pop_objective_tables_and_metadata(self):
        for p in self.pops:
            for section in ['Objetivo', 'Público Alvo', 'Referências', 'Glossário', 'Anexos', 'Versões']:
                self.assertIn(section, p['sections'])
            self.assertTrue(p['sections']['Objetivo']['paragraphs'])
            self.assertTrue(p['auxiliaryParts'])
            self.assertNotIn('PAGEREF', json.dumps(p['blocks'], ensure_ascii=False))
            for row in p['activityRows']:
                self.assertIsInstance(row['originalId'], str)
                self.assertGreaterEqual(row['source']['row'], 2)
                self.assertEqual(len(row['cells']), 5)
                self.assertEqual(row['source']['member'], 'word/document.xml')

    def test_pop_repeated_ids_notes_blanks_and_times_are_preserved(self):
        rows = self.pops[1]['activityRows']
        self.assertEqual(sum(r['originalId'] == '27.9.3' for r in rows), 2)
        self.assertEqual(sum(r['originalId'] == '-' for r in rows), 7)
        self.assertEqual(len({r['rowKey'] for r in rows}), len(rows))
        self.assertIn('duplicate-pop-id', [d['code'] for d in self.pops[1]['diagnostics']])
        self.assertEqual(self.pops[2]['activityRows'][0]['time'], 'Com um dia de antecedência')
        self.assertEqual(self.pops[5]['activityRows'][0]['time'], '-')

    def test_generation_is_deterministic_and_preserves_originals(self):
        originals = {p: hashlib.sha256(p.read_bytes()).hexdigest() for _, a, b in self.pairs for p in (a, b)}
        with workspace_temp() as tmp:
            out = Path(tmp)
            build_dataset(ROOT, out)
            first = {p.name: p.read_bytes() for p in out.glob('*.json')}
            build_dataset(ROOT, out)
            self.assertEqual(first, {p.name: p.read_bytes() for p in out.glob('*.json')})
            self.assertEqual(len(first), 11)
            manifest = json.loads(first['manifest.json'])
            self.assertEqual(len(manifest['processes']), 10)
        self.assertEqual(originals, {p: hashlib.sha256(p.read_bytes()).hexdigest() for p in originals})


class InvalidInputTests(unittest.TestCase):
    def test_rejects_non_zip_and_unsafe_members(self):
        for data in [b'not a zip', archive_bytes({'../outside.xml': '<x/>'}), archive_bytes({'C:/outside.xml': '<x/>'})]:
            with self.assertRaises(SourceError):
                read_zip(data, 'fixture')

    def test_rejects_xml_entities_and_wrong_namespace(self):
        with self.assertRaises(SourceError):
            parse_xml(b'<!DOCTYPE x [<!ENTITY e "bad">]><x>&e;</x>', 'fixture')
        with self.assertRaises(SourceError):
            parse_diagram(b'<Package Id="x"/>', {'file': 'fixture'}, 'x.diag')

    def test_duplicate_ids_and_dangling_flows_are_visible(self):
        raw = minimal_diagram('<Activity Id="same"/><Activity Id="same"/>', '<Transition Id="f" From="same" To="missing"/>')
        d = parse_diagram(raw, {'file': 'fixture'}, 'x.diag')
        self.assertEqual(len(d['workflows'][0]['nodes']), 2)
        codes = [x['code'] for x in d['diagnostics']]
        self.assertIn('duplicate-id', codes)
        self.assertIn('dangling-flow', codes)
        self.assertIn('unknown-node-type', codes)

    def test_non_zip_diag_and_missing_diagram_fail(self):
        for inner in [b'not a zip', archive_bytes({'Actions.xml': '<x/>'})]:
            with workspace_temp() as tmp:
                p = Path(tmp) / '0001.bpm.zip'
                p.write_bytes(archive_bytes({'one.diag': inner}))
                with self.assertRaises(SourceError):
                    extract_bizagi(p, Path(tmp))

    def test_nested_diagram_member_provenance_reaches_nodes(self):
        with workspace_temp() as tmp:
            root = Path(tmp)
            p = root / '0001.bpm.zip'
            inner = archive_bytes({'nested/Diagram.xml': minimal_diagram('<Activity Id="a"><Event><StartEvent/></Event></Activity>')})
            p.write_bytes(archive_bytes({'one.diag': inner}))
            result = extract_bizagi(p, root)
            d = result['diagrams'][0]
            self.assertEqual(d['workflows'][0]['nodes'][0]['source']['member'], 'nested/Diagram.xml')
            self.assertEqual(d['workflows'][0]['source']['member'], 'nested/Diagram.xml')

    def test_word_table_row_and_cell_content_controls_preserve_data(self):
        def cell(text):
            return f'<w:tc><w:p><w:r><w:t>{text}</w:t></w:r></w:p></w:tc>'

        def wrapped(content):
            return f'<w:sdt><w:sdtContent>{content}</w:sdtContent></w:sdt>'

        header = '<w:tr>' + ''.join(cell(x) for x in ['ID', 'Descritivo', 'Executor', 'Sistema', 'Tempo']) + '</w:tr>'
        row = '<w:tr>' + cell('1') + wrapped(cell('Descrição')) + ''.join(cell(x) for x in ['Cliente', 'E-mail', '-']) + '</w:tr>'
        raw = f'<w:document xmlns:w="{WNS}"><w:body><w:tbl>{header}{wrapped(row)}</w:tbl></w:body></w:document>'.encode()
        p = parse_document(raw, {'file': 'fixture'})
        self.assertEqual(len(p['activityRows']), 1)
        self.assertEqual(p['activityRows'][0]['description'], 'Descrição')
        self.assertEqual(p['activityRows'][0]['executor'], 'Cliente')
        self.assertEqual(p['activityRows'][0]['source']['row'], 2)

    def test_word_visible_text_respects_fields_breaks_and_content_controls(self):
        raw = f'''<w:document xmlns:w="{WNS}"><w:body><w:sdt><w:sdtContent><w:p><w:r><w:instrText>SECRET FIELD CODE</w:instrText><w:t>Visible</w:t><w:tab/><w:t>value</w:t><w:br/><w:t>next</w:t></w:r></w:p></w:sdtContent></w:sdt><w:p><w:r><w:t>Objetivo</w:t></w:r></w:p><w:p><w:r><w:t>Goal</w:t></w:r></w:p></w:body></w:document>'''.encode()
        p = parse_document(raw, {'file': 'fixture'})
        self.assertEqual(p['blocks'][0]['text'], 'Visible\tvalue\nnext')
        self.assertEqual(p['sections']['Objetivo']['paragraphs'][0]['text'], 'Goal')

    def test_unexpected_table_does_not_become_activity_rows(self):
        raw = f'''<w:document xmlns:w="{WNS}"><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>ID</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>'''.encode()
        p = parse_document(raw, {'file': 'fixture'})
        self.assertEqual(p['activityRows'], [])
        self.assertIn('unexpected-activity-table', [d['code'] for d in p['diagnostics']])

    def test_missing_pair_fails_before_output(self):
        with workspace_temp() as tmp:
            root = Path(tmp)
            with self.assertRaises(SourceError):
                build_dataset(root, root / 'output')
            self.assertFalse((root / 'output').exists())


if __name__ == '__main__':
    unittest.main()
