import { baseApi } from "../utils/api";

/**
 * 인증 헤더가 붙은 API 클라이언트.
 * 훅 모양을 유지하는 이유는 나중에 사용자·조직별 헤더가 필요해지면 여기서
 * 컨텍스트를 읽어 붙이기 위해서입니다.
 */
export function useApi() {
  return baseApi;
}
