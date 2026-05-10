import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import VideoReporter from 'wdio-video-reporter';
import { asVideoConfig } from '../../wdio.video.shared.ts';
import { config as base } from './wdio.conf.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const config = asVideoConfig(
  base,
  join(__dirname, '__video__', process.platform, process.arch),
  VideoReporter,
);
