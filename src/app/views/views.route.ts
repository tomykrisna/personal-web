import { Route } from "@angular/router";
import { IndexComponent } from "./index/index.component";
import { Index2Component } from "./index2/index2.component";
import { Index3Component } from "./index3/index3.component";
import { Index4Component } from "./index4/index4.component";
import { Index5Component } from "./index5/index5.component";
import { Index6Component } from "./index6/index6.component";
import { Index7Component } from "./index7/index7.component";
import { PreviewComponent } from "./preview/preview.component";
import { BlogSingleComponent } from "./blog-single/blog-single.component";

export const VIEWS_ROUTE: Route[] = [
    {
        path: 'index',
        component: Index3Component
    },
    {
        path: 'index-2',
        component: Index2Component
    },
    {
        path: 'index-3',
        component: Index3Component
    },
    {
        path: 'index-4',
        component: Index4Component
    },
    {
        path: 'index-5',
        component: Index5Component
    },
    {
        path: 'index-6',
        component: Index6Component
    },
    {
        path: 'index-7',
        component: Index7Component
    },

]
