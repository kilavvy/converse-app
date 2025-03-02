module.exports = {
  presets: [
    [
      "babel-preset-expo",
      // Prevents unnecessary babel transform BigInt to number for Hermes.
      { unstable_transformProfile: "hermes-stable" },
    ],
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { version: "legacy" }],
    "@babel/plugin-proposal-export-namespace-from",
    "@babel/plugin-transform-flow-strip-types", // For privy (phone country selector)
    ["@babel/plugin-transform-class-properties", { loose: true }], // For privy
    ["@babel/plugin-transform-private-methods", { loose: true }], // For privy
    [
      "module-resolver",
      {
        alias: {
          "fast-text-encoding": "text-encoding",
          crypto: "crypto-browserify",
          "react-native-webview": "react-native-webview/src/index.ts",

          // Folder aliases
          "@": "./",
          "@components": "./components",
          "@config": "./config",
          "@containers": "./containers",
          "@data": "./data",
          "@hooks": "./hooks",
          "@i18n": "./i18n",
          "@queries": "./queries",
          "@screens": "./screens",
          "@styles": "./styles",
          "@utils": "./utils",
          "@theme": "./theme",
          "@assets": "./assets",
          "@design-system": "./design-system",
          "@navigation": "./navigation",
          "@features": "./features",
          "@shared": "./features/shared",
          "@search": "./features/search",
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
  env: {
    production: {
      plugins: ["transform-remove-console", "react-native-paper/babel"],
    },
  },
};
