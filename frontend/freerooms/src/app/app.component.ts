import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'freerooms';
  isDoorOpen = false;
  searchQuery: string = ''; // Bind this to the input field

  buildings = [
    { name: 'AGSM', rooms: 9, image: 'agsm.webp' },
    { name: 'Ainsworth Building', rooms: 16, image: 'ainsworth.webp' },
    { name: 'Anita B Lawrence Centre', rooms: 44, image: 'anitab.webp' },
    { name: 'Biological Sciences', rooms: 6, image: 'biologicalScience.webp' },
    { name: 'Biological Sciences (West)', rooms: 8, image: 'biologicalScienceWest.webp' },
    { name: 'Blockhouse', rooms: 42, image: 'blockhouse.webp' },
    { name: 'Business School', rooms: 18, image: 'businessSchool.webp' },
    { name: 'Civil Engineering Building', rooms: 8, image: 'civilBuilding.webp' },
    { name: 'Colombo Building', rooms: 5, image: 'colombo.webp' },
    { name: 'Computer Science & Eng (K17)', rooms: 7, image: 'cseBuilding.webp' }
  ];

  filteredBuildings = [...this.buildings]; // Copy of the buildings list


  // Filter buildings based on the search input
  onSearchChange() {
    this.filteredBuildings = this.buildings.filter(building =>
      building.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  toggleDoor() {
    this.isDoorOpen = !this.isDoorOpen;
    const logo = document.querySelector('.logo') as HTMLImageElement;
    logo.src = this.isDoorOpen ? 'assets/freeRoomsLogo.png' : 'assets/freeroomsDoorClosed.png';
  }
}
