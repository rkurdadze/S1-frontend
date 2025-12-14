import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { appConfig } from '../src/app/app.config';

const serverConfig: ApplicationConfig = {
  providers: [
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
