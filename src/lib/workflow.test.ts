import { describe, expect, it } from "vitest";
import { canUserPerformTransition, getWorkflowProgress } from "./workflow";

describe("workflow state machine", () => {
  it("prevents non-manager members from approving or rejecting Gate 1", () => {
    expect(
      canUserPerformTransition("member", "idea_pending", "approved_for_production")
    ).toBe(false);
    expect(
      canUserPerformTransition("member", "idea_pending", "idea_rejected")
    ).toBe(false);
  });

  it("allows managers to approve or reject Gate 1", () => {
    expect(
      canUserPerformTransition("manager", "idea_pending", "approved_for_production")
    ).toBe(true);
    expect(
      canUserPerformTransition("manager", "idea_pending", "idea_rejected")
    ).toBe(true);
  });

  it("allows members to work on approved ideas and submit draft links", () => {
    expect(
      canUserPerformTransition("member", "approved_for_production", "in_production")
    ).toBe(true);
    expect(
      canUserPerformTransition("member", "in_production", "draft_review")
    ).toBe(true);
    expect(
      canUserPerformTransition("member", "changes_requested", "draft_review")
    ).toBe(true);
  });

  it("prevents members from approving Gate 2 or requesting changes", () => {
    expect(
      canUserPerformTransition("member", "draft_review", "approved_to_post")
    ).toBe(false);
    expect(
      canUserPerformTransition("member", "draft_review", "changes_requested")
    ).toBe(false);
  });

  it("allows managers to approve Gate 2 or request changes", () => {
    expect(
      canUserPerformTransition("manager", "draft_review", "approved_to_post")
    ).toBe(true);
    expect(
      canUserPerformTransition("manager", "draft_review", "changes_requested")
    ).toBe(true);
  });

  it("allows team members to mark approved videos as posted", () => {
    expect(
      canUserPerformTransition("member", "approved_to_post", "posted")
    ).toBe(true);
  });

  it("hides progress bar before idea approval and shows checkpoints from approved till posted", () => {
    expect(getWorkflowProgress("idea_pending")).toBeNull();
    expect(getWorkflowProgress("idea_rejected")).toBeNull();

    const approved = getWorkflowProgress("approved_for_production");
    expect(approved?.currentIndex).toBe(0);
    expect(approved?.percent).toBe(0);
    expect(approved?.checkpoints).toHaveLength(5);
    expect(approved?.checkpoints[0].label).toBe("Idea approved");
    expect(approved?.checkpoints[4].label).toBe("Posted");

    const creating = getWorkflowProgress("in_production");
    expect(creating?.currentIndex).toBe(1);
    expect(creating?.percent).toBe(25);

    const review = getWorkflowProgress("draft_review");
    expect(review?.currentIndex).toBe(2);
    expect(review?.percent).toBe(50);
    expect(review?.isRework).toBe(false);

    const rework = getWorkflowProgress("changes_requested");
    expect(rework?.currentIndex).toBe(2);
    expect(rework?.isRework).toBe(true);
    expect(rework?.checkpoints[2].label).toBe("Changes requested");

    const ready = getWorkflowProgress("approved_to_post");
    expect(ready?.currentIndex).toBe(3);
    expect(ready?.percent).toBe(75);

    const posted = getWorkflowProgress("posted");
    expect(posted?.currentIndex).toBe(4);
    expect(posted?.percent).toBe(100);
    expect(posted?.isComplete).toBe(true);
  });
});
