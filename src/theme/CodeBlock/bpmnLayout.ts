import Elk from 'elkjs/lib/elk.bundled';
import type {ElkEdgeSection, ElkNode, ElkPoint} from 'elkjs/lib/elk.bundled';

const BPMN_MODEL_NS = 'http://www.omg.org/spec/BPMN/20100524/MODEL';
const BPMN_DI_NS = 'http://www.omg.org/spec/BPMN/20100524/DI';
const DC_NS = 'http://www.omg.org/spec/DD/20100524/DC';
const DD_DI_NS = 'http://www.omg.org/spec/DD/20100524/DI';
const ACTIVITI_NS = 'http://activiti.org/bpmn';

const FRAGMENT_PROCESS_ID = '__fragmentProcess__';
const FALLBACK_PROCESS_ID = 'Process_1';
const MAX_AUTO_LAYOUT_NODES = 200;

const BPMN_NS_PATTERN = /omg\.org\/spec\/BPMN\/\d{8}\/MODEL/;
const BPMN_TAG_PATTERN =
  /<(?:[A-Za-z_][\w.-]*:)?(definitions|process|startEvent|endEvent|boundaryEvent|intermediateCatchEvent|intermediateThrowEvent|intermediateBusinessRuleTaskEvent|userTask|serviceTask|scriptTask|sendTask|receiveTask|businessRuleTask|manualTask|exclusiveGateway|parallelGateway|inclusiveGateway|eventBasedGateway|complexGateway|subProcess|adHocSubProcess|transaction|callActivity|sequenceFlow|messageFlow|participant|dataObjectReference|dataStoreReference|textAnnotation)(?=[\s/>])/;

const RENDERABLE_LANGUAGES = [
  'xml',
  'markup',
  'html',
  'text',
  'bpmn',
  'bpmnxml',
];

const EVENT_TAGS = new Set([
  'startEvent',
  'endEvent',
  'boundaryEvent',
  'intermediateCatchEvent',
  'intermediateThrowEvent',
  'intermediateBusinessRuleTaskEvent',
]);

const GATEWAY_TAGS = new Set([
  'exclusiveGateway',
  'parallelGateway',
  'inclusiveGateway',
  'eventBasedGateway',
  'complexGateway',
]);

const SUBPROCESS_TAGS = new Set(['subProcess', 'adHocSubProcess', 'transaction']);

const TASK_TAGS = new Set([
  'task',
  'userTask',
  'serviceTask',
  'scriptTask',
  'sendTask',
  'receiveTask',
  'businessRuleTask',
  'manualTask',
  'callActivity',
]);

const DATA_TAGS = new Set(['dataObjectReference', 'dataStoreReference']);

// Elements that are legal children of <definitions> but NOT of <process>.
// Doc fragments often mix these with flow elements; they must be lifted to
// the definitions level or bpmn-moddle drops them.
const DEFINITIONS_LEVEL_TAGS = new Set([
  'audience',
  'callChoreography',
  'collaboration',
  'conversation',
  'correlationKey',
  'correlationProperty',
  'dataObject',
  'dataStore',
  'escalation',
  'error',
  'extension',
  'import',
  'interface',
  'itemDefinition',
  'message',
  'potentialStarter',
  'signal',
]);

// Elements that may legally contain other flow elements.
const FLOW_CONTAINER_TAGS = new Set([
  'process',
  'subProcess',
  'adHocSubProcess',
  'transaction',
  'collaboration',
  'conversation',
  'participant',
]);

// Flow elements that docs sometimes (invalidly) nest inside tasks or
// gateways. They get hoisted to the process level.
const HOISTABLE_TAGS = new Set<string>([
  ...EVENT_TAGS,
  ...GATEWAY_TAGS,
  ...SUBPROCESS_TAGS,
  ...TASK_TAGS,
  ...DATA_TAGS,
  'association',
  'messageFlow',
  'sequenceFlow',
  'textAnnotation',
]);

