<script setup>
import {computed, ref, watch} from 'vue';

const props = defineProps({
  origin: {type: String, required: true},
  token: {type: String, required: true},
  kind: {type: String, required: true},
  locale: {type: String, default: 'en'},
});
const copied = ref(false);
const failed = ref(false);
const code = computed(() => {
  const origin = props.origin || 'https://company.kaiten.ru';
  const token = props.token || 'YOUR_KAITEN_TOKEN';
  const shellQuote = value => `'${value.replaceAll("'", "'\\''")}'`;
  if (props.kind === 'codex-cli' || props.kind === 'claude-cli') {
    const command =
      props.kind === 'codex-cli'
        ? 'codex mcp add kaiten'
        : 'claude mcp add --scope user --transport stdio kaiten';
    return `${command} --env KAITEN_ORIGIN=${shellQuote(origin)} --env KAITEN_TOKEN=${shellQuote(token)} -- npx --yes @2chevskii/kaiten-mcp`;
  }
  if (props.kind === 'codex-config') {
    return `[mcp_servers.kaiten]\ncommand = "npx"\nargs = ["--yes", "@2chevskii/kaiten-mcp"]\n\n[mcp_servers.kaiten.env]\nKAITEN_ORIGIN = ${JSON.stringify(origin)}\nKAITEN_TOKEN = ${JSON.stringify(token)}`;
  }
  const server = {
    command: 'npx',
    args: ['--yes', '@2chevskii/kaiten-mcp'],
    env: {KAITEN_ORIGIN: origin, KAITEN_TOKEN: token},
  };
  if (props.kind === 'claude-config') Object.assign(server, {type: 'stdio'});
  return JSON.stringify({mcpServers: {kaiten: server}}, null, 2);
});
watch(code, () => {
  copied.value = false;
  failed.value = false;
});
async function copy() {
  try {
    await navigator.clipboard.writeText(code.value);
    copied.value = true;
    failed.value = false;
  } catch {
    failed.value = true;
    copied.value = false;
  }
}
</script>

<template>
  <div
    class="example-code"
    :class="`language-${kind.endsWith('cli') ? 'sh' : kind === 'codex-config' ? 'toml' : 'json'}`"
  >
    <button class="copy-example" type="button" @click="copy">
      {{
        failed
          ? locale === 'ru'
            ? 'Не удалось'
            : 'Copy failed'
          : copied
            ? locale === 'ru'
              ? 'Скопировано'
              : 'Copied'
            : locale === 'ru'
              ? 'Копировать'
              : 'Copy'
      }}
    </button>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<style scoped>
.example-code {
  position: relative;
}
.example-code pre {
  padding-top: 40px;
}
.copy-example {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  cursor: pointer;
}
.copy-example:hover,
.copy-example:focus-visible {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-1);
}
</style>
