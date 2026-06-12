export default {
  mode: 'spa',
  telemetry: false,

  head: {
    title: 'Vault — Collection Manager',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
  },

  css: ['@/assets/styles/app.scss'],

  components: true,

  buildModules: ['@nuxtjs/eslint-module'],

  plugins: [{ src: '@/plugins/firebase', mode: 'client' }],

  server: {
    port: 3000,
  },
}
