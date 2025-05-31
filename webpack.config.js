import path from 'path';

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css$/, // Or your specific regex for CSS/SCSS/LESS files
        use: [
          'style-loader', // Or MiniCssExtractPlugin.loader
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                // OPTION 1 (Recommended): Let it automatically find postcss.config.js
                // No 'plugins' array here.
                 //config: true // You can be explicit that it should load a config

                // OPTION 2 (Explicit path, if needed):
                 config: path.resolve(__dirname, 'postcss.config.js'),
              }
              // Ensure no old inline Tailwind plugin here:
              // DEPRECATED/WRONG: plugins: [require('tailwindcss'), require('autoprefixer')]
            }
          }
        ]
      },
      // ... other rules (for JS/JSX, images, etc.)
    ]
  },
  resolve: {
    fallback: {
      "os": require.resolve("os-browserify/browser")
    }
  },
  // ...
};