/**
 * @vitest-environment jsdom
 *
 * Tests for activitiInspector.ts — the bpmn-js plugin module that marks
 * elements carrying `activiti:` properties with a dot badge and a hover
 * marker. Like bpmnLayout.test.ts, the viewer tests run the real
 * NavigatedViewer in jsdom with a few SVG geometry stubs jsdom lacks.
 *
 * Run with `npm test`.
 */
import {expect, test, vi} from 'vitest';
import {
  activitiInspectorModule,
  badgePosition,
  PIN_EVENT,
  PROPS_HOVER_MARKER,
  PROPS_OVERLAY_TYPE,
} from './activitiInspector';
import {toRenderableBpmn} from './bpmnLayout';

const INSPECTOR_XML = `<process id="p" name="P" xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <startEvent id="start"/>
  <serviceTask id="tagTask" name="Tag Image" implementation="tagImageConnector"/>
  <userTask id="plainTask" name="Plain"/>
  <endEvent id="end"/>
  <sequenceFlow id="flow1" sourceRef="start" targetRef="tagTask"/>
  <sequenceFlow id="flowCond" sourceRef="tagTask" targetRef="end">
    <conditionExpression>\${approved}</conditionExpression>
  </sequenceFlow>
</process>`;

// jsdom lacks the SVG geometry APIs diagram-js/tiny-svg rely on; stub them
// just enough for a headless import (no layout/zooming is exercised).
// Kept in sync with bpmnLayout.test.ts.
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

interface OverlayRecord {
  id: string;
  type: string;
  element: {id: string} & Record<string, any>;
  position: Record<string, number | undefined>;
}

async function createViewerWithInspector(xml: string): Promise<any> {
  installSvgPolyfills();
  const finalXml = await toRenderableBpmn(xml);
  const {default: NavigatedViewer} = await import('bpmn-js/lib/NavigatedViewer');
  const container = document.createElement('div');
  document.body.appendChild(container);
  const viewer = new (NavigatedViewer as any)({
    container,
    additionalModules: [activitiInspectorModule(xml)],
  });
  await viewer.importXML(finalXml);
  return {viewer, container};
}

function badgeIds(viewer: any): string[] {
  return (viewer.get('overlays').get({type: PROPS_OVERLAY_TYPE}) as OverlayRecord[])
    .map((b) => b.element.id)
    .sort();
}

test('dot badges are added for exactly the elements carrying properties', async () => {
  const {viewer, container} = await createViewerWithInspector(INSPECTOR_XML);
  try {
    expect(badgeIds(viewer)).toEqual(['flowCond', 'tagTask']);
    // plain elements (plainTask, start, end, flow1) get no badge
    expect(container.querySelectorAll('.bpmn-activiti-props-dot').length).toBe(2);
    // overlays service wraps each badge in a typed container
    expect(
      container.querySelectorAll('.djs-overlay-activiti-props').length,
    ).toBe(2);
  } finally {
    viewer.destroy();
  }
});

