<script setup>
defineProps({
  origin: {type: String, required: true},
  token: {type: String, required: true},
  locale: {type: String, default: 'en'},
});
const emit = defineEmits(['update:origin', 'update:token']);
</script>

<template>
  <div class="connection-form">
    <label>
      <span>{{
        locale === 'ru' ? 'Адрес компании Kaiten' : 'Kaiten company origin'
      }}</span>
      <input
        :value="origin"
        type="url"
        placeholder="https://company.kaiten.ru"
        autocomplete="url"
        @input="emit('update:origin', $event.target.value)"
      />
    </label>
    <label>
      <span>{{
        locale === 'ru' ? 'API-токен Kaiten' : 'Kaiten API token'
      }}</span>
      <input
        :value="token"
        type="password"
        placeholder="YOUR_KAITEN_TOKEN"
        autocomplete="off"
        @input="emit('update:token', $event.target.value)"
      />
    </label>
    <p>
      {{
        locale === 'ru'
          ? 'Значения остаются на этой странице. Примеры ниже содержат токен открытым текстом.'
          : 'Values stay on this page. The examples below contain the token in plain text.'
      }}
    </p>
  </div>
</template>

<style scoped>
.connection-form {
  display: grid;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
label {
  display: grid;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}
input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-weight: 400;
}
input:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
.connection-form p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.5;
}
</style>
