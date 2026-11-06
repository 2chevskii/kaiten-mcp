import {defineConfig} from 'vitepress';
import {fileURLToPath} from 'node:url';

const repository = 'https://github.com/2chevskii/kaiten-mcp';
const base = '/kaiten-mcp/';

export default defineConfig({
  title: 'Kaiten MCP',
  description: 'Connect your AI assistant to Kaiten cards and workflows.',
  base,
  cleanUrls: true,
  appearance: 'dark',
  head: [['link', {rel: 'icon', type: 'image/png', href: `${base}icon.png`}]],
  vite: {
    publicDir: fileURLToPath(new URL('../../assets', import.meta.url)),
  },
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          {text: 'Guide', link: '/guide'},
          {text: 'Workflows', link: '/workflows'},
          {text: 'Tools', link: '/tools'},
        ],
        sidebar: [
          {
            text: 'Guide',
            items: [
              {text: 'Installation', link: '/guide'},
              {text: 'Workflows', link: '/workflows'},
              {text: 'Tool reference', link: '/tools'},
              {text: 'Advanced client operations', link: '/api'},
              {text: 'Troubleshooting', link: '/troubleshooting'},
            ],
          },
          {
            text: 'Contributing',
            items: [
              {text: 'Development', link: '/development'},
              {text: 'CI/CD and releases', link: '/releasing'},
            ],
          },
        ],
        outline: {level: [2, 3], label: 'On this page'},
        editLink: {
          pattern: `${repository}/edit/master/docs/:path`,
          text: 'Edit this page on GitHub',
        },
        footer: {message: 'Released under the MIT License.'},
      },
    },
    ru: {
      label: 'Русский',
      lang: 'ru',
      description:
        'Подключите AI-ассистента к карточкам и рабочим процессам Kaiten.',
      themeConfig: {
        nav: [
          {text: 'Руководство', link: '/ru/guide'},
          {text: 'Сценарии', link: '/ru/workflows'},
          {text: 'Инструменты', link: '/ru/tools'},
        ],
        sidebar: [
          {
            text: 'Руководство',
            items: [
              {text: 'Установка', link: '/ru/guide'},
              {text: 'Сценарии', link: '/ru/workflows'},
              {text: 'Справочник инструментов', link: '/ru/tools'},
              {text: 'Расширенные операции клиента', link: '/ru/api'},
              {text: 'Решение проблем', link: '/ru/troubleshooting'},
            ],
          },
          {
            text: 'Участие в разработке',
            items: [
              {text: 'Разработка', link: '/ru/development'},
              {text: 'CI/CD и релизы', link: '/ru/releasing'},
            ],
          },
        ],
        outline: {level: [2, 3], label: 'На этой странице'},
        editLink: {
          pattern: `${repository}/edit/master/docs/:path`,
          text: 'Редактировать на GitHub',
        },
        docFooter: {prev: 'Предыдущая страница', next: 'Следующая страница'},
        darkModeSwitchLabel: 'Оформление',
        lightModeSwitchTitle: 'Светлая тема',
        darkModeSwitchTitle: 'Тёмная тема',
        sidebarMenuLabel: 'Меню',
        returnToTopLabel: 'Наверх',
        langMenuLabel: 'Выбрать язык',
        footer: {message: 'Распространяется по лицензии MIT.'},
      },
    },
  },
  themeConfig: {
    logo: '/icon.png',
    socialLinks: [{icon: 'github', link: repository}],
    search: {
      provider: 'local',
      options: {
        locales: {
          ru: {
            translations: {
              button: {buttonText: 'Поиск', buttonAriaLabel: 'Поиск'},
              modal: {
                displayDetails: 'Показать подробности',
                resetButtonTitle: 'Сбросить поиск',
                backButtonTitle: 'Закрыть поиск',
                noResultsText: 'Ничего не найдено по запросу',
                footer: {
                  selectText: 'выбрать',
                  navigateText: 'перейти',
                  closeText: 'закрыть',
                },
              },
            },
          },
        },
      },
    },
  },
});
