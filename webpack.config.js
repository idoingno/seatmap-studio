// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const isProduction = process.env.NODE_ENV == 'production';

const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
  entry: {
    index: './src/index.tsx',
    
  },
  output: {
    publicPath: "",
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction
      ? '[name].[contenthash].bundle.js'
      : '[name].bundle.js',
    chunkFilename: isProduction
      ? 'chunks/[name].[contenthash].js'
      : 'chunks/[name].js',
  },
  devServer: {
    // open: ['/', '/playground.html'],
    host: 'localhost',
    port: 8080,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    static: [{
      directory: path.join(__dirname, 'examples/'),
    }, {
      directory: path.join(__dirname, 'public/')
    }],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MomentLocalesPlugin(),
    new MiniCssExtractPlugin({
      ignoreOrder: true,
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: 'public/index.html',
      chunks: ['index'],
      filename: 'index.html',
    }),
    
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public',
          globOptions: {
            dot: true,
            gitignore: true,
            ignore: ['**/public/index.html'],
          },
          noErrorOnMissing: true,
        },
        { from: 'README.md' },
        { from: 'screenshots', to: 'screenshots', noErrorOnMissing: true },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-react'],
              plugins: [
                [
                  'import',
                  {
                    libraryName: 'antd',
                    libraryDirectory: 'es',
                    style: true,
                  },
                  'antd',
                ],
                [
                  'import',
                  {
                    libraryName: '@ant-design/icons',
                    libraryDirectory: 'lib/icons',
                    camel2DashComponentName: false,
                  },
                  'ant-design-icons',
                ],
              ],
            },
          },
          'ts-loader',
        ],
        exclude: ['/node_modules/'],
      },
      {
        test: /\.less$/i,
        use: [stylesHandler, 'css-loader', 'postcss-loader', {
          loader: 'less-loader',
          options: {
            lessOptions: {
              modifyVars: {
                "primary-color": "#b39372",
                "link-color": "#b39372",
                "border-radius-base": "2px",
              },
              javascriptEnabled: true
            }
          }
        }],
      },
      {
        test: /\.css$/i,
        use: [stylesHandler, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(eot|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },
      {
        test: /\.svg$/,
        use: [
          { loader: "svg-sprite-loader", options: { symbolId: "icon-[name]" } },
          {
            loader: "svgo-loader",
            options: {
              plugins: [{ name: "removeAttrs", params: { attrs: "fill" } }],
            },
          },
        ],
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve('src'),
      exceljs$: path.resolve(__dirname, 'node_modules/exceljs/dist/exceljs.min.js'),
    }
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 10,
      cacheGroups: {
        exceljs: {
          test: /[\\/]node_modules[\\/](exceljs|jszip|fast-csv|archiver|readable-stream|saxes|xmlchars)[\\/]/,
          chunks: 'async',
          name: 'exceljs',
          enforce: true,
          priority: 60,
        },
        xlsx: {
          test: /[\\/]node_modules[\\/]xlsx[\\/]/,
          chunks: 'async',
          name: 'xlsx-import',
          enforce: true,
          priority: 59,
        },
        antdModalAsync: {
          test: /[\\/]node_modules[\\/](antd[\\/]es[\\/](card|form|list|modal|radio|upload)|rc-dialog|rc-field-form|rc-upload|async-validator)[\\/]/,
          chunks: 'async',
          name: 'vendor-antd-modal-async',
          enforce: true,
          priority: 58,
        },
        antdAsync: {
          test: /[\\/]node_modules[\\/](@ant-design|antd|rc-[^\\/]+)[\\/]/,
          chunks: 'async',
          name: 'vendor-antd-async',
          enforce: true,
          priority: 55,
        },
        x6PluginsAsync: {
          test: /[\\/]node_modules[\\/]@antv[\\/]x6-plugin-[^\\/]+[\\/]/,
          chunks: 'async',
          name: 'vendor-x6-plugins-async',
          enforce: true,
          priority: 54,
        },
        x6HtmlAsync: {
          test: /[\\/]node_modules[\\/](x6-html-shape)[\\/]/,
          chunks: 'async',
          name: 'vendor-x6-html-async',
          enforce: true,
          priority: 53,
        },
        x6Async: {
          test: /[\\/]node_modules[\\/](@antv|x6-)[\\/]/,
          chunks: 'async',
          name: 'vendor-x6-async',
          enforce: true,
          priority: 50,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          chunks: 'initial',
          name: 'vendor-react',
          priority: 40,
        },
        antd: {
          test: /[\\/]node_modules[\\/](@ant-design|antd|rc-[^\\/]+)[\\/]/,
          chunks: 'initial',
          name: 'vendor-antd',
          priority: 30,
        },
        x6: {
          test: /[\\/]node_modules[\\/](@antv|x6-)[\\/]/,
          chunks: 'initial',
          name: 'vendor-x6',
          priority: 20,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10,
          reuseExistingChunk: true,
        },
      },
    },
    minimizer: [
      `...`,
      new CssMinimizerPlugin(),
    ],
  },
};
module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
  } else {
    config.mode = 'development';
  }
  return config;
};
