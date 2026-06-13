require('dotenv').config({
  path: require('path').resolve(__dirname, '../../.env'),
})

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

  buildModules: ['@nuxtjs/eslint-module', '@nuxtjs/style-resources'],

  styleResources: {
    scss: ['@/assets/styles/_variables.scss'],
  },

  plugins: [
    { src: '@/plugins/firebase', mode: 'client' },
    { src: '@/plugins/auth', mode: 'client' },
  ],

  router: {
    middleware: ['authenticated'],
  },

  server: {
    port: 3000,
  },
}
