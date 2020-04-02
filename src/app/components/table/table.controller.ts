import {IController, IScope, IAugmentedJQuery, IIntervalService, ITimeoutService} from 'angular';
import {Column} from './tabe.directive';

export interface ITableScope extends IScope {
  columns: Column[];
  offset: Number;
  element: IAugmentedJQuery;
  rolled: Number[];
  unroll: Function;
}

interface IHeaderColumn {
  interval: Number;
  isMax: Boolean;
  isBusy: Boolean;
}

export class TableCtrl implements IController {

  headerColumns: IHeaderColumn[] = [];

  constructor(private $scope: ITableScope, $timeout: ITimeoutService) {
    $scope.offset = 0;
    $scope.rolled = [];
    $scope.$on('ps-scroll-y', this.scroll);
    $scope.$watch('columns', () => {
      $scope.offset = 0;
      this.$scope.element[0].getElementsByClassName('table')[0].scrollTop = 0;
      $timeout(this.updateIntervals, 0);
    });
    $scope.$watch('offset', this.updateRolled);
    $scope.unroll = this.unroll;
  }

  private unroll = (index: Number): void => {
    if (this.$scope.rolled.includes(index))
      this.$scope.rolled.push(index);
  }
  
  private scroll = (event: any, target: any): void => {
    this.$scope.$apply(() => {
      this.$scope.offset = target.scrollTop;
    });
  }

  private updateIntervals = (): void => {
    this.headerColumns = Array.from(this.$scope.element[0].getElementsByClassName('table__header-interval')).map((element: HTMLDivElement) => ({
      interval: element.parentElement.offsetHeight - element.offsetTop - element.offsetHeight / 2,
      isMax: element.parentElement.offsetHeight - element.offsetTop - element.offsetHeight === - 1, // FIXME
      isBusy: Boolean(element.parentElement.getElementsByClassName('table__header-interval_busy').length),
    }));
  }

  private isHeaderColumnRolled = (headerColumn: IHeaderColumn): Boolean => {
    return headerColumn.interval < this.$scope.offset;

  }

  private updateRolled = (): void => {
    if (this.headerColumns.length === 0) {
      this.$scope.rolled = [];
      return;
    }
    const rollableColumns = this.headerColumns.filter(({isBusy}) => !isBusy);
    if (rollableColumns.every(this.isHeaderColumnRolled)) {
      this.$scope.rolled = rollableColumns.map((headerColumn) => this.headerColumns.indexOf(headerColumn));
      return;
    }
    const maxHeaderColumns = rollableColumns.filter(({isMax}) => isMax);
    if (maxHeaderColumns.length === 0)
      throw new Error('isMax determenition logic is broken');
    if (!this.isHeaderColumnRolled(maxHeaderColumns[0])) {
      this.$scope.rolled = [];
      return;
    }
    this.$scope.rolled = maxHeaderColumns.map((headerColumn) => this.headerColumns.indexOf(headerColumn));
  }

}
