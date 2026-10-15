import ky, { HTTPError } from "ky";
import { auth } from "./auth";

/** 인증 헤더 없이 쓰는 기본 인스턴스 (로그인·토큰 재발급) */
export const publicApi = ky.create({
  timeout: 15000,
});

export const baseApi = publicApi.extend({
  hooks: {
    beforeRequest: [
      (request) =>
        request.headers.set("Authorization", `Bearer ${auth.getAccessToken()}`),
    ],
  },
});

export function removeEmptyFields<T extends Record<string, any>>(
  data: T,
): Partial<T> {
  const obj: Partial<T> = {};
  for (const key in data) {
    if (data[key] !== "" && data[key] !== null) {
      obj[key] = data[key];
    }
  }
  return obj;
}

/** 서버가 내려준 에러 문구. 없으면 기본 문구 */
export async function getErrorMessage(
  error: unknown,
  fallback = "요청을 처리하지 못했습니다.",
): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const data = await error.response.clone().json();
      if (typeof data?.message === "string") return data.message;
    } catch {
      // 본문이 JSON 이 아니면 기본 문구
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export { HTTPError };
