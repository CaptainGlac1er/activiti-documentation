/**
 * @vitest-environment jsdom
 *
 * Tests for bpmnLayout.ts — the detection logic behind the property
 * indicators (extractActivitiProperties) and the auto-layout that makes
 * sub-process / ad-hoc sub-process interiors visible in the diagram viewer
 * (toRenderableBpmn).
 *
 * The jsdom environment provides a spec-compliant DOMParser, so the functions
 * under test see the same DOM shapes (namespaceURIs, localNames, parsererror
 * behavior) as in the browser. The final test runs the generated document
 * through the real bpmn-js viewer (with a few SVG geometry stubs jsdom
 * lacks) to prove the interior actually renders.
 *
 * Run with `npm test`.
 */
import {expect, test} from 'vitest';
import {extractActivitiProperties, toRenderableBpmn} from './bpmnLayout';

// Fixtures are taken from the actual docs. `expect` maps element id to the
// tooltip rows in order ("label value" / "label attr=\"v\" ...").
const FIXTURES: Array<{
  name: string;
  xml: string;
  expect: Record<string, string[]>;
}> = [
  {
    name: 'modern service task, bare implementation (no namespaces)',
    xml: '<serviceTask id="tagImageTask" name="Tag Image" implementation="tagImageConnector"/>',
    expect: {tagImageTask: ['implementation tagImageConnector']},
  },
  {
    name: 'namespaced service task (activiti:async + activiti:class)',
    xml: `<bpmn:process xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:activiti="http://activiti.org/bpmn" id="asyncProcess">
      <bpmn:startEvent id="start"/>
      <bpmn:serviceTask id="externalApi" name="Call External API"
          activiti:async="true" activiti:class="com.example.ExternalApiService"/>
      <bpmn:sequenceFlow id="f1" sourceRef="start" targetRef="externalApi"/>
    </bpmn:process>`,
    expect: {
      externalApi: ['async true', 'class com.example.ExternalApiService'],
    },
  },
  {
    name: 'delegateExpression + fields/listeners in extensionElements',
    xml: `<bpmn:process xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:activiti="http://activiti.org/bpmn" id="p2">
      <bpmn:serviceTask id="orderService" activiti:class="com.example.OrderService">
        <bpmn:extensionElements>
          <activiti:field name="currency" expression="\${order.currency}"/>
          <activiti:executionListener event="start" class="com.example.StartTracker"/>
        </bpmn:extensionElements>
      </bpmn:serviceTask>
      <bpmn:serviceTask id="legacyBeanTask" activiti:delegateExpression="\${paymentService}"/>
    </bpmn:process>`,
    expect: {
      orderService: [
        'class com.example.OrderService',
        'field expression="${order.currency}" name="currency"',
        'executionListener event="start" class="com.example.StartTracker"',
      ],
      legacyBeanTask: ['delegateExpression ${paymentService}'],
    },
  },
  {
    name: 'sequence flows: conditionExpression + bare skipExpression (default ns)',
    xml: `<process xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" id="p3">
      <sequenceFlow id="flowYes" sourceRef="gw" targetRef="a">
        <conditionExpression>\${approved == true}</conditionExpression>
      </sequenceFlow>
      <sequenceFlow id="flowSkip" sourceRef="a" targetRef="b" skipExpression="\${skipThisPath}"/>
      <sequenceFlow id="flowPlain" sourceRef="b" targetRef="c"/>
    </process>`,
    expect: {
      flowYes: ['conditionExpression ${approved == true}'],
      flowSkip: ['skipExpression ${skipThisPath}'],
    },
  },
  {
    name: 'user task: assignee/formKey attrs + formProperty child',
    xml: `<bpmn:process xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:activiti="http://activiti.org/bpmn" id="p4">
      <bpmn:userTask id="task1" activiti:assignee="\${managerId}" activiti:formKey="approval-form">
        <bpmn:extensionElements>
          <activiti:formProperty id="comment" type="string"/>
        </bpmn:extensionElements>
      </bpmn:userTask>
    </bpmn:process>`,
    expect: {
      task1: [
        'assignee ${managerId}',
        'formKey approval-form',
        'formProperty id="comment" type="string"',
      ],
    },
  },
  {
    name: 'web service task: bare implementation + operationRef',
    xml: `<serviceTask id="callExternalApi" name="Call External Web Service"
        implementation="##WebService" operationRef="sendOrderOperation"/>`,
    expect: {
      callExternalApi: [
        'implementation ##WebService',
        'operationRef sendOrderOperation',
      ],
    },
  },
  {
    name: 'task-listeners overview: undeclared activiti: prefix, 3 listeners',
    xml: `<userTask id="approvalTask" name="Approval">
  <extensionElements>
    <activiti:taskListener
      event="create"
      class="com.example.TaskCreatedListener"
      onTransaction="before-commit"
      customPropertiesResolverClass="com.example.Resolver"/>
    <activiti:taskListener
      event="assignment"
      delegateExpression="\${assignmentListener}"
      onTransaction="committed"
      customPropertiesResolverDelegateExpression="\${resolverDelegate}"/>
    <activiti:taskListener
      event="complete"
      class="com.example.TaskCompletedListener"
      onTransaction="rolled-back"
      customPropertiesResolverExpression="\${resolverExpression}"/>
  </extensionElements>
</userTask>`,
    expect: {
      approvalTask: [
        'taskListener event="create" class="com.example.TaskCreatedListener"',
        'taskListener event="assignment" delegateExpression="${assignmentListener}"',
        'taskListener event="complete" class="com.example.TaskCompletedListener"',
      ],
    },
  },
  {
    name: 'undeclared prefix + xml declaration prolog',
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<scriptTask id="calc" name="Calculate" activiti:scriptFormat="groovy" activiti:script="total = 1"/>`,
    expect: {
      calc: ['scriptFormat groovy', 'script total = 1'],
    },
  },
];

for (const {name, xml, expect: expected} of FIXTURES) {
  test(name, () => {
    const map = extractActivitiProperties(xml);
    const got = new Map<string, string[]>(
      [...map.entries()].map(([id, props]) => [
        id,
        props.map((p) => (p.value != null ? `${p.label} ${p.value}` : p.label)),
      ]),
    );
    expect(got).toEqual(new Map(Object.entries(expected)));
  });
}

// ---------------------------------------------------------------------------
// toRenderableBpmn: sub-process interiors must end up in the generated DI.
// bpmn-js walks the *semantic* tree and looks DI up by id, and bpmn-moddle
// rejects DI shapes nested inside other DI shapes — so every shape/edge
// (including sub-process interiors) must be a direct child of the plane.
// diagram-js renders every shape at its raw dc:Bounds in the single plane
// coordinate system (the `djs-children` grouping carries no parent offset),
// so interior bounds must be ABSOLUTE plane coordinates, shifted by the
// sub-process's own position.
// ---------------------------------------------------------------------------

const BASIC_SUBPROCESS_XML = `<process id="orderProcess" name="Order Process">
  <startEvent id="start"/>
  <subProcess id="processOrder" name="Process Order">
    <startEvent id="subStart"/>
    <userTask id="reviewTask" name="Review Order"/>
    <serviceTask id="validateTask" name="Validate Order"/>
    <endEvent id="subEnd"/>
  </subProcess>
  <endEvent id="end"/>
  <sequenceFlow id="flow1" sourceRef="start" targetRef="processOrder"/>
  <sequenceFlow id="flow2" sourceRef="processOrder" targetRef="end"/>
</process>`;

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function parseDoc(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.getElementsByTagName('parsererror').length).toBe(0);
  return doc;
}

function shapeById(doc: Document, id: string): Element {
  const shape = Array.from(doc.getElementsByTagName('*')).find(
    (el) => el.localName === 'BPMNShape' && el.getAttribute('bpmnElement') === id,
  );
  expect(shape, `BPMNShape for ${id}`).toBeTruthy();
  return shape as Element;
}

function boundsOf(el: Element): Bounds {
  const b = Array.from(el.children).find((c) => c.localName === 'Bounds');
  expect(b, `dc:Bounds of ${el.getAttribute('id')}`).toBeTruthy();
  return {
    x: Number(b!.getAttribute('x')),
    y: Number(b!.getAttribute('y')),
    width: Number(b!.getAttribute('width')),
    height: Number(b!.getAttribute('height')),
  };
}

test('sub-process interior DI is plane-level and parses without warnings', async () => {
  const out = await toRenderableBpmn(BASIC_SUBPROCESS_XML);
  const {BpmnModdle} = await import('bpmn-moddle');
  const {rootElement, warnings} = await new (BpmnModdle as any)().fromXML(out);
  expect(warnings).toEqual([]);
  const ids = (rootElement.diagrams[0].plane.planeElement as any[])
    .map((e) => e.bpmnElement.id)
    .sort();
  expect(ids).toEqual(
    [
      'start',
      'processOrder',
      'subStart',
      'reviewTask',
      'validateTask',
      'subEnd',
      'end',
      'flow1',
      'flow2',
    ].sort(),
  );
});

// bpmn-js only paints the exclusive gateway's X marker when the DI shape
// carries isMarkerVisible="true" (its modeler writes it on creation); the
// moddle descriptor defines no default, so a bare BPMNShape renders as a
// plain diamond. The generated DI must set it for exclusive gateways.
test('exclusive gateway DI carries isMarkerVisible so the X marker renders', async () => {
  const xml = `<process id="p" name="P">
    <startEvent id="start"/>
    <exclusiveGateway id="decision" name="Decision"/>
    <endEvent id="end"/>
    <sequenceFlow id="f1" sourceRef="start" targetRef="decision"/>
    <sequenceFlow id="f2" sourceRef="decision" targetRef="end"/>
  </process>`;
  const out = await toRenderableBpmn(xml);
  const doc = parseDoc(out);
  expect(shapeById(doc, 'decision').getAttribute('isMarkerVisible')).toBe('true');
  expect(shapeById(doc, 'start').getAttribute('isMarkerVisible')).toBeNull();
  // The renderer reads the flag through bpmn-moddle, so verify it there too.
  const {BpmnModdle} = await import('bpmn-moddle');
  const {rootElement, warnings} = await new (BpmnModdle as any)().fromXML(out);
  expect(warnings).toEqual([]);
  const shape = (rootElement.diagrams[0].plane.planeElement as any[]).find(
    (e) => e.bpmnElement.id === 'decision',
  );
  expect(shape.get('isMarkerVisible')).toBe(true);
});

test('sub-process interior coordinates are absolute and fit inside the box', async () => {
  const out = await toRenderableBpmn(BASIC_SUBPROCESS_XML);
  const doc = parseDoc(out);
  const sp = shapeById(doc, 'processOrder');
  expect(sp.getAttribute('isExpanded')).toBe('true');
  const spB = boundsOf(sp);
  expect(spB.width).toBeGreaterThanOrEqual(250);
  expect(spB.height).toBeGreaterThanOrEqual(140);
  for (const id of ['subStart', 'reviewTask', 'validateTask', 'subEnd']) {
    const b = boundsOf(shapeById(doc, id));
    expect(b.x, `${id}.x`).toBeGreaterThanOrEqual(spB.x + 20);
    expect(b.y, `${id}.y`).toBeGreaterThanOrEqual(spB.y + 30);
    expect(
      b.x + b.width,
      `${id} right edge`,
    ).toBeLessThanOrEqual(spB.x + spB.width - 20);
    expect(
      b.y + b.height,
      `${id} bottom edge`,
    ).toBeLessThanOrEqual(spB.y + spB.height - 20);
  }
  // No DI element may be nested inside another (bpmn-moddle drops it).
  const plane = Array.from(doc.getElementsByTagName('*')).find(
    (el) => el.localName === 'BPMNPlane',
  )!;
  for (const child of Array.from(plane.children)) {
    expect(
      Array.from(child.children).some(
        (c) => c.localName === 'BPMNShape' || c.localName === 'BPMNEdge',
      ),
      `nested DI under ${child.getAttribute('id')}`,
    ).toBe(false);
  }
});

test('nested sub-processes are laid out at every depth', async () => {
  const xml = `<process id="p" name="P">
    <startEvent id="start"/>
    <sequenceFlow id="f1" sourceRef="start" targetRef="outer"/>
    <subProcess id="outer" name="Outer">
      <startEvent id="outerStart"/>
      <sequenceFlow id="o1" sourceRef="outerStart" targetRef="inner"/>
      <subProcess id="inner" name="Inner">
        <startEvent id="innerStart"/>
        <sequenceFlow id="i1" sourceRef="innerStart" targetRef="innerTask"/>
        <userTask id="innerTask" name="Inner Task"/>
      </subProcess>
      <sequenceFlow id="o2" sourceRef="inner" targetRef="outerEnd"/>
      <endEvent id="outerEnd"/>
    </subProcess>
    <sequenceFlow id="f2" sourceRef="outer" targetRef="end"/>
    <endEvent id="end"/>
  </process>`;
  const out = await toRenderableBpmn(xml);
  const {BpmnModdle} = await import('bpmn-moddle');
  const {warnings} = await new (BpmnModdle as any)().fromXML(out);
  expect(warnings).toEqual([]);

  const doc = parseDoc(out);
  const outerB = boundsOf(shapeById(doc, 'outer'));
  const innerB = boundsOf(shapeById(doc, 'inner'));
  const taskB = boundsOf(shapeById(doc, 'innerTask'));
  // inner sits inside outer, innerTask inside inner (absolute coordinates).
  expect(innerB.x).toBeGreaterThanOrEqual(outerB.x + 20);
  expect(innerB.y).toBeGreaterThanOrEqual(outerB.y + 30);
  expect(innerB.x + innerB.width).toBeLessThanOrEqual(outerB.x + outerB.width - 20);
  expect(innerB.y + innerB.height).toBeLessThanOrEqual(outerB.y + outerB.height - 20);
  expect(taskB.x).toBeGreaterThanOrEqual(innerB.x + 20);
  expect(taskB.y).toBeGreaterThanOrEqual(innerB.y + 30);
  expect(taskB.x + taskB.width).toBeLessThanOrEqual(innerB.x + innerB.width - 20);
  expect(taskB.y + taskB.height).toBeLessThanOrEqual(innerB.y + innerB.height - 20);
});

test('ad-hoc sub-process interiors are laid out too', async () => {
  const xml = `<process id="p" name="P">
    <startEvent id="start"/>
    <sequenceFlow id="f1" sourceRef="start" targetRef="adhoc"/>
    <adHocSubProcess id="adhoc" name="Ad Hoc">
      <startEvent id="adhocStart"/>
      <sequenceFlow id="a1" sourceRef="adhocStart" targetRef="adhocTask"/>
      <userTask id="adhocTask" name="Ad Hoc Task"/>
      <endEvent id="adhocEnd"/>
    </adHocSubProcess>
    <sequenceFlow id="f2" sourceRef="adhoc" targetRef="end"/>
    <endEvent id="end"/>
  </process>`;
  const out = await toRenderableBpmn(xml);
  const doc = parseDoc(out);
  const adhoc = shapeById(doc, 'adhoc');
  expect(adhoc.getAttribute('isExpanded')).toBe('true');
  const b = boundsOf(shapeById(doc, 'adhocTask'));
  const box = boundsOf(adhoc);
  expect(b.x, 'adhocTask.x').toBeGreaterThanOrEqual(box.x + 20);
  expect(b.y, 'adhocTask.y').toBeGreaterThanOrEqual(box.y + 30);
  expect(b.x + b.width, 'right edge').toBeLessThanOrEqual(box.x + box.width - 20);
  expect(b.y + b.height, 'bottom edge').toBeLessThanOrEqual(box.y + box.height - 20);
});

test('boundary events inside a sub-process stay within its bounds', async () => {
  const xml = `<process id="p" name="P">
    <startEvent id="start"/>
    <sequenceFlow id="f1" sourceRef="start" targetRef="sp"/>
    <subProcess id="sp" name="SP">
      <startEvent id="subStart"/>
      <sequenceFlow id="f2" sourceRef="subStart" targetRef="subTask"/>
      <userTask id="subTask" name="Sub Task"/>
      <boundaryEvent id="subTimeout" attachedToRef="subTask">
        <timerEventDefinition/>
      </boundaryEvent>
      <sequenceFlow id="f3" sourceRef="subTask" targetRef="subEnd"/>
      <endEvent id="subEnd"/>
    </subProcess>
    <sequenceFlow id="f4" sourceRef="sp" targetRef="end"/>
    <endEvent id="end"/>
  </process>`;
  const out = await toRenderableBpmn(xml);
  const {BpmnModdle} = await import('bpmn-moddle');
  const {warnings} = await new (BpmnModdle as any)().fromXML(out);
  expect(warnings).toEqual([]);
  const doc = parseDoc(out);
  const box = boundsOf(shapeById(doc, 'sp'));
  const b = boundsOf(shapeById(doc, 'subTimeout'));
  expect(b.x).toBeGreaterThanOrEqual(box.x);
  expect(b.y).toBeGreaterThanOrEqual(box.y);
  expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width);
  expect(b.y + b.height).toBeLessThanOrEqual(box.y + box.height);
});

test('sub-process without interior content renders collapsed', async () => {
  const xml = `<process id="p" name="P">
    <startEvent id="start"/>
    <subProcess id="empty" name="Empty"/>
    <sequenceFlow id="f" sourceRef="start" targetRef="empty"/>
  </process>`;
  const doc = parseDoc(await toRenderableBpmn(xml));
  expect(shapeById(doc, 'empty').getAttribute('isExpanded')).toBeNull();
});

test('dangling interior flow gets a placeholder task inside the sub-process', async () => {
  const xml = `<process id="p" name="P">
    <startEvent id="start"/>
    <sequenceFlow id="f1" sourceRef="start" targetRef="sp"/>
    <subProcess id="sp" name="SP">
      <startEvent id="subStart"/>
      <sequenceFlow id="f" sourceRef="subStart" targetRef="ghost"/>
    </subProcess>
  </process>`;
  const out = await toRenderableBpmn(xml);
  const doc = parseDoc(out);
  const spEl = Array.from(doc.getElementsByTagName('*')).find(
    (el) => el.localName === 'subProcess' && el.getAttribute('id') === 'sp',
  )!;
  expect(
    Array.from(spEl.children).some(
      (c) => c.localName === 'task' && c.getAttribute('id') === 'ghost',
    ),
  ).toBe(true);
  const {BpmnModdle} = await import('bpmn-moddle');
  const {warnings} = await new (BpmnModdle as any)().fromXML(out);
  expect(warnings).toEqual([]);
});

// jsdom lacks the SVG geometry APIs diagram-js/tiny-svg rely on; stub them
// just enough for a headless import (no layout/zooming is exercised).
function fakeSvgMatrix(): any {
  const m = {a: 1, b: 0, c: 0, d: 1, e: 0, f: 0};
  m.multiply = () => fakeSvgMatrix();
  m.translate = (x: number, y: number) => {
    const n = fakeSvgMatrix();
    n.e = x;
    n.f = y;
    return n;
  };
  m.scale = (s: number) => {
    const n = fakeSvgMatrix();
    n.a = s;
    n.d = s;
    return n;
  };
  m.inverse = () => fakeSvgMatrix();
  return m;
}

function fakeSvgTransform(): any {
  const t: any = {matrix: fakeSvgMatrix()};
  t.setTranslate = (x: number, y: number) => {
    t.matrix = fakeSvgMatrix();
    t.matrix.e = x;
    t.matrix.f = y;
  };
  t.setRotate = () => {
    t.matrix = fakeSvgMatrix();
  };
  t.setScale = (s: number) => {
    t.matrix = fakeSvgMatrix();
    t.matrix.a = s;
    t.matrix.d = s;
  };
  return t;
}

function installSvgPolyfills(): void {
  if (typeof (globalThis as any).SVGMatrix === 'undefined') {
    (globalThis as any).SVGMatrix = class SVGMatrix {};
  }
  const svgProto = SVGElement.prototype as any;
  svgProto.getBBox = () => ({x: 0, y: 0, width: 0, height: 0});
  svgProto.getCTM = () => fakeSvgMatrix();
  svgProto.getScreenCTM = () => fakeSvgMatrix();
  Object.defineProperty(svgProto, 'transform', {
    configurable: true,
    get: function () {
      return {
        baseVal: {
          consolidate: () => ({matrix: fakeSvgMatrix()}),
          clear: () => {},
          appendItem: (t: any) => t,
          createSVGTransformFromMatrix: (m: any) => ({matrix: m}),
        },
      };
    },
  });
  const rootProto = SVGSVGElement.prototype as any;
  rootProto.createSVGMatrix = fakeSvgMatrix;
  rootProto.createSVGTransform = fakeSvgTransform;
  rootProto.createSVGPoint = () => ({
    x: 0,
    y: 0,
    matrixTransform: (m: any) => ({x: m.e ?? 0, y: m.f ?? 0}),
  });
}

test('bpmn-js renders the interior with the sub-process as parent', async () => {
  installSvgPolyfills();
  const finalXml = await toRenderableBpmn(BASIC_SUBPROCESS_XML);
  const {default: NavigatedViewer} = await import('bpmn-js/lib/NavigatedViewer');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const viewer = new (NavigatedViewer as any)({container});
  try {
    const {warnings} = (await viewer.importXML(finalXml)) as {
      warnings: unknown[];
    };
    expect(warnings).toEqual([]);
    const registry = viewer.get('elementRegistry') as {
      get: (id: string) => {id: string; parent?: {id: string}} | null;
    };
    for (const id of [
      'start',
      'processOrder',
      'subStart',
      'reviewTask',
      'validateTask',
      'subEnd',
      'end',
      'flow1',
      'flow2',
    ]) {
      expect(registry.get(id), `${id} not rendered`).toBeTruthy();
    }
    expect(registry.get('reviewTask')!.parent?.id).toBe('processOrder');
  } finally {
    viewer.destroy();
  }
});

// ---------------------------------------------------------------------------
// Event sub-processes (<subProcess triggeredByEvent="true">) must behave
// exactly like regular sub-processes: expanded, scaled to their interior,
// and the interior parented to the sub-process rather than the plane. The
// doc examples carry `activiti:` attributes without a namespace declaration,
// so they exercise the wrap-fragment fallback parse path as well.
// ---------------------------------------------------------------------------

const EVENT_SUBPROCESS_XML = `<process id="errorDrivenProcess" name="Error-Driven Process">
  <startEvent id="start"/>
  <serviceTask id="task1" name="Risky Task" activiti:class="com.example.RiskyService"/>
  <endEvent id="end"/>

  <subProcess id="errorHandler" triggeredByEvent="true">
    <startEvent id="errorStart" isInterrupting="true">
      <errorEventDefinition errorCode="APP001"/>
    </startEvent>
    <userTask id="handleError" name="Handle Error"/>
    <endEvent id="errorEnd"/>

    <sequenceFlow id="errorFlow1" sourceRef="errorStart" targetRef="handleError"/>
    <sequenceFlow id="errorFlow2" sourceRef="handleError" targetRef="errorEnd"/>
  </subProcess>

  <sequenceFlow id="flow1" sourceRef="start" targetRef="task1"/>
  <sequenceFlow id="flow2" sourceRef="task1" targetRef="end"/>
</process>`;

test('event sub-process box is expanded and scaled to its interior', async () => {
  const out = await toRenderableBpmn(EVENT_SUBPROCESS_XML);
  const doc = parseDoc(out);
  const sp = shapeById(doc, 'errorHandler');
  expect(sp.getAttribute('isExpanded')).toBe('true');
  const spB = boundsOf(sp);
  expect(spB.width).toBeGreaterThanOrEqual(250);
  expect(spB.height).toBeGreaterThanOrEqual(140);
  for (const id of ['errorStart', 'handleError', 'errorEnd']) {
    const b = boundsOf(shapeById(doc, id));
    expect(b.x, `${id}.x`).toBeGreaterThanOrEqual(spB.x + 20);
    expect(b.y, `${id}.y`).toBeGreaterThanOrEqual(spB.y + 30);
    expect(
      b.x + b.width,
      `${id} right edge`,
    ).toBeLessThanOrEqual(spB.x + spB.width - 20);
    expect(
      b.y + b.height,
      `${id} bottom edge`,
    ).toBeLessThanOrEqual(spB.y + spB.height - 20);
  }
});

test('event sub-process interiors import with the sub-process as parent', async () => {
  installSvgPolyfills();
  const finalXml = await toRenderableBpmn(EVENT_SUBPROCESS_XML);
  const {default: NavigatedViewer} = await import('bpmn-js/lib/NavigatedViewer');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const viewer = new (NavigatedViewer as any)({container});
  try {
    await viewer.importXML(finalXml);
    const registry = viewer.get('elementRegistry') as {
      get: (id: string) => {
        id: string;
        parent?: {id: string} | null;
        collapsed?: boolean;
        hidden?: boolean;
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      } | null;
    };
    for (const id of [
      'start',
      'task1',
      'end',
      'errorHandler',
      'errorStart',
      'handleError',
      'errorEnd',
      'errorFlow1',
      'errorFlow2',
      'flow1',
      'flow2',
    ]) {
      expect(registry.get(id), `${id} not rendered`).toBeTruthy();
    }
    expect(registry.get('errorHandler')!.collapsed).toBe(false);
    const box = registry.get('errorHandler')!;
    for (const id of [
      'errorStart',
      'handleError',
      'errorEnd',
      'errorFlow1',
      'errorFlow2',
    ]) {
      const el = registry.get(id)!;
      expect(el.parent?.id, `${id} parent`).toBe('errorHandler');
      expect(el.hidden, `${id} hidden`).toBe(false);
    }
    // diagram-js renders raw x/y in plane space: the interior shapes must
    // land inside the sub-process's absolute bounds, not at the plane origin.
    for (const id of ['errorStart', 'handleError', 'errorEnd']) {
      const el = registry.get(id)!;
      expect(el.x, `${id}.x`).toBeGreaterThanOrEqual(box.x! + 20);
      expect(el.y, `${id}.y`).toBeGreaterThanOrEqual(box.y! + 30);
      expect(
        el.x! + el.width!,
        `${id} right edge`,
      ).toBeLessThanOrEqual(box.x! + box.width! - 20);
      expect(
        el.y! + el.height!,
        `${id} bottom edge`,
      ).toBeLessThanOrEqual(box.y! + box.height! - 20);
    }
  } finally {
    viewer.destroy();
  }
});

// The page's Overview example is a bare <subProcess triggeredByEvent> root
// (no <process> wrapper) — it must render as an expanded event sub-process
// with its interior, via the synthetic-fragment-process path.
const EVENT_SUBPROCESS_FRAGMENT_XML = `<subProcess id="errorHandler" triggeredByEvent="true">
  <startEvent id="errorStart">
    <errorEventDefinition errorRef="Error001"/>
  </startEvent>
  <userTask id="handleError" name="Handle Error"/>
  <endEvent id="errorEnd"/>
  <sequenceFlow id="flow1" sourceRef="errorStart" targetRef="handleError"/>
  <sequenceFlow id="flow2" sourceRef="handleError" targetRef="errorEnd"/>
</subProcess>`;

test('bare event sub-process fragment renders with its interior', async () => {
  installSvgPolyfills();
  const finalXml = await toRenderableBpmn(EVENT_SUBPROCESS_FRAGMENT_XML);
  const {default: NavigatedViewer} = await import('bpmn-js/lib/NavigatedViewer');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const viewer = new (NavigatedViewer as any)({container});
  try {
    await viewer.importXML(finalXml);
    const registry = viewer.get('elementRegistry') as {
      get: (id: string) => {
        id: string;
        parent?: {id: string} | null;
        collapsed?: boolean;
      } | null;
    };
    for (const id of [
      'errorHandler',
      'errorStart',
      'handleError',
      'errorEnd',
      'flow1',
      'flow2',
    ]) {
      expect(registry.get(id), `${id} not rendered`).toBeTruthy();
    }
    expect(registry.get('errorHandler')!.collapsed).toBe(false);
    expect(registry.get('handleError')!.parent?.id).toBe('errorHandler');
  } finally {
    viewer.destroy();
  }
});
