import {computed, ref} from 'vue';

export function useConnectionValues() {
  const origin = ref('');
  const token = ref('');
  const exampleOrigin = computed(
    () => origin.value || 'https://company.kaiten.ru',
  );
  const exampleToken = computed(() => token.value || 'YOUR_KAITEN_TOKEN');
  const shellQuote = value => `'${value.replaceAll("'", "'\\''")}'`;

  return {
    origin,
    token,
    shellOrigin: computed(() => shellQuote(exampleOrigin.value)),
    shellToken: computed(() => shellQuote(exampleToken.value)),
    configOrigin: computed(() => JSON.stringify(exampleOrigin.value)),
    configToken: computed(() => JSON.stringify(exampleToken.value)),
  };
}
