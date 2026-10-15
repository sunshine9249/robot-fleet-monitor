export const lerp = (start, end, amt: number): number => {
  return (1 - amt) * start + amt * end;
};
