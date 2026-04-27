import { type ReactNode, type ReactElement, Children } from 'react';

export type ChainResult = {
  names: string[];
  remainingChildren: ReactNode[];
};

function isDirElement(el: ReactElement): boolean {
  return el.props?.children != null;
}

export function collectChain(name: string, children: ReactNode): ChainResult {
  const arr = Children.toArray(children) as ReactElement[];

  if (arr.length !== 1 || !isDirElement(arr[0])) {
    return { names: [name], remainingChildren: arr };
  }

  const inner = collectChain(arr[0].props.name, arr[0].props.children);
  return { names: [name, ...inner.names], remainingChildren: inner.remainingChildren };
}
