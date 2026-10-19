"""Versioned JSON Schema definition; emitted alongside the canonical dataset."""


def operation_schema():
    string = {'type': 'string'}
    identifier = {'type': 'string', 'minLength': 1}
    nullable_id = {'type': ['string', 'null']}
    obj = {'type': 'object'}
    nullable_obj = {'type': ['object', 'null']}
    boolean = {'type': 'boolean'}
    ids = {'type': 'array', 'items': identifier, 'uniqueItems': True}
    strings = {'type': 'array', 'items': string}
    classification = {'enum': ['explicit', 'inferred', 'unknown']}
    statuses = {'enum': ['matched', 'partially-matched', 'ambiguous', 'unmatched-bizagi', 'unmatched-pop']}
    defs = {}

    def ref(name):
        return {'$ref': '#/$defs/' + name}

    def array(name):
        return {'type': 'array', 'items': ref(name)}

    def shape(properties, required=None):
        return {'type': 'object', 'properties': properties, 'required': list(properties) if required is None else required,
                'additionalProperties': False}

    refs = {**array('source'), 'minItems': 1}
    defs['source'] = shape({'kind': {'enum': ['bizagi', 'pop']}, 'file': identifier,
                            'sha256': {'type': 'string', 'pattern': '^[a-f0-9]{64}$'}, 'member': identifier,
                            'archiveMember': identifier, 'diagramId': identifier, 'workflowId': identifier,
                            'elementId': nullable_id, 'table': {'type': 'integer', 'minimum': 1},
                            'row': {'type': 'integer', 'minimum': 1}, 'column': {'type': 'integer', 'minimum': 1},
                            'bodyIndex': {'type': 'integer', 'minimum': 0}, 'path': string, 'section': {'type': ['string', 'null']},
                            'item': string}, ['kind', 'file', 'sha256'])
    defs['source']['allOf'] = [
        {'if': {'required': ['row']}, 'then': {'required': ['table', 'member']}},
        {'if': {'required': ['diagramId']}, 'then': {'required': ['archiveMember', 'member']}},
        {'if': {'properties': {'kind': {'const': 'pop'}}}, 'then': {'not': {'required': ['diagramId']}}}]

    def ent(properties):
        return shape({'id': identifier, 'name': string, 'sources': refs, **properties})

    defs['stage'] = shape({'stage': {'enum': ['request/intake', 'qualification', 'approval', 'planning', 'scheduling', 'execution', 'completion', 'unknown']},
                           'classification': classification, 'evidence': strings})
    defs['assignment'] = shape({'assignmentMethod': {'enum': ['explicit', 'geometry', 'unresolved']},
                                'laneId': nullable_id, 'candidateLaneIds': ids, 'classification': classification, 'evidence': obj})
    defs['responsibility'] = shape({'status': {'enum': ['documented', 'needs-review', 'unresolved']},
                                    'actorId': nullable_id, 'popActorId': nullable_id, 'bizagiLaneActorId': nullable_id,
                                    'sources': array('source')}, ['status', 'actorId', 'sources'])
    context = {'processId': identifier, 'diagramId': identifier, 'originalId': nullable_id}
    defs['node'] = ent({**context, 'originalName': {'type': ['string', 'null']}, 'workflowId': identifier,
                        'type': {'enum': ['task', 'subprocess', 'gateway', 'startEvent', 'endEvent', 'intermediateEvent', 'unknown']},
                        'bounds': nullable_obj, 'attributes': obj, 'extendedAttributes': {'type': 'array'},
                        'implementation': nullable_obj, 'event': nullable_obj, 'route': nullable_obj, 'loop': nullable_obj,
                        'sourceOrder': {'type': 'integer', 'minimum': 0}, 'laneAssignment': ref('assignment'),
                        'incoming': ids, 'outgoing': ids, 'operationalStage': ref('stage'), 'responsibility': ref('responsibility'),
                        'subflowTargetOriginalId': nullable_id, 'eventKind': {'enum': ['start', 'end', 'intermediate', 'unknown']},
                        'gatewayType': string, 'reconciliationStatus': statuses, 'reconciliationId': identifier})
    defs['flow'] = ent({**context, 'workflowId': identifier, 'type': {'const': 'sequence'}, 'sourceNodeId': nullable_id,
                        'targetNodeId': nullable_id, 'sourceOriginalId': nullable_id, 'targetOriginalId': nullable_id,
                        'label': {'type': ['string', 'null']}, 'condition': nullable_obj, 'graphics': {'type': 'array'},
                        'integrity': {'enum': ['valid', 'invalid']}, 'defaultPath': {'type': ['boolean', 'null']}})
    defs['flow']['allOf'] = [{'if': {'properties': {'integrity': {'const': 'valid'}}},
                             'then': {'properties': {'sourceNodeId': identifier, 'targetNodeId': identifier}}}]
    defs['pool'] = ent({**context, 'workflowId': identifier, 'bounds': nullable_obj, 'attributes': obj})
    defs['lane'] = ent({**context, 'poolId': identifier, 'workflowId': identifier, 'actorId': nullable_id,
                        'actorDerivation': obj, 'localBounds': nullable_obj, 'absoluteBounds': nullable_obj})
    defs['workflow'] = ent(context)
    defs['annotation'] = ent({**context, 'attributes': obj})
    defs['association'] = ent({**context, 'attributes': obj, 'sourceEntityId': nullable_id, 'targetEntityId': nullable_id,
                               'type': {'enum': ['association', 'message']}})
    defs['diagram'] = ent({'processId': identifier, 'originalId': nullable_id, **{k: array(v) for k, v in [
        ('pools', 'pool'), ('lanes', 'lane'), ('workflows', 'workflow'), ('nodes', 'node'), ('flows', 'flow'),
        ('associations', 'association'), ('annotations', 'annotation')]}})
    defs['popStep'] = ent({'processId': identifier, 'sourceId': string, 'rawRowKey': identifier, 'description': string,
                           'executorText': string, 'executorActorId': nullable_id, 'time': string,
                           'section': {'type': ['string', 'null']}, 'subsection': {'type': ['string', 'null']},
                           'fieldSources': shape({f: refs for f in ['sourceId', 'description', 'executor', 'resources', 'time']}),
                           'operationalStage': ref('stage'), 'systemIds': ids, 'channelIds': ids, 'artifactIds': ids,
                           'resourceExpression': string, 'operators': strings, 'reconciliationStatus': statuses, 'reconciliationIds': ids})
    defs['subprocessReference'] = ent({**context, 'sourceNodeId': identifier, 'targetOriginalId': nullable_id,
                                      'targetWorkflowId': nullable_id, 'targetDiagramId': nullable_id,
                                      'resolutionStatus': {'enum': ['resolved', 'unresolved']}, 'classification': classification,
                                      'attributes': nullable_obj})
    defs['candidate'] = shape({'popStepId': identifier, 'sameOperationalId': boolean, 'textSupport': {'enum': ['exact', 'contained', 'different']},
                               'laneActorId': nullable_id, 'popActorId': nullable_id, 'actorAgreement': {'type': ['boolean', 'null']},
                               'context': string, 'sources': refs})
    defs['reconciliation'] = ent({'processId': identifier, 'status': statuses, 'bizagiNodeIds': ids, 'popStepIds': ids,
                                  'accepted': boolean, 'classification': classification, 'method': identifier,
                                  'confidence': {'enum': ['corroborated', 'insufficient']}, 'candidates': array('candidate'),
                                  'evidence': strings, 'cardinality': {'enum': ['1:1', '1:N', 'N:1', 'N:N', 'unresolved']}})
    defs['section'] = shape({'sources': refs, 'paragraphs': {'type': 'array', 'items': shape({'text': string, 'sources': refs})}})
    defs['process'] = ent({'diagrams': array('diagram'), 'popSteps': array('popStep'), 'subprocessReferences': array('subprocessReference'),
                           'reconciliations': array('reconciliation'), 'documentation': {'type': 'object', 'additionalProperties': ref('section')},
                           'lifecycle': shape({'classification': classification, 'stages': strings})})
    defs['catalogEntry'] = ent({'kind': {'enum': ['actor', 'system', 'channel', 'artifact']}, 'aliases': strings,
                                'classification': string, 'classifications': {'type': 'array', 'items': shape({'value': string, 'evidence': {}, 'sources': refs})}})
    defs['handoff'] = ent({'processId': identifier, 'diagramId': identifier, 'flowId': identifier, 'sourceNodeId': identifier,
                           'targetNodeId': identifier, 'fromActorId': identifier, 'toActorId': identifier,
                           'classification': classification, 'evidence': strings})
    defs['relationship'] = ent({'processId': identifier, 'type': {'enum': ['subprocess-call', 'document-reference', 'event-link']},
                                'sourceEntityId': identifier, 'targetEntityId': identifier,
                                'classification': classification, 'derived': boolean, 'evidence': strings})
    defs['conflict'] = ent({'processId': identifier, 'entityIds': ids, 'field': string, 'bizagiValue': {}, 'popValue': {},
                            'status': {'const': 'needs-review'}, 'nature': {'const': 'potential-divergence'}})
    defs['diagnostic'] = ent({'processId': identifier, 'entityIds': ids, 'code': identifier, 'severity': {'enum': ['warning', 'error']},
                              'message': string, 'details': obj})
    top = shape({'schemaVersion': {'const': '1.0.0'}, 'sourcePolicy': {'const': ['bizagi', 'pop']},
                 'inputs': {'type': 'array', 'items': shape({'file': identifier, 'sha256': {'type': 'string', 'pattern': '^[a-f0-9]{64}$'}})},
                 'processes': {**array('process'), 'minItems': 10, 'maxItems': 10},
                 **{k: array('catalogEntry') for k in ['actors', 'systems', 'channels', 'artifacts']},
                 **{k: array(v) for k, v in [('handoffs', 'handoff'), ('relationships', 'relationship'), ('conflicts', 'conflict'), ('diagnostics', 'diagnostic')]}})
    return {'$schema': 'https://json-schema.org/draft/2020-12/schema', '$id': 'urn:supertrans:operation-model:1.0.0',
            'title': 'Bizagi + POP canonical operation model', '$defs': defs, **top}
