import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NodeCardComponent } from './dialog/node-card/node-card.component';
import { NodeCardsComponent } from './dialog/node-cards/node-cards.component';
import { MatCardModule } from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import { OverviewComponent } from './overview/overview.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatTreeModule} from '@angular/material/tree';
import {MatIconModule} from '@angular/material/icon';
import { MainCompComponent } from './main-comp/main-comp.component';
import { PieChartComponent } from './charts/pie-chart/pie-chart.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { LineChartComponent } from './charts/line-chart/line-chart.component';
import {MatDialogModule} from '@angular/material/dialog';
import { QuorumCardComponent } from './dialog/quorum-card/quorum-card.component';

@NgModule({
  declarations: [
    AppComponent,
    NodeCardComponent,
    NodeCardsComponent,
    OverviewComponent,
    MainCompComponent,
    PieChartComponent,
    LineChartComponent,
    QuorumCardComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatTreeModule,
    MatIconModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
    
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }