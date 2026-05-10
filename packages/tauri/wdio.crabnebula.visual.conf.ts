import type { Options } from '@wdio/types';
import { config as base } from './wdio.crabnebula.conf.ts';

export const config: Options.Testrunner = {
  ...base,
  specs: ['./test/visual/**/*.spec.ts'],
  exclude: [],
};
