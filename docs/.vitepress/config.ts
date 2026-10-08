import {defineConfig} from 'vitepress';

const repository = 'https://github.com/2chevskii/kaiten-mcp';

export default defineConfig({
  title: 'Kaiten MCP',
  description: 'Connect your AI assistant to Kaiten cards and workflows.',
  base: process.env.VITEPRESS_BASE ?? '/',
  cleanUrls: true,
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          {text: 'Get started', link: '/guide'},
          {text: 'Workflows', link: '/workflows'},
          {text: 'Tools', link: '/tools'},
        ],
        sidebar: [
          {
            text: 'Using Kaiten MCP',
            items: [
              {text: 'Setup', link: '/guide'},
              {text: 'Workflows', link: '/workflows'},
              {text: 'Tool reference', link: '/tools'},
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
          {text: 'Начать работу', link: '/ru/guide'},
          {text: 'Сценарии', link: '/ru/workflows'},
          {text: 'Инструменты', link: '/ru/tools'},
        ],
        sidebar: [
          {
            text: 'Работа с Kaiten MCP',
            items: [
              {text: 'Подключение', link: '/ru/guide'},
              {text: 'Сценарии', link: '/ru/workflows'},
              {text: 'Справочник инструментов', link: '/ru/tools'},
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
