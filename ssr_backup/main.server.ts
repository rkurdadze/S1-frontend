import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from '../src/app/app.component';
import { config } from './app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
