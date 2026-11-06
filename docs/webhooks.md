# Incoming card webhooks

`sendCardWebhook` in `kaiten_cards_write` calls the public client's incoming
webhook helper. It creates a card through an existing Kaiten webhook URL.
The total remains 18 tools.

Arguments are `webhook_url` and `body`. The body requires `title` and supports
`description`, `asap`, `due_date`, `owner_id`, `links` (each with `url` and
optional nullable `description`), `members`, `tags` and `properties`. Fields
retain native names and JSON values. Kaiten validates routing and payload rules.
The complete card JSON is returned in `{result}`.

The URL must use HTTPS without embedded credentials; HTTP loopback is allowed
for local integrations. The Kaiten API token is never sent to this URL, and
redirects are not followed. The webhook URL itself is a secret: store it in your
integration's secret storage and avoid sharing tool transcripts containing it.
The normal timeout, cancellation and sanitized HTTP errors apply, without write
retries. Outgoing event definitions exported by the client are TypeScript types;
the package does not provide a webhook listener or subscription service.

```json
{
  "request": {
    "operation": "sendCardWebhook",
    "args": {
      "webhook_url": "https://your-company.kaiten.ru/your-configured-webhook-path",
      "body": {"title": "Integration task", "asap": false, "tags": ["Backend"]}
    }
  }
}
```

Replace the example URL with the incoming webhook URL supplied by your Kaiten
instance; this example does not prescribe an endpoint path.
