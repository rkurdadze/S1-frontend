import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BASE_API_URL} from "../../app.config";
import {GoogleAuthService} from "./google-auth.service";

@Injectable({
    providedIn: 'root'
})
export class PhotoService {
    http = inject(HttpClient);
    baseApiUrl =  inject(BASE_API_URL);
    auth = inject(GoogleAuthService);

    constructor() { }

    private authHeaders(): { headers: HttpHeaders } {
        const token = this.auth.token;
        if (!token) {
            return { headers: new HttpHeaders() };
        }
        return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
    }


    get(){
        return this.http.get(`${this.baseApiUrl}sizes`)
    }

    getPhotoSrc(number: number) {
        return `${this.baseApiUrl}photos/${number}`;
    }

    getPhotoSrcForRes(number: number, res: number) {
        return `${this.baseApiUrl}photos/${number}/${res}`;
    }

    deletePhoto(photoId: number) {
        return this.http.delete(`${this.baseApiUrl}photos/${photoId}`, this.authHeaders());
    }
}
