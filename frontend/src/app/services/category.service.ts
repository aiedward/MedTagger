import {Injectable} from '@angular/core';
import {ScanCategory} from '../model/ScanMetadata';

@Injectable()
export class CategoryService {
        constructor() {
    }

    scanCategory: ScanCategory;

    public setCategory(scanCategory: ScanCategory) {
        this.scanCategory = scanCategory;
    }

    public getCurrentCategory() {
        return this.scanCategory;
    }
}
