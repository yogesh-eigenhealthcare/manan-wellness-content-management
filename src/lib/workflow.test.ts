import { describe, expect, it } from "vitest";
import { canUserPerformTransition } from "./workflow";

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
});
