import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Application is healthy',
    };
  }

  getInfo() {
    return {
      name: 'Task Management API',
      version: '1.0.0',
      description: 'RESTful API for task management system',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
