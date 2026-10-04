import pino from 'pino';

export const logger = pino(
  {
    name: 'kaiten-mcp',
    level: 'info',
  },
  pino.destination({dest: 2, sync: true}),
);
