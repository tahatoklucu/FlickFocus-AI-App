import { expect, test } from "@playwright/test";
import { buildMockChatSseBody } from "../src/test/fixtures/chat";

const CHAT_STORAGE_KEY = "flickfocus:chat:messages";

test.beforeEach(async ({ page }) => {
  await page.addInitScript((storageKey) => {
    window.localStorage.removeItem(storageKey);
  }, CHAT_STORAGE_KEY);

  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      body: buildMockChatSseBody(
        "Here are a few sci-fi picks worth watching tonight.",
      ),
    });
  });
});

async function waitForChatComposer(page: import("@playwright/test").Page) {
  const messageInput = page.getByRole("textbox", { name: "Message" });
  await expect(messageInput).toBeVisible({ timeout: 15_000 });
  return messageInput;
}

test("chat search flow sends a message and renders assistant reply", async ({
  page,
}) => {
  await page.goto("/chat");

  await expect(
    page.getByRole("heading", { name: "FlickFocus AI" }),
  ).toBeVisible();

  const messageInput = await waitForChatComposer(page);
  await messageInput.fill("Recommend a sci-fi movie");
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("Recommend a sci-fi movie")).toBeVisible();
  await expect(
    page.getByText("Here are a few sci-fi picks worth watching tonight."),
  ).toBeVisible({ timeout: 15_000 });
});

test("chat page exposes accessible composer controls", async ({ page }) => {
  await page.goto("/chat");

  const messageInput = await waitForChatComposer(page);
  await expect(messageInput).toBeEnabled();
  await expect(page.getByRole("button", { name: "Send message" })).toBeDisabled();
});
