import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {ScanService} from '../../services/scan.service';
import {MarkerComponent} from '../../components/marker/marker.component';
import {ScanCategory, ScanMetadata} from '../../model/ScanMetadata';
import {MarkerSlice} from '../../model/MarkerSlice';
import {ROISelection3D} from '../../model/ROISelection3D';
import {RectROISelector} from '../../components/selectors/RectROISelector';
import {ROISelection2D} from '../../model/ROISelection2D';
import {DialogService} from '../../services/dialog.service';
import {FormControl, Validators} from '@angular/forms';
import {Location} from '@angular/common';
import {MatSnackBar} from '@angular/material';
import {LabelExplorerComponent} from '../../components/label-explorer/label-explorer.component';
import {CategoryService} from '../../services/category.service';


@Component({
    selector: 'app-marker-page',
    templateUrl: './marker-page.component.html',
    providers: [ScanService],
    styleUrls: ['./marker-page.component.scss']
})
export class MarkerPageComponent implements OnInit {

    private static readonly SLICE_BATCH_SIZE = 10;

    @ViewChild(MarkerComponent) marker: MarkerComponent;

    @ViewChild(LabelExplorerComponent) labelExplorer: LabelExplorerComponent;

    scan: ScanMetadata;
    category: string;
    scanCategory: ScanCategory;
    currentTag: string;
    lastSliceID = 0;
    startTime: Date;
    tagsControl: FormControl;

    constructor(private scanService: ScanService, private categoryService: CategoryService, private route: ActivatedRoute, private dialogService: DialogService,
                private location: Location, private snackBar: MatSnackBar) {
        console.log('MarkerPage constructor', this.marker);
    }

    ngOnInit() {
        console.log('MarkerPage init', this.marker);

        this.tagsControl = new FormControl('', [Validators.required]);
        this.tagsControl.markAsTouched();

        // TODO: Do not let user use marker if he/she does not pick any label tag
        // TODO: Show snackbar/or dialog when he/she tries to use marker

        this.scanCategory = this.categoryService.getCurrentCategory();

        if (this.scanCategory.tags.length === 0) {
             this.dialogService
                    .openInfoDialog('There are no tags assigned to this category!', 'Please try another category!', 'Go back')
                    .afterClosed()
                    .subscribe(() => {
                        this.location.back();
                    });
             return;
        }

        this.marker.setSelector(new RectROISelector(this.marker.getCanvas()));
        this.marker.setLabelExplorer(this.labelExplorer);

        this.route.queryParamMap.subscribe(params => {
            this.category = params.get('category') || '';
            this.requestScan();
        });

        this.scanService.slicesObservable().subscribe((slice: MarkerSlice) => {
            console.log('MarkerPage | ngOnInit | slicesObservable: ', slice);
            if (slice.index > this.lastSliceID) {
                this.lastSliceID = slice.index;
            }
            this.marker.feedData(slice);
            if (this.marker.downloadingScanInProgress === true) {
                this.indicateNewScanAppeared();
            }
            this.marker.setDownloadSlicesInProgress(false);
            this.marker.setDownloadScanInProgress(false);
        });

        this.marker.hookUpSliceObserver(MarkerPageComponent.SLICE_BATCH_SIZE).then((isObserverHooked: boolean) => {
            if (isObserverHooked) {
                this.marker.observableSliceRequest.subscribe((sliceRequest: number) => {
                    console.log('MarkerPage | observable sliceRequest: ', sliceRequest);
                    this.marker.setDownloadSlicesInProgress(true);
                    let count = MarkerPageComponent.SLICE_BATCH_SIZE;
                    if (sliceRequest + count > this.scan.numberOfSlices) {
                        count = this.scan.numberOfSlices - sliceRequest;
                        this.marker.setDownloadSlicesInProgress(false);
                    }
                    if (sliceRequest < 0) {
                        count = count + sliceRequest;
                        sliceRequest = 0;
                        this.marker.setDownloadSlicesInProgress(false);
                    }
                    this.scanService.requestSlices(this.scan.scanId, sliceRequest, count);
                });
            }
        });
    }

    private requestScan(): void {
      this.marker.setDownloadScanInProgress(true);
        this.scanService.getRandomScan(this.category).then(
            (scan: ScanMetadata) => {
                this.scan = scan;
                this.marker.setScanMetadata(this.scan);

                const begin = Math.floor(Math.random() * (scan.numberOfSlices - MarkerPageComponent.SLICE_BATCH_SIZE));
                const count = MarkerPageComponent.SLICE_BATCH_SIZE;
                this.startMeasuringLabelingTime();
                this.scanService.requestSlices(scan.scanId, begin, count);
            },
            (errorResponse: Error) => {
                console.log(errorResponse);
                this.marker.setDownloadScanInProgress(false);
                this.marker.setDownloadSlicesInProgress(false);
                this.dialogService
                    .openInfoDialog('Nothing to do here!', 'No more Scans available for you in this category!', 'Go back')
                    .afterClosed()
                    .subscribe(() => {
                        this.location.back();
                    });
            });
    }

    public skipScan(): void {
        this.marker.setDownloadScanInProgress(true);
        this.marker.prepareForNewScan();
        this.requestScan();
    }

    public sendCompleteLabel(): void {
        this.sendSelection(new ROISelection3D(<ROISelection2D[]>this.marker.get3dSelection()));
    }

    public sendEmptyLabel(): void {
        this.sendSelection(new ROISelection3D());
        this.skipScan();
    }

    private sendSelection(roiSelection: ROISelection3D) {
        const labelingTime = this.getLabelingTimeInSeconds(this.startTime);

        this.scanService.sendSelection(this.scan.scanId, roiSelection, labelingTime)
            .then((response: Response) => {
                if (response.status === 200) {
                    console.log('MarkerPage | sendSelection | success!');
                }
            })
            .catch((errorResponse: Error) => {
                this.dialogService
                    .openInfoDialog('Error', 'Cannot send selection', 'Ok');
            });
        this.startMeasuringLabelingTime();
        this.indicateLabelHasBeenSend();

        this.labelExplorer.reinitializeExplorer();
        return;
    }

    public remove2dSelection(): void {
        this.marker.removeCurrentSelection();
    }

    private startMeasuringLabelingTime(): void {
      this.startTime = new Date();
    }

    private getLabelingTimeInSeconds(startTime: Date): number {
      const endTime = new Date();
      return (endTime.getTime() - startTime.getTime()) / 1000.0;
    }

    private indicateLabelHasBeenSend(): void {
      this.snackBar.open('Label has been send', '', {duration: 2000, });
    }

    private indicateNewScanAppeared(): void {
      this.snackBar.open('New scan has been loaded', '', {duration: 2000, });
    }
}
