/** 문자열 enum 에서 같은 값이 두 번 쓰이지 않았는지 개발 중에 확인합니다 */
export function checkDuplicateEnumValues(
  name: string,
  inputEnum: Record<string, string>,
) {
  if (process.env.NODE_ENV === "development") {
    const seen = new Map<string, string>();
    for (const [key, value] of Object.entries(inputEnum)) {
      const previous = seen.get(value);
      if (previous !== undefined) {
        throw new Error(
          `Duplicate enum entries "${previous}", "${key}" with same value '${value}' found in enum "${name}"`,
        );
      }
      seen.set(value, key);
    }
  }
}
