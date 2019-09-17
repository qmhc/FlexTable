module.exports = function (api) {
  api.cache(true)

  const presets = [
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: 3,
        targets: {
          browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
        }
      }
    ]
  ]

  const plugins = [
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: 3
      }
    ],
    '@babel/plugin-proposal-object-rest-spread',
    [
      '@babel/plugin-proposal-class-properties',
      {
        loose: true
      }
    ]
  ]

  return {
    presets,
    plugins
  }
}
