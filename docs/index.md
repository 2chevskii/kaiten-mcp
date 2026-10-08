---
layout: home
title: Kaiten MCP
hero:
  name: Kaiten MCP
  text: Your assistant, connected to Kaiten
  tagline: Find cards, read their context, and manage everyday work through 44 MCP tools. Runs locally with your company's API token.
  actions:
    - theme: brand
      text: Get started
      link: /guide
    - theme: alt
      text: Explore workflows
      link: /workflows
features:
  - title: Find the work that matters
    details: Browse spaces and boards, identify your user, and search by ownership, deadlines, tags or state.
    link: /workflows#find-my-active-cards
  - title: Read the whole conversation
    details: Fetch descriptions, comments and checklist items to understand a card before making changes.
    link: /workflows#understand-a-card
  - title: Keep tasks moving
    details: Create and move cards, manage members and tags, complete checklist items, and assign custom property values.
    link: /tools
---

## Start with a real task

After [connecting your MCP client](./guide.md), ask your assistant:

> Find my overdue cards on the Support board.
>
> Read this card and its comments, then summarize what is blocking it.
>
> Create a release card and add a checklist with these three tasks.

Your MCP client launches a local stdio process. The server sends requests to
Kaiten using the permissions of your API token. Each configured server uses one
company and one token; changes take effect when a tool is called.

Need help connecting? See [troubleshooting](./troubleshooting.md).
Contributing to the server? Start with [development](./development.md).
