import {
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  PageHeaderSkeleton,
  StatTilesSkeleton,
  ListSkeleton,
  CardSkeleton,
  ChartSkeleton,
  TabsSkeleton,
  DataTableSkeleton,
  TicketRowsSkeleton,
  RequestRowsSkeleton,
  DetailHeaderSkeleton,
  OrganizationInfoSkeleton,
  DashboardSkeleton,
  ReportsSkeleton,
} from "./index";

it("re-exports every skeleton component", () => {
  expect(Skeleton).toBeDefined();
  expect(SkeletonText).toBeDefined();
  expect(SkeletonCircle).toBeDefined();
  expect(PageHeaderSkeleton).toBeDefined();
  expect(StatTilesSkeleton).toBeDefined();
  expect(ListSkeleton).toBeDefined();
  expect(CardSkeleton).toBeDefined();
  expect(ChartSkeleton).toBeDefined();
  expect(TabsSkeleton).toBeDefined();
  expect(DataTableSkeleton).toBeDefined();
  expect(TicketRowsSkeleton).toBeDefined();
  expect(RequestRowsSkeleton).toBeDefined();
  expect(DetailHeaderSkeleton).toBeDefined();
  expect(OrganizationInfoSkeleton).toBeDefined();
  expect(DashboardSkeleton).toBeDefined();
  expect(ReportsSkeleton).toBeDefined();
});
