/**
 * @vitest-environment jsdom
 *
 * Tests for extractActivitiProperties() in bpmnLayout.ts — the detection
 * logic behind the property indicators in the BPMN diagram viewer.
 *
 * The jsdom environment provides a spec-compliant DOMParser, so the function
 * under test sees the same DOM shapes (namespaceURIs, localNames,
 * parsererror behavior) as in the browser.
 *
 * Run with `npm test`.
 */
import {expect, test} from 'vitest';
import {extractActivitiProperties} from './bpmnLayout';

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
