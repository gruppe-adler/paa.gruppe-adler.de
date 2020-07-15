module.exports = {
    chainWebpack: config => {
        config.module
          .rule("worker")
          .test(/\.worker(\.(js|ts))?$/i)
          .use("comlink-loader")
          .loader("comlink-loader")
          .end();
    },
    pwa: {
        name: 'PAA Converter - Gruppe Adler',
        themeColor: '#000000',
        manifestOptions: {
            short_name: 'GRAD PAA'
        },
        workboxPluginMode: 'InjectManifest',
        workboxOptions: {
            swSrc: 'src/service-worker.js',
            exclude: [ 
                /\.map$/, 
            ]
        }
    }
}
