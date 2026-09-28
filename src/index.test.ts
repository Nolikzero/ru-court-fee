import { expect, test } from "bun:test";
import { consumerClaimFee, courtOrderFee, fixedFee, propertyClaimFee } from "./index";

test("СОЮ", () => {
  expect(propertyClaimFee(50_000)).toBe(4_000);
  expect(propertyClaimFee(250_000)).toBe(8_500);
  expect(propertyClaimFee(1_500_000)).toBe(30_000);
  expect(propertyClaimFee(10_000_000_000)).toBe(900_000);
});
test("арбитраж", () => {
  expect(propertyClaimFee(250_000, "arbitration")).toBe(17_500);
  expect(propertyClaimFee(5_000_000, "arbitration")).toBe(175_000);
  expect(propertyClaimFee(1e12, "arbitration")).toBe(10_000_000);
});
test("потребитель и приказ", () => {
  expect(consumerClaimFee(900_000)).toBe(0);
  expect(consumerClaimFee(1_500_000)).toBe(30_000 - 25_000);
  expect(courtOrderFee(250_000)).toBe(4_250);
  expect(fixedFee("nonProperty", "individual")).toBe(3_000);
});
