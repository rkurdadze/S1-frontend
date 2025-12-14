import {Routes} from '@angular/router';
import {OutwearComponent} from './pages/outwear/outwear.component';
import {LayoutComponent} from './common-ui/layout/layout.component';
import {ItemPageComponent} from "./pages/item-page/item-page.component";
import {LoginComponent} from "./pages/login/login.component";

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {
        path: '', component: LayoutComponent, children: [
            {path: '', component: OutwearComponent},
            {path: 'item/:id', component: ItemPageComponent},
            {path: '**', redirectTo: '/'}
        ]
    },
];
