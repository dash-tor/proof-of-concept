import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Nodedata } from 'src/app/shared/models/nodedata.model';
import { Quorumdata } from 'src/app/shared/models/quorumdata.model';
import { NodeCardsComponent } from '../node-cards/node-cards.component';

@Component({
  selector: 'app-quorum-card',
  templateUrl: './quorum-card.component.html',
  styleUrls: ['./quorum-card.component.css']
})
export class QuorumCardComponent implements OnInit {

  @Input() quorumdata!: Quorumdata;
  
  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
  }

  showNodes(data: any){
    console.log("Open Quorum Nodes", data); 
    this.dialog.open(NodeCardsComponent, {
      data: "Quorum Nodes",
      height: '80%',
      width: '80%',
      enterAnimationDuration: "350ms"
    });
  }

}
