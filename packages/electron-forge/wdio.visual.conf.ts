import { asVisualConfig } from '../../wdio.visual.shared.ts';
import { config as base } from './wdio.conf.ts';

export const config = asVisualConfig(base);
