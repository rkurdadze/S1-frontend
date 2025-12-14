import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BASE_API_URL} from "../../app.config";

@Injectable({
    providedIn: 'root'
})
export class PhotoService {
    http = inject(HttpClient);
    baseApiUrl =  inject(BASE_API_URL);

    constructor() { }


    get(){
        return this.http.get(`${this.baseApiUrl}sizes`)
    }

    getPhotoSrc(number: number) {
        return `${this.baseApiUrl}photos/${number}`;
    }
}