test('badge position: shape top-right corner, connection polyline midpoint', async () => {
  const {viewer} = await createViewerWithInspector(INSPECTOR_XML);
  try {
    const overlays = viewer.get('overlays');
    const taskBadge = (
      overlays.get({type: PROPS_OVERLAY_TYPE, element: 'tagTask'}) as OverlayRecord[]
    )[0];
    // dot center 7px in from the top-right corner of the 12px badge
    expect(taskBadge.position).toEqual({top: 1, right: 13});

    const flow = viewer.get('elementRegistry').get('flowCond') as {
      waypoints: Array<{x: number; y: number}>;
    };
    const flowBadge = (
      overlays.get({type: PROPS_OVERLAY_TYPE, element: 'flowCond'}) as OverlayRecord[]
    )[0];
    // independently compute the expected midpoint of the polyline
    const pts = flow.waypoints;
    const lens = pts.slice(1).map(
      (p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y),
    );
    const total = lens.reduce((a, b) => a + b, 0);
    let remaining = total / 2;
    let mid = pts[pts.length - 1];
    for (let i = 0; i < lens.length; i += 1) {
      if (remaining <= lens[i]) {
        const t = lens[i] > 0 ? remaining / lens[i] : 0;
        mid = {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
        };
        break;
      }
      remaining -= lens[i];
    }
    const minX = Math.min(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    // the badge is centered on the midpoint, offsets relative to the
    // waypoint bounding box top-left
    expect(flowBadge.position.left).toBeCloseTo(mid.x - minX - 6, 6);
    expect(flowBadge.position.top).toBeCloseTo(mid.y - minY - 6, 6);
  } finally {
    viewer.destroy();
  }
});

test('hover adds the marker to property elements, element.out removes it', async () => {
  const {viewer} = await createViewerWithInspector(INSPECTOR_XML);
  try {
    const bus = viewer.get('eventBus');
    const canvas = viewer.get('canvas');
    const registry = viewer.get('elementRegistry');
    const task = registry.get('tagTask') as {
      id: string;
      markers?: Set<string>;
    };
    const plain = registry.get('plainTask') as {
      id: string;
      markers?: Set<string>;
    };

    bus.fire('element.hover', {element: task});
    expect(task.markers?.has(PROPS_HOVER_MARKER)).toBe(true);
    // the raw marker class lands on the element's SVG group
    expect(canvas.getGraphics('tagTask').getAttribute('class')).toContain(
      PROPS_HOVER_MARKER,
    );

    // elements without properties are untouched
    bus.fire('element.hover', {element: plain});
    expect(plain.markers?.has(PROPS_HOVER_MARKER)).toBe(false);

    bus.fire('element.out', {element: task});
    expect(task.markers?.has(PROPS_HOVER_MARKER)).toBe(false);
  } finally {
    viewer.destroy();
  }
});

test('does nothing when the diagram has no activiti properties', async () => {
  const xml = `<process id="p" name="P">
    <startEvent id="start"/>
    <endEvent id="end"/>
    <sequenceFlow id="f" sourceRef="start" targetRef="end"/>
  </process>`;
  const {viewer} = await createViewerWithInspector(xml);
  try {
    expect(badgeIds(viewer)).toEqual([]);
    const task = viewer.get('elementRegistry').get('start') as {
      id: string;
      markers?: Set<string>;
    };
    viewer.get('eventBus').fire('element.hover', {element: task});
    expect(task.markers?.has(PROPS_HOVER_MARKER)).toBe(false);
  } finally {
    viewer.destroy();
  }
});

function dotOf(container: HTMLElement, elementId: string): HTMLElement {
  // the per-element overlay container carries data-container-id
  const dot = container.querySelector(
    `[data-container-id="${elementId}"] .bpmn-activiti-props-dot`,
  );
  expect(dot, `dot badge for ${elementId}`).toBeTruthy();
  return dot as HTMLElement;
}

test('clicking a dot fires the pin event with the element and its position', async () => {
  const {viewer, container} = await createViewerWithInspector(INSPECTOR_XML);
  try {
    const bus = viewer.get('eventBus');
    const pinSpy = vi.fn();
    bus.on(PIN_EVENT, pinSpy);

    dotOf(container, 'tagTask').dispatchEvent(
      new MouseEvent('click', {bubbles: true}),
    );

    expect(pinSpy).toHaveBeenCalledTimes(1);
    const payload = pinSpy.mock.calls[0][0];
    expect(payload.element.id).toBe('tagTask');
    expect(typeof payload.x).toBe('number');
    expect(typeof payload.y).toBe('number');
  } finally {
    viewer.destroy();
  }
});

test('dot mouse events behave like hovering the underlying element', async () => {
  const {viewer, container} = await createViewerWithInspector(INSPECTOR_XML);
  try {
    const bus = viewer.get('eventBus');
    const hoverSpy = vi.fn();
    const moveSpy = vi.fn();
    const outSpy = vi.fn();
    bus.on('element.hover', hoverSpy);
    bus.on('element.mousemove', moveSpy);
    bus.on('element.out', outSpy);

    const dot = dotOf(container, 'tagTask');
    dot.dispatchEvent(new MouseEvent('mouseover', {bubbles: true}));
    expect(hoverSpy).toHaveBeenCalledTimes(1);
    expect(hoverSpy.mock.calls[0][0].element.id).toBe('tagTask');

    dot.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}));
    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(moveSpy.mock.calls[0][0].element.id).toBe('tagTask');

    dot.dispatchEvent(new MouseEvent('mouseout', {bubbles: true}));
    expect(outSpy).toHaveBeenCalledTimes(1);
    expect(outSpy.mock.calls[0][0].element.id).toBe('tagTask');
  } finally {
    viewer.destroy();
  }
});

test('badgePosition: shape corner and connection midpoint', () => {
  expect(
    badgePosition({id: 's', x: 10, y: 20, width: 100, height: 80}),
  ).toEqual({top: 1, right: 13});

  // straight line: midpoint, offsets from the waypoint bbox top-left
  expect(
    badgePosition({id: 'c', waypoints: [{x: 0, y: 0}, {x: 100, y: 0}]}),
  ).toEqual({left: 44, top: -6});

  // elbow: total length 40 + 80, midpoint 60 along the path -> (20, 40)
  expect(
    badgePosition({
      id: 'e',
      waypoints: [
        {x: 0, y: 0},
        {x: 0, y: 40},
        {x: 80, y: 40},
      ],
    }),
  ).toEqual({left: 14, top: 34});
});
