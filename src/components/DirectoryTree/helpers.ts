import { type ReactNode, type ReactElement, Children } from 'react';

export type ChainResult = {
  names: string[];
  remainingChildren: ReactNode[];
};

interface DirProps {
  name: string;
  children: ReactNode;
}

interface DirElement extends ReactElement {
  props: DirProps;
}

function isDirElement(node: ReactNode): node is DirElement {
  if (typeof node !== 'object' || node === null || !('$$typeof' in node)) return false;
  const el = node as ReactElement;
  return (
    typeof el.props === 'object' &&
    el.props !== null &&
    'name' in el.props &&
    'children' in el.props
  );
}

export function collectChain(name: string, children: ReactNode): ChainResult {
  const arr = Children.toArray(children);

  if (arr.length !== 1 || !isDirElement(arr[0])) {
    return { names: [name], remainingChildren: arr };
  }

  const inner = collectChain(arr[0].props.name, arr[0].props.children);
  return { names: [name, ...inner.names], remainingChildren: inner.remainingChildren };
}