/**
 * Heuristic: does this code block look like a BPMN 2.0 document or fragment?
 */
export function isBpmnXml(
  language: string | undefined,
  code: string,
): boolean {
  if (language && !RENDERABLE_LANGUAGES.includes(language)) {
    return false;
  }
  return BPMN_NS_PATTERN.test(code) || BPMN_TAG_PATTERN.test(code);
}

interface FlowNodeInfo {
  id: string;
  width: number;
  height: number;
  isSubprocess: boolean;
}

interface FlowRef {
  id: string;
  source: string;
  target: string;
}

interface LayoutResult {
  positions: Map<string, ElkPoint>;
  edgePoints: Map<string, ElkPoint[]>;
}

interface ElkEdgeLike {
  id: string;
  sections?: ElkEdgeSection[];
}

function nodeSizeFor(
  tag: string,
  name: string,
): {width: number; height: number; isSubprocess: boolean} {
  if (EVENT_TAGS.has(tag)) {
    return {width: 36, height: 36, isSubprocess: false};
  }
  if (GATEWAY_TAGS.has(tag)) {
    return {width: 50, height: 50, isSubprocess: false};
  }
  if (SUBPROCESS_TAGS.has(tag)) {
    return {width: 250, height: 140, isSubprocess: true};
  }
  if (DATA_TAGS.has(tag)) {
    return {width: 30, height: 30, isSubprocess: false};
  }
  const width = name
    ? Math.min(320, Math.max(100, Math.round(name.length * 7.5) + 40))
    : 100;
  return {width, height: 80, isSubprocess: false};
}

function getAttr(el: Element, name: string): string | null {
  return el.getAttribute(name) ?? el.getAttributeNS(BPMN_MODEL_NS, name);
}

function parseXml(xml: string): Document {
  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(xml, 'application/xml');
  } catch {
    throw new Error('Invalid XML in code block');
  }
  // Browsers expose a <parsererror> element, some parsers (e.g. xmldom in
  // tooling/tests) throw or return an incomplete document instead.
  if (!doc.documentElement || doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid XML in code block');
  }
  return doc;
}

function firstChildWithLocalName(
  parent: Element,
  localName: string,
): Element | null {
  for (const child of Array.from(parent.children)) {
    if (child.localName === localName) {
      return child;
    }
  }
  return null;
}

/**
 * Collect flow nodes and sequence flows from a process tree. Sub-process
 * interiors are treated as leaves (flattening them would break their shapes).
 */
function collectModel(root: Element): {nodes: FlowNodeInfo[]; flows: FlowRef[]} {
  const nodes: FlowNodeInfo[] = [];
  const flows: FlowRef[] = [];

  const visit = (el: Element, inSubprocess: boolean): void => {
    if (inSubprocess) {
      return;
    }
    const tag = el.localName;
    if (
      EVENT_TAGS.has(tag) ||
      GATEWAY_TAGS.has(tag) ||
      SUBPROCESS_TAGS.has(tag) ||
      TASK_TAGS.has(tag) ||
      DATA_TAGS.has(tag) ||
      tag === 'textAnnotation' ||
      tag === 'participant'
    ) {
      const id = getAttr(el, 'id');
      if (id && !nodes.some((node) => node.id === id)) {
        const name = getAttr(el, 'name') ?? '';
        const size =
          tag === 'participant'
            ? {width: 400, height: 300, isSubprocess: false}
            : nodeSizeFor(tag, name);
        nodes.push({id, ...size});
      }
    } else if (tag === 'sequenceFlow') {
      const id = getAttr(el, 'id');
      const source = getAttr(el, 'sourceRef');
      const target = getAttr(el, 'targetRef');
      if (id && source && target) {
        flows.push({id, source, target});
      }
    }
    const descendsIntoSubprocess = inSubprocess || SUBPROCESS_TAGS.has(tag);
    for (const child of Array.from(el.children)) {
      visit(child, descendsIntoSubprocess);
    }
  };

  visit(root, false);
  return {nodes, flows};
}

