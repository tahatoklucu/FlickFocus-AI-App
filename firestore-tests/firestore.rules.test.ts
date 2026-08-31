import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const MOVIE_ID = "tt1375666";
const AUTHOR = "author-uid";
const OTHER = "other-uid";

let testEnv: RulesTestEnvironment;

function validReview(overrides: Record<string, unknown> = {}) {
  return {
    userId: AUTHOR,
    imdbID: MOVIE_ID,
    displayName: "Author",
    photoURL: null,
    rating: 9,
    note: "Holds up on a rewatch.",
    publishedAt: "2026-03-04T10:00:00.000Z",
    ...overrides,
  };
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "flickfocus-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("private library", () => {
  it("lets a user read and write only their own entries", async () => {
    const owner = testEnv.authenticatedContext(AUTHOR).firestore();

    await assertSucceeds(
      setDoc(doc(owner, "users", AUTHOR, "favorites", MOVIE_ID), {
        imdbID: MOVIE_ID,
        favorite: true,
      }),
    );
    await assertSucceeds(
      getDoc(doc(owner, "users", AUTHOR, "favorites", MOVIE_ID)),
    );
  });

  it("blocks reading or writing someone else's library", async () => {
    const intruder = testEnv.authenticatedContext(OTHER).firestore();

    await assertFails(
      getDoc(doc(intruder, "users", AUTHOR, "favorites", MOVIE_ID)),
    );
    await assertFails(
      setDoc(doc(intruder, "users", AUTHOR, "favorites", MOVIE_ID), {
        favorite: true,
      }),
    );
  });

  it("blocks signed-out access entirely", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(doc(anon, "users", AUTHOR, "favorites", MOVIE_ID)));
  });
});

describe("public reviews", () => {
  it("is readable by anyone, including signed-out visitors", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "movieReviews", MOVIE_ID, "reviews", AUTHOR),
        validReview(),
      );
    });

    const anon = testEnv.unauthenticatedContext().firestore();
    const snapshot = await assertSucceeds(
      getDoc(doc(anon, "movieReviews", MOVIE_ID, "reviews", AUTHOR)),
    );

    expect(snapshot.data()?.note).toBe("Holds up on a rewatch.");
  });

  it("lets the author publish, update, and delete their own review", async () => {
    const author = testEnv.authenticatedContext(AUTHOR).firestore();
    const ref = doc(author, "movieReviews", MOVIE_ID, "reviews", AUTHOR);

    await assertSucceeds(setDoc(ref, validReview()));
    await assertSucceeds(setDoc(ref, validReview({ note: "Even better now." })));
    await assertSucceeds(deleteDoc(ref));
  });

  it("accepts an unrated review", async () => {
    const author = testEnv.authenticatedContext(AUTHOR).firestore();

    await assertSucceeds(
      setDoc(
        doc(author, "movieReviews", MOVIE_ID, "reviews", AUTHOR),
        validReview({ rating: null }),
      ),
    );
  });

  it("refuses signed-out writes", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();

    await assertFails(
      setDoc(
        doc(anon, "movieReviews", MOVIE_ID, "reviews", AUTHOR),
        validReview(),
      ),
    );
  });

  it("refuses writing or deleting a review that belongs to someone else", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), "movieReviews", MOVIE_ID, "reviews", AUTHOR),
        validReview(),
      );
    });

    const intruder = testEnv.authenticatedContext(OTHER).firestore();
    const ref = doc(intruder, "movieReviews", MOVIE_ID, "reviews", AUTHOR);

    await assertFails(setDoc(ref, validReview({ note: "Vandalized." })));
    await assertFails(deleteDoc(ref));
  });

  it("refuses a review whose userId does not match the document id", async () => {
    const author = testEnv.authenticatedContext(AUTHOR).firestore();

    await assertFails(
      setDoc(
        doc(author, "movieReviews", MOVIE_ID, "reviews", AUTHOR),
        validReview({ userId: OTHER }),
      ),
    );
  });

  it("refuses a review filed under the wrong movie", async () => {
    const author = testEnv.authenticatedContext(AUTHOR).firestore();

    await assertFails(
      setDoc(
        doc(author, "movieReviews", MOVIE_ID, "reviews", AUTHOR),
        validReview({ imdbID: "tt0111161" }),
      ),
    );
  });

  it.each([
    ["an empty note", { note: "" }],
    ["a note over 500 characters", { note: "x".repeat(501) }],
    ["a non-string note", { note: 42 }],
    ["a rating above 10", { rating: 11 }],
    ["a rating below 1", { rating: 0 }],
    ["a fractional rating", { rating: 8.5 }],
    ["an empty display name", { displayName: "" }],
    ["a display name over 100 characters", { displayName: "x".repeat(101) }],
    ["an unexpected extra field", { isAdmin: true }],
  ])("refuses %s", async (_label, overrides) => {
    const author = testEnv.authenticatedContext(AUTHOR).firestore();

    await assertFails(
      setDoc(
        doc(author, "movieReviews", MOVIE_ID, "reviews", AUTHOR),
        validReview(overrides),
      ),
    );
  });
});

describe("review reports", () => {
  const report = {
    reporterId: OTHER,
    reason: "Spoilers without a warning.",
    createdAt: "2026-03-05T10:00:00.000Z",
  };

  function reportRef(
    db: ReturnType<ReturnType<RulesTestEnvironment["authenticatedContext"]>["firestore"]>,
    reporterId = OTHER,
  ) {
    return doc(
      db,
      "movieReviews",
      MOVIE_ID,
      "reviews",
      AUTHOR,
      "reports",
      reporterId,
    );
  }

  it("lets a signed-in visitor file and re-read their own report", async () => {
    const reporter = testEnv.authenticatedContext(OTHER).firestore();

    await assertSucceeds(setDoc(reportRef(reporter), report));
    await assertSucceeds(getDoc(reportRef(reporter)));
  });

  it("refuses reports from signed-out visitors", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();

    await assertFails(setDoc(reportRef(anon), report));
  });

  it("refuses filing a report under another user's id", async () => {
    const reporter = testEnv.authenticatedContext(OTHER).firestore();

    await assertFails(
      setDoc(reportRef(reporter, "someone-else"), {
        ...report,
        reporterId: "someone-else",
      }),
    );
  });

  it("refuses authors reporting their own review", async () => {
    const author = testEnv.authenticatedContext(AUTHOR).firestore();

    await assertFails(
      setDoc(reportRef(author, AUTHOR), { ...report, reporterId: AUTHOR }),
    );
  });

  it("hides reports from everyone but their reporter", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(reportRef(context.firestore()), report);
    });

    const nosy = testEnv.authenticatedContext("nosy-uid").firestore();

    await assertFails(getDoc(reportRef(nosy)));
  });

  it("refuses editing or withdrawing a filed report", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(reportRef(context.firestore()), report);
    });

    const reporter = testEnv.authenticatedContext(OTHER).firestore();

    await assertFails(
      setDoc(reportRef(reporter), { ...report, reason: "Changed my mind." }),
    );
    await assertFails(deleteDoc(reportRef(reporter)));
  });

  it("refuses a report with an over-long reason", async () => {
    const reporter = testEnv.authenticatedContext(OTHER).firestore();

    await assertFails(
      setDoc(reportRef(reporter), { ...report, reason: "x".repeat(301) }),
    );
  });
});
