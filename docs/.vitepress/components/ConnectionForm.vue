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
      <div class="origin-field">
        <span aria-hidden="true">https://</span>
        <input
          :value="origin ? origin.slice(8, -10) : ''"
          type="text"
          placeholder="company"
          autocomplete="off"
          spellcheck="false"
          @input="
            emit(
              'update:origin',
              $event.target.value
                ? `https://${$event.target.value}.kaiten.ru`
                : '',
            )
          "
        />
        <span aria-hidden="true">.kaiten.ru</span>
      </div>
    </label>
    <label>
      <span>{{
        locale === 'ru' ? 'API-токен Kaiten' : 'Kaiten API token'
      }}</span>
      <input
        :value="token"
        type="text"
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
.origin-field {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  font-weight: 400;
}
.origin-field span {
  flex: none;
  color: var(--vp-c-text-2);
}
.origin-field span:first-child {
  padding-left: 12px;
}
.origin-field span:last-child {
  padding-right: 12px;
}
.origin-field input {
  flex: 1;
  min-width: 0;
  padding: 9px 2px;
  border: 0;
  background: transparent;
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
