import { renderHook } from "@testing-library/react";
import { useLogActivity } from "./use-log-activity";
import { useAuth } from "@/providers/auth-provider";
import { useActivityLog } from "@/providers/activity-log-provider";

jest.mock("@/providers/auth-provider", () => ({ useAuth: jest.fn() }));
jest.mock("@/providers/activity-log-provider", () => ({ useActivityLog: jest.fn() }));

const mockedUseAuth = useAuth as jest.Mock;
const mockedUseActivityLog = useActivityLog as jest.Mock;

const CURRENT_USER = {
  id: 1,
  firstName: "Jane",
  lastName: "Doe",
  avatar: null,
};

const logActivity = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseActivityLog.mockReturnValue({ logActivity });
});

it("does nothing when there's no current user", () => {
  mockedUseAuth.mockReturnValue({ currentUser: null });
  const { result } = renderHook(() => useLogActivity("ticket"));
  result.current({
    action: "created",
    entityId: 1,
    entityLabel: "TCK-1",
    description: "Jane created TCK-1",
  });
  expect(logActivity).not.toHaveBeenCalled();
});

it("logs with the actor's info and the fixed module", () => {
  mockedUseAuth.mockReturnValue({ currentUser: CURRENT_USER });
  const { result } = renderHook(() => useLogActivity("ticket"));
  result.current({
    orgId: 6001,
    action: "created",
    entityId: 1,
    entityLabel: "TCK-1",
    description: "Jane created TCK-1",
    referenceId: "TCK-1",
  });
  expect(logActivity).toHaveBeenCalledWith({
    orgId: 6001,
    module: "ticket",
    action: "created",
    entityId: 1,
    entityLabel: "TCK-1",
    referenceId: "TCK-1",
    actorId: 1,
    actorName: "Jane Doe",
    actorAvatar: null,
    involvedUserIds: [1],
    description: "Jane created TCK-1",
  });
});

it("defaults orgId to null for a personal (org-less) ticket", () => {
  mockedUseAuth.mockReturnValue({ currentUser: CURRENT_USER });
  const { result } = renderHook(() => useLogActivity("ticket"));
  result.current({
    action: "created",
    entityId: 1,
    entityLabel: "TCK-1",
    description: "x",
  });
  expect(logActivity).toHaveBeenCalledWith(expect.objectContaining({ orgId: null }));
});

it("dedupes and always includes the actor in involvedUserIds, dropping non-numeric ids", () => {
  mockedUseAuth.mockReturnValue({ currentUser: CURRENT_USER });
  const { result } = renderHook(() => useLogActivity("ticket"));
  result.current({
    action: "assigned",
    entityId: 1,
    entityLabel: "TCK-1",
    description: "x",
    involvedUserIds: [1, 2, 2, null, undefined],
  });
  expect(logActivity).toHaveBeenCalledWith(
    expect.objectContaining({ involvedUserIds: [1, 2] }),
  );
});
