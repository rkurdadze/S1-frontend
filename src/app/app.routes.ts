import {Routes} from '@angular/router';
import {OutwearComponent} from './pages/outwear/outwear.component';
import {LayoutComponent} from './common-ui/layout/layout.component';
import {ItemPageComponent} from "./pages/item-page/item-page.component";
import {LoginComponent} from "./pages/login/login.component";
import {CartComponent} from "./pages/cart/cart.component";
import {CatalogComponent} from "./pages/catalog/catalog.component";
import {ProfileComponent} from "./pages/profile/profile.component";

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {
        path: '', component: LayoutComponent, children: [
            {path: '', component: OutwearComponent},
            {path: 'catalog', component: CatalogComponent},
            {path: 'items', redirectTo: 'catalog'},
            {path: 'cart', component: CartComponent},
            {path: 'profile', component: ProfileComponent},
            {path: 'item/:id', component: ItemPageComponent},
            {path: '**', redirectTo: '/'}
        ]
    },
];
