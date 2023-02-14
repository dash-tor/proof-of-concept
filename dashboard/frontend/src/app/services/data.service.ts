import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { catchError, tap, switchAll } from 'rxjs/operators';
import { EMPTY, Subject } from 'rxjs';
export const WS_ENDPOINT = environment.wsEndpoint;
import { BehaviorSubject } from 'rxjs'
  
@Injectable({
  providedIn: 'root'
})

export class DataService {
  private _socket: any;
  
  private source = new BehaviorSubject({});
  currentData = this.source.asObservable();

  constructor(){}

  connect(): WebSocketSubject<any> {
    return webSocket(WS_ENDPOINT);
  }

  setData(msg:{}){
    this.source.next(msg)
  }
}