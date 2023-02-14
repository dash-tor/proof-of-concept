import { Component, OnInit, Input } from '@angular/core';
import { Nodedata } from '../../shared/models/nodedata.model';

@Component({
  selector: 'app-node-card',
  templateUrl: './node-card.component.html',
  styleUrls: ['./node-card.component.css']
})



export class NodeCardComponent implements OnInit {

  @Input() nodedata!: Nodedata;
  
  constructor() { }

  ngOnInit(): void {
  }
}
