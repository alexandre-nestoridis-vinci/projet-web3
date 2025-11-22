import { TestBed } from '@angular/core/testing';

import { ArticleCache } from './article-cache';

describe('ArticleCache', () => {
  let service: ArticleCache;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ArticleCache);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
