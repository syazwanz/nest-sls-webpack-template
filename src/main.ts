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
