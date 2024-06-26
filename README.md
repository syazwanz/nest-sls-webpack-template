<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Configurations

### 1. Install Packages

```bash
yarn add @codegenie/serverless-express aws-lambda @nestjs/config
```

```bash
yarn add -D @types/aws-lambda serverless-offline serverless-webpack terser-webpack-plugin fork-ts-checker-webpack-plugin
```

### 2. Add Serverless.yml

```yml
# replace app-name
service: app-name
frameworkVersion: '3'

plugins:
  - serverless-webpack
  - serverless-offline

custom:
  config: ${file(./config/${self:provider.stage}.env.json)}
  webpack:
    includeModules: true
    forceExclude:
      - aws-sdk

provider:
  name: aws
  deploymentMethod: direct
  runtime: nodejs20.x
  stage: ${opt:stage, 'dev'}
  region: ${opt:region, 'ap-southeast-1'}
  environment: ${file(./config/${opt:stage, 'dev'}.env.json)}
  # adjust bucket & vpc as needed
  # deploymentBucket:
  #   name: bucket_name
  # vpc:
  #   securityGroupIds:
  #     - sg-xxx
  #   subnetIds:
  #     - subnet-xxx
  #     - subnet-xxx
  #     - subnet-xxx

functions:
  api:
    handler: dist/main.handler
    # adjust memory, storage, and timeout as needed.
    # memorySize: 2048
    # ephemeralStorageSize: 1024
    # timeout: 25
    events:
      - httpApi: '*'
```

### 3. Update app.module.ts

```js
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  // add config module to fetch env
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 4. Update main.ts

```js
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';

let server: Handler;

async function bootstrapSLS(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  server = server ?? (await bootstrapSLS());
  return server(event, context, callback);
};

if (process.env.NEST_ENV === 'HTTP') {
  bootstrap();
}
```

### 5. Update tsconfig.json

```js
{
  "compilerOptions": {
    ...
    "esModuleInterop": true
  }
}
```

### 6. Add webpack.config.js

```js
/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const path = require('path');
const slsw = require('serverless-webpack');
const TerserPlugin = require('terser-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const lazyImports = [
  '@nestjs/microservices',
  '@nestjs/microservices/microservices-module',
  '@nestjs/websockets/socket-module',
  '@nestjs/platform-express',
  '@grpc/grpc-js',
  '@grpc/proto-loader',
  'kafkajs',
  'mqtt',
  'nats',
  'ioredis',
  'amqplib',
  'amqp-connection-manager',
  'pg-native',
  'cache-manager',
  'class-validator',
  'class-transformer',
];

module.exports = {
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  devtool: 'source-map',
  entry: slsw.lib.entries,
  target: 'node',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  externals: {
    // add package to be excluded in bundle, example:
    // argon2: 'commonjs argon2',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          // disable type checker - we will use it in fork plugin
          transpileOnly: true,
        },
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
        },
      }),
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new webpack.IgnorePlugin({
      checkResource(resource) {
        if (lazyImports.includes(resource)) {
          try {
            require.resolve(resource);
          } catch (err) {
            return true;
          }
        }
        return false;
      },
    }),
  ],
};
```

### 7. Update .gitignore

```bash
.serverless
.webpack

.env*
*.env.json
```

### 8. Add env file

```
config/
┣ dev.env.json
┗ prod.env.json
```

### 9. Update package.json scripts

```json
{
  "start:sls": "nest build && serverless offline start",
  "deploy:dev": "nest build && serverless deploy -s dev",
  "deploy:prod": "nest build && serverless deploy -s prod"
}
```

## Running the app

You can run the app either by serverless offline or normal server.

###### serverless offline

```bash
yarn start:sls
```

###### normal server

Make sure to add this value to .env file

```bash
NEST_ENV = "HTTP"
```

then run

```bash
yarn start:dev
```

## Deploying the app

```bash
yarn deploy:dev
```

## Reference

- https://www.brymartinez.blog/deploying-nestjs-to-lambda-using-webpack/
- https://johnny.sh/blog/concise-guide-to-nestjs-on-lambda/
- https://programoholic.medium.com/build-and-deploy-serverless-application-with-webpack-584163367390
- https://www.prisma.io/docs/orm/prisma-client/deployment/serverless/deploy-to-aws-lambda
