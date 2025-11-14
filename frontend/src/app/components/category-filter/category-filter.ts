import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsCategory } from '../../models/news.model';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.scss'
})
export class CategoryFilterComponent {
  @Input() categories: NewsCategory[] = [];
  @Output() categorySelected = new EventEmitter<NewsCategory>();

  onCategoryClick(category: NewsCategory) {
    this.categorySelected.emit(category);
  }

  getCategoryIcon(iconName: string): string {
    const icons: { [key: string]: string } = {
      laptop: '💻',
      trophy: '🏆',
      government: '🏛️',
      briefcase: '💼',
      heart: '❤️',
      flask: '🧪',
      film: '🎬'
    };
    return icons[iconName] || '📰';
  }
}
