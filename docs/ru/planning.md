# Итерации и прежние спринты

## Добавление и перенос карточек

В `kaiten_workflows_write` выберите `add_iteration_member`. Передайте
`space_uid`, `iteration_id` и либо `card_uid` для одной карточки, либо
`card_uids` для пакета из 1–500 уникальных UUID. ID итерации вернёт
`list_iterations`. UUID карточки находится в `result.uid` ответа на `get_card`
с `format: "full"` в `kaiten_cards_read`.

В запланированную или активную итерацию можно добавить активные карточки с
основных досок пространства. Если карточка уже участвует в другой
запланированной или активной итерации, Kaiten переносит её в целевую итерацию.

Запрос с `card_uid` возвращает одну запись участия. Для запроса с `card_uids`
в `result` приходят четыре массива.

- `added` содержит новые записи участия в целевой итерации.
- `removed` содержит записи участия, удалённые из прежних итераций при переносе.
- `skipped` содержит уже существующие записи участия в целевой итерации.
- `ineligible` содержит UUID карточек, которые перестали подходить во время выполнения.

До первой записи Kaiten проверяет ограничения на добавление и удаление из
исходной активной итерации для всего пакета. При отказе по ограничению пакет
целиком отклоняется. Во время выполнения Kaiten записывает транзакции до 100
карточек. Если одна из них завершится ошибкой, предыдущие могут уже сохраниться.
Перед повтором проверьте текущее участие с помощью
`list_iteration_memberships` и историю карточек с помощью
`list_card_iteration_history`.

[API добавления](https://developers.kaiten.ru/iterations/add-card-to-iteration)

## Прежний профиль

Эти [расширенные операции](./api.md) используют `kaiten_navigation_read` и
`kaiten_navigation_write`; общее число остаётся равным 20. Полный JSON-ответ
клиента сохраняется в `{result}`.

| Операция                              | Аргументы                               | Поведение                                                                  |
| ------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `iterations.createIteration`          | `space_uid`, `body`                     | Создание: `title`, необязательные nullable-цель/даты начала и окончания    |
| `iterations.getIteration`             | `space_uid`, `id`                       | Чтение итерации                                                            |
| `iterations.retrieveListOfIterations` | `space_uid`, `query?`                   | Фильтры состояния, данных, порядка и offset-страницы                       |
| `iterations.updateIteration`          | `space_uid`, `id`, `body`               | Изменение заголовка, цели, состояния, дат и необязательной итерации-замены |
| `iterations.deleteIteration`          | `space_uid`, `id`, `new_iteration_id?`  | Удаление с необязательной заменой                                          |
| `iterations.addCardToIteration`       | `space_uid`, `iteration_id`, `card_uid` | Добавление связи с карточкой                                               |
| `iterations.retrieveCardsInIteration` | `space_uid`, `iteration_id`, `status?`  | Записи участия, а не полные карточки                                       |
| `iterations.removeCardFromIteration`  | `space_uid`, `iteration_id`, `uid`      | Удаление участия карточки                                                  |
| `iterations.getCardIterationsHistory` | `card_uid`, `with_details?`             | История участия                                                            |
| `sprints.getSprintSummary`            | `id`, `exclude_deleted_cards?`          | Чтение сводки прежнего спринта                                             |
| `sprints.getSprintsList`              | `active?`, `limit?`, `offset?`          | Список прежних спринтов                                                    |

ID итераций — строки, прежних спринтов — числа. Итерации должны быть включены
для компании; API помечен upstream как beta. Kaiten проверяет доступ к
пространству, активность карточек на основных досках и переходы `planned` →
`active` → `closed`; из закрытой итерации нельзя удалять карточки. Удаление
итерации также удаляет связи с карточками, которые нельзя восстановить этим API.

Изменение требует хотя бы одно из заголовка, цели, состояния, даты начала или
окончания; `actual_finish_date` и `new_iteration_id` могут сопровождать их.
Пропущенные значения не добавляются, nullable-даты/цель/замена сохраняют явный
null. Удаление без замены не отправляет тело, а `new_iteration_id: null`
отправляет явный null. Даты и строковые флаги query, например `with_data`,
передаются без изменений. Следующие страницы не загружаются автоматически;
сохраняйте фильтры при изменении `offset`.

Закрытие итерации через `kaiten_navigation_write`:

```json
{
  "request": {
    "operation": "iterations.updateIteration",
    "args": {
      "space_uid": "space-uid",
      "id": "iteration-id",
      "body": {"status": "closed", "new_iteration_id": "next-iteration-id"}
    }
  }
}
```
