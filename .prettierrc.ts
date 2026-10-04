import type {Config} from 'prettier';

const config: Config = {
  printWidth: 80,
  arrowParens: 'avoid',
  bracketSpacing: false,
  checkIgnorePragma: true,
  endOfLine: 'lf',
  semi: true,
  singleQuote: true,
  useTabs: false,
  trailingComma: 'all',
};

export default config;
