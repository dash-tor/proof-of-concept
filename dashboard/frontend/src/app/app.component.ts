
import { Component, OnInit, ViewChild } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { DataService } from './services/data.service';
import { Observable } from 'rxjs';
import { SocketData } from './socket-data.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  title = 'dashboard';

  nodeData = {};
  barData$: Observable<any> | undefined;
  private socket: WebSocketSubject<any> | undefined;

  constructor(private service: DataService) {
  }

  ngOnInit(): void {
    this.connect();
  }

  connect() {
    this.socket = this.service.connect();
    console.log("WS_Server connect");
    this.socket.subscribe({
      next: msg => {console.log('message received'), this.nodeData = msg, this.service.setData(msg)},// Called whenever there is a message from the server.
      error: err => console.log(err), // Called if at any point WebSocket API signals some kind of error.
      complete: () => console.log('complete') // Called when connection is closed (for whatever reason).
    })
  }

  close() {
  }

  reconnect() {
    this.service.connect();
  }
}
