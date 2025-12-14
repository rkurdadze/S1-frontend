import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BASE_API_URL} from "../../app.config";
import {Size} from "../interfaces/size.interface";

@Injectable({
    providedIn: 'root'
})
export class SizeService {
    http = inject(HttpClient);
    baseApiUrl =  inject(BASE_API_URL);

    constructor() { }


    get(){
        return this.http.get<Size[]>(`${this.baseApiUrl}sizes`)
    }

}
