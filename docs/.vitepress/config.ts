import {defineConfig} from 'vitepress';

export default defineConfig({
  title: 'Kaiten MCP',
  description: 'Local MCP server for Kaiten',
  cleanUrls: true,
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          {text: 'Guide', link: '/guide'},
          {text: 'Tools', link: '/tools'},
        ],
      },
    },
    ru: {
      label: 'Русский',
      lang: 'ru',
      themeConfig: {
        nav: [
          {text: 'Руководство', link: '/ru/guide'},
          {text: 'Инструменты', link: '/ru/tools'},
        ],
      },
    },
  },
  themeConfig: {search: {provider: 'local'}},
});
