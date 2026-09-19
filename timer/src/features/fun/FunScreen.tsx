import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { ModeSelect, type ModeOption } from '../../components/ModeSelect';
import { ReactionGame } from './ReactionGame';
import { TypingGame } from './TypingGame';
import { PixelCanvas } from './PixelCanvas';
import { BubbleWrap } from './BubbleWrap';
import { HackerTerminal } from './HackerTerminal';
import { GameOfLife } from './GameOfLife';
import { DvdScreensaver } from './DvdScreensaver';
import { KeyboardSound } from './KeyboardSound';
import { FogWipe } from './FogWipe';
import { AdminConsole } from './AdminConsole';
import { AdminArcade } from './AdminArcade';
import { ColorMemory, GhostHunt, GoldClicker, IdlePatience, PrecisionStop, StarCatch } from './secretGames';

type Mode =
  | 'reaction'
  | 'typing'
  | 'doodle'
  | 'bubble'
  | 'hacker'
  | 'life'
  | 'dvd'
  | 'keysound'
  | 'fog'
  | 'admin'
  | 'admin-arcade'
  | 'egg-ghost'
  | 'egg-gold'
  | 'egg-patience'
  | 'egg-memory'
  | 'egg-precision'
  | 'egg-star';

const BASE_MODES: ModeOption<Mode>[] = [
  { key: 'reaction', label: '⚡ 반응속도' },
  { key: 'typing', label: '⌨️ 타자연습' },
  { key: 'doodle', label: '🎨 낙서장' },
  { key: 'bubble', label: '🫧 뽁뽁이' },
  { key: 'hacker', label: '💻 해킹 터미널' },
  { key: 'life', label: '🌀 멍때리기' },
  { key: 'dvd', label: '📀 DVD' },
  { key: 'keysound', label: '🎹 타건감' },
  { key: 'fog', label: '💨 김서림' },
];

const ADMIN_MODES: ModeOption<Mode>[] = [
  { key: 'admin', label: '🛡️ 관리자', dividerBefore: true },
  { key: 'admin-arcade', label: '👑 관리자 아케이드' },
];

// each secret mascot gets exactly one exclusive fun mode, shown only while
// that character is the one currently equipped - EXCEPT for the admin
// account, which gets every one of these regardless of which mascot is worn.
const SECRET_GAME_LIST: { characterId: string; key: Mode; label: string; Component: ComponentType }[] = [
  { characterId: 'rip-sq1', key: 'egg-ghost', label: '👻 유령 숨바꼭질', Component: GhostHunt },
  { characterId: 'gold-cube', key: 'egg-gold', label: '🪙 황금 클리커', Component: GoldClicker },
  { characterId: 'lazy-cat', key: 'egg-patience', label: '😴 인내심 테스트', Component: IdlePatience },
  { characterId: 'rainbow-cube', key: 'egg-memory', label: '🌈 레인보우 기억력', Component: ColorMemory },
  { characterId: 'lightning-cube', key: 'egg-precision', label: '⚡ 정지 챌린지', Component: PrecisionStop },
  { characterId: 'shooting-star', key: 'egg-star', label: '🌠 소원 잡기', Component: StarCatch },
];

interface Props {
  mascotCharacter?: string;
  isAdmin?: boolean;
}

export function FunScreen({ mascotCharacter, isAdmin = false }: Props) {
  // admin gets every secret mini game regardless of equipped mascot; everyone
  // else only gets the one matching whichever secret mascot is equipped
  const unlockedSecretGames = isAdmin ? SECRET_GAME_LIST : SECRET_GAME_LIST.filter((g) => g.characterId === mascotCharacter);
  const eggModes: ModeOption<Mode>[] = unlockedSecretGames.map((g, i) => ({ key: g.key, label: g.label, dividerBefore: i === 0 }));
  const modes = [...BASE_MODES, ...eggModes, ...(isAdmin ? ADMIN_MODES : [])];
  const [mode, setMode] = useState<Mode>('reaction');

  useEffect(() => {
    if ((mode === 'admin' || mode === 'admin-arcade') && !isAdmin) setMode('reaction');
    if (mode.startsWith('egg-') && !unlockedSecretGames.some((g) => g.key === mode)) setMode('reaction');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isAdmin, mascotCharacter]);

  return (
    <div className="screen">
      <ModeSelect value={mode} options={modes} onChange={setMode} />

      {mode === 'reaction' && <ReactionGame />}
      {mode === 'typing' && <TypingGame />}
      {mode === 'doodle' && <PixelCanvas />}
      {mode === 'bubble' && <BubbleWrap />}
      {mode === 'hacker' && <HackerTerminal />}
      {mode === 'life' && <GameOfLife />}
      {mode === 'dvd' && <DvdScreensaver />}
      {mode === 'keysound' && <KeyboardSound />}
      {mode === 'fog' && <FogWipe />}
      {mode === 'admin' && isAdmin && <AdminConsole />}
      {mode === 'admin-arcade' && isAdmin && <AdminArcade />}
      {unlockedSecretGames.map((g) => mode === g.key && <g.Component key={g.key} />)}
    </div>
  );
}
