export const MOTIVATIONAL_QUOTES: string[] = [
  '어제보다 0.1초만 더 빠르게.',
  '꾸준함이 스피드를 이긴다.',
  '오늘의 한 판이 내일의 신기록이 된다.',
  '손이 기억할 때까지, 한 번 더.',
  '느려도 괜찮아요, 멈추지만 않으면.',
  '실수한 솔브가 가장 좋은 스승이다.',
  '매일 조금씩, 큐브는 정직하게 답한다.',
  '지금의 슬럼프도 그래프의 일부일 뿐.',
  '완벽한 알고리즘보다 꾸준한 연습.',
  '오늘도 큐브를 잡았다면 이미 잘하고 있는 거예요.',
  '자신의 어제와만 경쟁하세요.',
  '손가락이 외울 때까지 반복하세요.',
  '기록은 거짓말하지 않는다, 연습도 마찬가지.',
  '작은 습관이 큰 평균을 만든다.',
  '오늘 한 솔브, 내일의 자신감.',
];

export function randomQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}
