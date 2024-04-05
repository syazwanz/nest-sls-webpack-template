import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

@Injectable()
export class AppService {
  async getHello(): Promise<any> {
    const hash = await argon2.hash('password');

    return `Hello World! ${hash}`;
  }
}