/**
 * Run the ELK layered layout once; returns node positions and edge waypoints
 * from the same consistent layout result.
 */
async function autoLayout(nodes: FlowNodeInfo[], flows: FlowRef[]): Promise<LayoutResult> {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const validFlows = flows.filter(
    (flow) => nodeIds.has(flow.source) && nodeIds.has(flow.target),
  );

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.layered.spacing.edgeNodeBetweenLayers': '40',
      'elk.layered.crossingMinimization.strategy': 'SWAP',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: node.width,
      height: node.height,
    })),
    edges: validFlows.map((flow) => ({
      id: flow.id,
      sources: [flow.source],
      targets: [flow.target],
    })),
  };

  const elk = new Elk();
  const result = await elk.layout(graph);

  const positions = new Map<string, ElkPoint>();
  for (const child of result.children ?? []) {
    if (typeof child.x === 'number' && typeof child.y === 'number') {
      positions.set(child.id, {x: child.x, y: child.y});
    }
  }

  const edgePoints = new Map<string, ElkPoint[]>();
  for (const edge of (result.edges ?? []) as ElkEdgeLike[]) {
    const section = edge.sections?.[0];
    if (section) {
      edgePoints.set(edge.id, [
        section.startPoint,
        ...(section.bendPoints ?? []),
        section.endPoint,
      ]);
    }
  }

  return {positions, edgePoints};
}

function buildDiagramXml(
  processId: string,
  nodes: FlowNodeInfo[],
  flows: FlowRef[],
  {positions, edgePoints}: LayoutResult,
): string {
  let xml = '<bpmndi:BPMNDiagram id="BPMNDiagram_1">\n';
  xml += `  <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="${processId}">\n`;

  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) {
      continue;
    }
    const expanded = node.isSubprocess ? ' isExpanded="true"' : '';
    xml +=
      `    <bpmndi:BPMNShape id="BPMNShape_${node.id}" bpmnElement="${node.id}"${expanded}>\n` +
      `      <dc:Bounds x="${Math.round(pos.x)}" y="${Math.round(pos.y)}" width="${node.width}" height="${node.height}"/>\n` +
      '    </bpmndi:BPMNShape>\n';
  }

  for (const flow of flows) {
    const points = edgePoints.get(flow.id);
    if (!points || points.length < 2) {
      continue;
    }
    xml += `    <bpmndi:BPMNEdge id="BPMNEdge_${flow.id}" bpmnElement="${flow.id}">\n`;
    for (const point of points) {
      xml += `      <di:waypoint x="${Math.round(point.x)}" y="${Math.round(point.y)}"/>\n`;
    }
    xml += '    </bpmndi:BPMNEdge>\n';
  }

  xml += '  </bpmndi:BPMNPlane>\n';
  xml += '</bpmndi:BPMNDiagram>';
  return xml;
}

function ensureDiNamespaces(definitionsTag: string): string {
  let tag = definitionsTag;
  if (!tag.includes(BPMN_DI_NS)) {
    tag = tag.replace(/>$/, ` xmlns:bpmndi="${BPMN_DI_NS}">`);
  }
  if (!tag.includes(DC_NS)) {
    tag = tag.replace(/>$/, ` xmlns:dc="${DC_NS}">`);
  }
  if (!tag.includes(DD_DI_NS)) {
    tag = tag.replace(/>$/, ` xmlns:di="${DD_DI_NS}">`);
  }
  return tag;
}

