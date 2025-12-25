import {Routes} from '@angular/router';
import {OutwearComponent} from './pages/outwear/outwear.component';
import {LayoutComponent} from './common-ui/layout/layout.component';
import {ItemPageComponent} from "./pages/item-page/item-page.component";
import {LoginComponent} from "./pages/login/login.component";
import {CartComponent} from "./pages/cart/cart.component";
import {CatalogComponent} from "./pages/catalog/catalog.component";
import {ProfileComponent} from "./pages/profile/profile.component";
import {AdminComponent} from "./pages/admin/admin.component";
import {AdminItemsComponent} from "./pages/admin/admin-items/admin-items.component";
import {AdminCategoriesComponent} from "./pages/admin/admin-categories/admin-categories.component";
import {AdminNewsComponent} from "./pages/admin/admin-news/admin-news.component";
import {AdminCollectionsComponent} from "./pages/admin/admin-collections/admin-collections.component";
import {AdminEditorialsComponent} from "./pages/admin/admin-editorials/admin-editorials.component";
import {AdminOrdersComponent} from "./pages/admin/admin-orders/admin-orders.component";
import {AdminPromotionsComponent} from "./pages/admin/admin-promotions/admin-promotions.component";
import {AdminUsersComponent} from "./pages/admin/admin-users/admin-users.component";
import {AdminNewsletterComponent} from "./pages/admin/admin-newsletter/admin-newsletter.component";
import {AdminDeliveryComponent} from "./pages/admin/admin-delivery/admin-delivery.component";
import {AdminTagsComponent} from "./pages/admin/admin-tags/admin-tags.component";
import {adminGuard} from "./data/guards/admin.guard";
import {OrdersComponent} from './pages/orders/orders.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {
        path: '', component: LayoutComponent, children: [
            {path: '', component: OutwearComponent},
            {path: 'catalog', component: CatalogComponent},
            {path: 'items', redirectTo: 'catalog'},
            {path: 'cart', component: CartComponent},
            {path: 'my-orders', component: OrdersComponent},
            {path: 'profile', component: ProfileComponent},
            {path: 'item/:id', component: ItemPageComponent},
            {
                path: 'admin',
                component: AdminComponent,
                canActivate: [adminGuard],
                children: [
                    {path: '', pathMatch: 'full', redirectTo: 'items'},
                    {path: 'items', component: AdminItemsComponent},
                    {path: 'tags', component: AdminTagsComponent},
                    {path: 'categories', component: AdminCategoriesComponent},
                    {path: 'news', component: AdminNewsComponent},
                    {path: 'collections', component: AdminCollectionsComponent},
                    {path: 'editorials', component: AdminEditorialsComponent},
                    {path: 'orders', component: AdminOrdersComponent},
                    {path: 'promotions', component: AdminPromotionsComponent},
                    {path: 'users', component: AdminUsersComponent},
                    {path: 'newsletter', component: AdminNewsletterComponent},
                    {path: 'delivery', component: AdminDeliveryComponent},
                ]
            },
            {path: '**', redirectTo: '/'}
        ]
    },
];
