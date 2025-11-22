// src/app/app.ts (NETTOYÉ)
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header';

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [RouterOutlet, CommonModule, HeaderComponent], // Doit importer RouterOutlet
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor() { }
  ngOnInit() { }
}