import { renderHook } from "@testing-library/react";
import hash from "./hash";

const TEST_CONTENT_ONE = "content1";
const TEST_CONTENT_TWO = "content2";

describe("Hash function integrity", () => {
  it("Is hashing correctly", () => {
    expect(hash(TEST_CONTENT_ONE)).toBeTypeOf("number");
  });

  it("Same entry, same output", () => {
    const hashedValue = hash(TEST_CONTENT_ONE);

    expect(hash(TEST_CONTENT_ONE)).toBe(hashedValue);
  });

  it("Different entry, different output", () => {
    const hashedValue = hash(TEST_CONTENT_TWO);

    expect(hash(TEST_CONTENT_ONE)).not.toBe(hashedValue);
  });

  it("Hashed values are same size", () => {
    const hashedValueOne = hash(TEST_CONTENT_ONE).toString();
    const hashedValueTwo = hash(TEST_CONTENT_TWO).toString();

    expect(hashedValueOne).toHaveLength(10);

    expect(hashedValueTwo).toHaveLength(10);

    expect(hashedValueOne).toHaveLength(hashedValueTwo.length);
  });
});
