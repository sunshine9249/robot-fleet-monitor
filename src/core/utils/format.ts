import moment from "moment";

export function thousandSeparator(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return num.toLocaleString("ko-KR");
}

/** 초 → "3일 4시간", "2시간 15분", "12분" */
export function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "-";
  }
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  if (minutes > 0) return `${minutes}분`;
  return `${total % 60}초`;
}

export function formatDateTime(
  timestamp: number | null | undefined,
  format = "YYYY-MM-DD HH:mm:ss",
) {
  if (!timestamp) return "-";
  return moment(timestamp).format(format);
}

/** "방금 전", "3분 전" */
export function formatRelative(timestamp: number | null | undefined) {
  if (!timestamp) return "-";
  const diff = Date.now() - timestamp;
  if (diff < 45 * 1000) return "방금 전";
  return moment(timestamp).fromNow();
}

export function formatBytes(bytes: number, decimal = 0) {
  if (bytes === 0) return "0 Bytes";
  const unit = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const idx = Math.floor(Math.log(bytes) / Math.log(unit));
  return `${parseFloat((bytes / Math.pow(unit, idx)).toFixed(decimal))} ${sizes[idx]}`;
}

/**
 * 표의 행을 눌렀을 때 상세로 이동해도 되는지.
 * 체크박스·버튼·링크를 누른 경우에는 행 클릭으로 치지 않습니다.
 */
export function isSafeToOnClickRow(event: React.MouseEvent): boolean {
  const target = event.target as HTMLElement;
  if (window.getSelection()?.toString()) return false;
  return !target.closest(
    "button, a, input, label, .euiCheckbox, [data-no-row-click]",
  );
}

/** 숫자 입력 이벤트 → number (빈 값은 "") */
export function toNumber(event: any): number | "" {
  const value = event?.target ? event.target.value : event;
  return value === "" || value === null || value === undefined
    ? ""
    : Number(value);
}
