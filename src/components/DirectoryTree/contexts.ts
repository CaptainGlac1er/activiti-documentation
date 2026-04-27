import { createContext } from 'react';

export const ExpandAllContext = createContext(false);
export const DotWalkContext = createContext(true);
export const DepthContext = createContext(0);
export const ShowFirstContext = createContext<number | null>(null);