const WRAPPER_NAMESPACES =
  `xmlns="${BPMN_MODEL_NS}"` +
  ` xmlns:bpmn="${BPMN_MODEL_NS}"` +
  ` xmlns:bpmn2="${BPMN_MODEL_NS}"` +
  ` xmlns:activiti="${ACTIVITI_NS}"` +
  ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`;

function wrapInDefinitions(innerXml: string, diagramXml: string): string {
  return (
    `<definitions ${WRAPPER_NAMESPACES}` +
    ` xmlns:dc="${DC_NS}"` +
    ` xmlns:bpmndi="${BPMN_DI_NS}"` +
    ` xmlns:di="${DD_DI_NS}"` +
    ' id="Definitions_generated">\n' +
    innerXml +
    '\n' +
    diagramXml +
    '\n</definitions>'
  );
}

function wrapFragment(fragment: string): string {
  return (
    `<definitions ${WRAPPER_NAMESPACES}>\n` +
    `<process id="${FRAGMENT_PROCESS_ID}" isExecutable="false">\n` +
    fragment +
    '\n</process>\n</definitions>'
  );
}

/**
 * Fix invalid nesting inside a fragment element in place:
 * - flow elements nested in non-containers (e.g. a <sequenceFlow> inside a
 *   gateway) are detached and appended to `hoisted`
 * - bare extension-namespace children (e.g. a stray <activiti:field>) are
 *   wrapped into <extensionElements>
 */
function fixElementNesting(el: Element, doc: Document, container: Element): void {
  if (el.localName === 'extensionElements') {
    return;
  }
  const isContainer = FLOW_CONTAINER_TAGS.has(el.localName);
  const hoistedHere: Element[] = [];
  const toWrap: Element[] = [];
  for (const child of Array.from(el.children)) {
    if (!isContainer && HOISTABLE_TAGS.has(child.localName)) {
      hoistedHere.push(child);
    } else if (
      child.localName !== 'extensionElements' &&
      child.namespaceURI &&
      child.namespaceURI !== BPMN_MODEL_NS
    ) {
      toWrap.push(child);
    }
  }
  for (const child of hoistedHere) {
    // A flow nested under a node implicitly references its container as the
    // missing endpoint (docs commonly omit the obvious sourceRef).
    if (child.localName === 'sequenceFlow') {
      const hostId = getAttr(el, 'id');
      if (hostId && !getAttr(child, 'sourceRef')) {
        child.setAttribute('sourceRef', hostId);
      }
      if (hostId && !getAttr(child, 'targetRef')) {
        child.setAttribute('targetRef', hostId);
      }
    }
    el.removeChild(child);
    container.appendChild(child);
    fixElementNesting(child, doc, container);
  }
  if (toWrap.length > 0) {
    let ext = firstChildWithLocalName(el, 'extensionElements');
    if (!ext) {
      ext = doc.createElementNS(BPMN_MODEL_NS, 'extensionElements');
      if (el.firstChild) {
        el.insertBefore(ext, el.firstChild);
      } else {
        el.appendChild(ext);
      }
    }
    for (const child of toWrap) {
      el.removeChild(child);
      ext.appendChild(child);
    }
  }
  // Recurse so nesting is fixed at any depth. Inside containers, hoisted
  // elements stay in the nearest container; outside, they go to the process.
  for (const child of Array.from(el.children)) {
    if (child.localName !== 'extensionElements') {
      fixElementNesting(child, doc, isContainer ? el : container);
    }
  }
}

/**
 * Rebuild the renderable document for a fragment from the parsed DOM,
 * correcting structures that are invalid as written in the docs.
 */
function rebuildFragmentXml(processEl: Element, diagramXml: string): string {
  const defsLevel: Element[] = [];
  const processLevel: Element[] = [];

  for (const el of Array.from(processEl.children)) {
    if (el.localName === 'process' || DEFINITIONS_LEVEL_TAGS.has(el.localName)) {
      defsLevel.push(el);
    } else {
      processLevel.push(el);
    }
  }

  let out =
    `<definitions ${WRAPPER_NAMESPACES}` +
    ` xmlns:dc="${DC_NS}"` +
    ` xmlns:bpmndi="${BPMN_DI_NS}"` +
    ` xmlns:di="${DD_DI_NS}"` +
    ' id="Definitions_generated">\n';
  for (const el of defsLevel) {
    out += serializeElement(el) + '\n';
  }
  out += `<process id="${FRAGMENT_PROCESS_ID}" isExecutable="false">\n`;
  for (const el of processLevel) {
    out += serializeElement(el) + '\n';
  }
  out += '</process>\n';
  out += diagramXml + '\n</definitions>';
  return out;
}

/** Serialize an element, preferring outerHTML with an XMLSerializer fallback. */
function serializeElement(el: Element): string {
  const maybe = el as unknown as {outerHTML?: string};
  if (typeof maybe.outerHTML === 'string') {
    return maybe.outerHTML;
  }
  return new XMLSerializer().serializeToString(el);
}

function tagPrefix(openingTag: string): string {
  const m = openingTag.match(/^<([A-Za-z_][\w.-]*:)/);
  return m ? m[1] : '';
}

interface ParsedBpmn {
  mode: 'definitions' | 'process' | 'fragment';
  processEl: Element;
}

/**
 * Turn a raw BPMN code block (full document, process, or bare fragment) into
 * a complete, renderable BPMN 2.0 document with diagram interchange.
 * Documents that already carry a BPMNDiagram are returned unchanged.
 */
export async function toRenderableBpmn(rawXml: string): Promise<string> {
  const stripped = rawXml.replace(/^\s*<\?xml[^?]*\?>\s*/, '').trim();
  if (!stripped) {
    throw new Error('Empty code block');
  }
  if (stripped.includes('BPMNDiagram')) {
    return stripped;
  }

  let doc: Document;
  let wrapped = false;
  try {
    doc = parseXml(stripped);
  } catch {
    doc = parseXml(wrapFragment(stripped));
    wrapped = true;
  }

  const root = doc.documentElement;
  const rootTag = root.localName;

  let parsed: ParsedBpmn;
  if (rootTag === 'definitions' && !wrapped) {
    const processEl = firstChildWithLocalName(root, 'process');
    if (!processEl) {
      throw new Error('No <process> found in BPMN definitions');
    }
    parsed = {mode: 'definitions', processEl};
  } else if (rootTag === 'process') {
    parsed = {mode: 'process', processEl: root};
  } else if (wrapped) {
    // The fragment needed wrapping; if it contained a top-level <process>
    // element, render that process (the rest of the block becomes
    // definitions-level content).
    const synthetic = firstChildWithLocalName(root, 'process');
    const children = synthetic ? Array.from(synthetic.children) : [];
    const topLevelProcess = children.find((c) => c.localName === 'process');
    if (topLevelProcess) {
      parsed = {mode: 'process', processEl: topLevelProcess};
    } else {
      parsed = {mode: 'fragment', processEl: synthetic ?? root};
    }
  } else {
    // A bare single-element fragment that parses on its own (e.g. a lone
    // gateway). Wrap it in a synthetic process so hoisted flow elements
    // have a valid home.
    const synthetic = doc.createElementNS(BPMN_MODEL_NS, 'process');
    synthetic.setAttribute('id', FRAGMENT_PROCESS_ID);
    synthetic.setAttribute('isExecutable', 'false');
    synthetic.appendChild(root);
    parsed = {mode: 'fragment', processEl: synthetic};
  }

  // Fix invalid nesting as written in the docs (flows nested inside
  // gateways/tasks, stray extension elements) so bpmn-moddle accepts the
  // generated document.
  for (const child of Array.from(parsed.processEl.children)) {
    fixElementNesting(child, doc, parsed.processEl);
  }

  const {nodes, flows} = collectModel(parsed.processEl);

  // Sequence flows may reference elements that are not part of the fragment
  // (docs often show a flow on its own). Synthesize placeholder tasks for
  // missing endpoints so the diagram is still meaningful.
  const knownIds = new Set(nodes.map((node) => node.id));
  const placeholderIds: string[] = [];
  for (const flow of flows) {
    for (const ref of [flow.source, flow.target]) {
      if (!knownIds.has(ref)) {
        knownIds.add(ref);
        placeholderIds.push(ref);
        nodes.push({id: ref, width: 100, height: 80, isSubprocess: false});
      }
    }
  }

  if (nodes.length === 0) {
    throw new Error('No renderable BPMN elements found');
  }
  if (nodes.length > MAX_AUTO_LAYOUT_NODES) {
    throw new Error(
      `Too many elements to auto-layout (${nodes.length} > ${MAX_AUTO_LAYOUT_NODES})`,
    );
  }

  const layout = await autoLayout(nodes, flows);

  let processId: string;
  if (parsed.mode === 'fragment') {
    // The diagram root is the fragment's own process or collaboration when
    // it carries one (the plane must reference it); otherwise the synthetic
    // fragment process.
    const children = Array.from(parsed.processEl.children);
    const inner = children.find((c) => c.localName === 'process');
    const collab = children.find((c) => c.localName === 'collaboration');
    if (inner) {
      if (!getAttr(inner, 'id')) {
        inner.setAttribute('id', FALLBACK_PROCESS_ID);
      }
      processId = getAttr(inner, 'id') ?? FALLBACK_PROCESS_ID;
    } else if (collab) {
      processId = getAttr(collab, 'id') ?? FRAGMENT_PROCESS_ID;
    } else {
      processId = FRAGMENT_PROCESS_ID;
    }
  } else {
    processId = getAttr(parsed.processEl, 'id') ?? FALLBACK_PROCESS_ID;
  }

  const diagramXml = buildDiagramXml(processId, nodes, flows, layout);

  // Placeholder tasks join the document as real elements, inside the process
  // the plane references.
  const innerProcess =
    parsed.mode === 'fragment'
      ? Array.from(parsed.processEl.children).find((c) => c.localName === 'process') ??
        null
      : null;
  const placeholderTarget = innerProcess ?? parsed.processEl;
  for (const id of placeholderIds) {
    const task = doc.createElementNS(BPMN_MODEL_NS, 'task');
    task.setAttribute('id', id);
    task.setAttribute('name', id);
    placeholderTarget.appendChild(task);
  }

  switch (parsed.mode) {
    case 'definitions': {
      // Serialize the (normalized) document from the DOM so nesting fixes
      // are reflected, keeping the original opening tag (patched with the
      // DI namespaces).
      const tagMatch = stripped.match(/<(?:[A-Za-z_][\w.-]*:)?definitions\b[^>]*>/);
      if (!tagMatch || tagMatch.index === undefined) {
        throw new Error('Malformed BPMN definitions element');
      }
      const tag = tagMatch[0];
      const patched = ensureDiNamespaces(tag);
      let out = `${stripped.slice(0, tagMatch.index)}${patched}\n`;
      for (const child of Array.from(root.children)) {
        out += serializeElement(child) + '\n';
      }
      // tagPrefix includes the trailing colon (or is empty)
      out += diagramXml + '\n</' + tagPrefix(tag) + 'definitions>';
      return out;
    }
    case 'process': {
      if (!getAttr(parsed.processEl, 'id')) {
        parsed.processEl.setAttribute('id', FALLBACK_PROCESS_ID);
      }
      let innerXml = serializeElement(parsed.processEl);
      // When the process was extracted from a wrapped fragment, keep any
      // definitions-level siblings (e.g. <error>) in the output.
      const parent = parsed.processEl.parentElement;
      if (parent && parent.localName === 'definitions') {
        const siblings = Array.from(parent.children)
          .filter((sib) => sib !== parsed.processEl)
          .map((sib) => serializeElement(sib));
        if (siblings.length > 0) {
          innerXml = siblings.join('\n') + '\n' + innerXml;
        }
      }
      return wrapInDefinitions(innerXml, diagramXml);
    }
    case 'fragment': {
      return rebuildFragmentXml(parsed.processEl, diagramXml);
    }
  }
}
