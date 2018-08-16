import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { Nuxt } from 'nuxt';
import { resolve } from 'path';

import { Logger } from '../logger';
import { NuxtFactory } from '../nuxt';
import { StartupConfiguration } from './bootstrap.interfaces';

export class Bootstrap {
  private readonly env = process.env.NODE_ENV || 'development';
  private readonly port = process.env.PORT || '3000';
  private readonly server: express.Express = express();
  private app!: INestApplication;
  private nuxt!: Nuxt;

  constructor(private readonly config: StartupConfiguration) {}

  async main() {
    await this.configureNuxt();
    await this.configureNest();
  }

  private async configureNest() {
    this.app = await NestFactory.create(this.config.module, this.server, {
      bodyParser: true,
      cors: true,
      logger: new Logger({
        types: ['console'],
        directory: resolve('.', 'logs')
      })
    });

    // Why only one route (Nest or Nuxt) works?
    // https://github.com/nestjs/nest/issues/414
    const instance = this.server;
    // tslint:disable-next-line
    instance.get(/^(?!\/?(api|test)).+$/, (req, res) => this.nuxt.render(req, res));

    this.app.setGlobalPrefix('api');
    await this.app.listen(this.port);
    // pass nuxt middleware to express instance after making nest to run
    // this.app.use(this.nuxt.render);
  }

  private async configureNuxt() {
    this.nuxt = await NuxtFactory.create({
      ...require(resolve('.', 'nuxt.config.js')),
      dev: this.env !== 'production'
    });
  }
}
