# CI/CD и релизы

## Pull request и master

CI отдельными заданиями проверяет lint, форматирование, типы тестов, протокольные
тесты и сборку документации. Затем собирает версионированный `.tgz`, устанавливает
его с production-зависимостями во временный каталог и проверяет инициализацию MCP
и `tools/list`. Готовый архив загружается без ZIP-обёртки и публикуется.

| Источник                | Версия пакета                             | Тег registry |
| ----------------------- | ----------------------------------------- | ------------ |
| PR из этого репозитория | `<base>-<номер PR>-<7 символов head SHA>` | `pr-<номер>` |
| `master`                | `<base>-master-<7 символов SHA>`          | `edge`       |

Эти версии публикуются в GitHub Packages. PR из форков и от Dependabot проходят
проверки и получают архив без публикации. Для установки preview нужен доступ на
чтение GitHub Packages. Стабильные релизы MCP и закреплённая зависимость клиента
используют публичный npm. Документация из `master` публикуется в
[GitHub Pages](https://2chevskii.github.io/kaiten-mcp/).

## Настройка реестров

GitHub environments:

| Environment       | Назначение                                          | URL deployment                                                                     |
| ----------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npmjs`           | Staged publishing стабильных пакетов через npm OIDC | [Пакет npm](https://www.npmjs.com/package/@2chevskii/kaiten-mcp)                   |
| `github-packages` | Preview и стабильные пакеты через `GITHUB_TOKEN`    | [Пакет GitHub](https://github.com/users/2chevskii/packages/npm/package/kaiten-mcp) |
| `github-pages`    | Документация                                        | [Сайт](https://2chevskii.github.io/kaiten-mcp/)                                    |

Для `npmjs` разрешите deployments только из тегов `v*.*.*`. Источником сборки
Pages выберите GitHub Actions. URL пакетов задаются workflow при запуске заданий.

До запуска npm-задания настройте
[Trusted Publisher](https://docs.npmjs.com/trusted-publishers/) для
`@2chevskii/kaiten-mcp`:

- Провайдер: GitHub Actions.
- Владелец: `2chevskii`; репозиторий: `kaiten-mcp`.
- Имя workflow: `finish_release.yml`.
- Environment: `npmjs`.
- Разрешённое действие: `npm stage publish`.

Для настройки trust пакет должен уже существовать в npm. Новый пакет нужно
первоначально опубликовать из аккаунта сопровождающего, затем настроить OIDC.
Используйте отдельную начальную версию, чтобы целевая стабильная версия оставалась
свободной для release workflow.
Эта разовая настройка требует доступа к npm-аккаунту и 2FA. Секрет `NPM_TOKEN`
в репозитории не нужен. См. [требования npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/#prerequisites).

## Релиз

1. Одновременно обновите версию в package.json и lockfile. Откройте PR и слейте
   после успешного CI.
2. Поставьте на слитый коммит тег `v<версия package.json>` и отправьте его.
   `start_release.yml` проверит совпадение версии, запустит отдельные задания lint,
   форматирования, тестов и документации, затем соберёт и проверит установку пакета.
3. Проверьте созданный draft релиза и архив `2chevskii-kaiten-mcp-<версия>.tgz`.
   Когда всё готово, опубликуйте GitHub Release.
4. Автоматически запустится `finish_release.yml`. Независимые задания опубликуют
   тот же архив в GitHub Packages и загрузят в npm staging, оба с `--tag latest`.
5. В **Staged Packages** на npm проверьте и подтвердите версию через 2FA.
   Публичный npm-тег `latest` изменится после подтверждения.

У `finish_release.yml` нет ручного триггера. Если один registry недоступен,
перезапустите только упавшее задание исходного workflow run. Повторная публикация
уже успешно опубликованной неизменяемой версии во второй registry не требуется.

Локальная проверка стабильного архива после `npm ci`:

```sh
npm run check
npm pack
npm run package:check -- ./2chevskii-kaiten-mcp-1.0.0.tgz
```

Проверка пакета требует предварительной сборки и доступа к npm для установки
production-зависимостей. Установленный CLI запускается из временного каталога;
запросы к Kaiten не выполняются.
