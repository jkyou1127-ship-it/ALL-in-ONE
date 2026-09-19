export const TYPING_PHRASES: string[] = [
  '손가락아 힘내라',
  '오늘도 큐브 화이팅',
  '느려도 꾸준히 가자',
  '다음 솔브는 더 빠르게',
  '알고리즘은 손이 기억한다',
  '스크램블 앞에서 침착하게',
  '연습은 배신하지 않는다',
  '이번 판은 감이 좋다',
  '손목 스트레칭도 잊지 말기',
  '집중력 최고치 갱신',
  '커브 안쪽 이 게임',
  '타자도 큐브처럼 빠르게',
  '오늘 목표는 신기록',
  '쉬었다 다시 시작하자',
  '한 큐브 한 큐브 정성껏',
];

export function randomPhrase(excluding?: string): string {
  if (TYPING_PHRASES.length <= 1) return TYPING_PHRASES[0];
  let next = TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)];
  while (next === excluding) {
    next = TYPING_PHRASES[Math.floor(Math.random() * TYPING_PHRASES.length)];
  }
  return next;
}
