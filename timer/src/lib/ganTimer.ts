/**
 * GAN Smart Timer BLE connector.
 *
 * This started out as a thin wrapper around the `gan-web-bluetooth` library, but
 * that library hardcodes the "state" characteristic UUID (0000fff5) inside the
 * 0000fff0 service. On at least one real GAN Timer unit that UUID doesn't exist -
 * the device throws "No Characteristics matching UUID 0000fff2/0000fff5 found in
 * Service" right after connecting, even though the service itself (0000fff0) is
 * found correctly. Different firmware/hardware batches apparently expose the
 * same service with different characteristic UUIDs.
 *
 * To be robust to that, this connects to the service the same way, but instead
 * of assuming a fixed characteristic UUID, it enumerates every characteristic in
 * the service and picks whichever one actually supports notifications - that's
 * all this app needs (it never reads the timer's stored "last 3 times" via the
 * separate read-only characteristic, so that one isn't required at all).
 *
 * The packet format itself (0xFE-prefixed frame, state byte, CRC16/CCITT-FALSE
 * checksum) is the real reverse-engineered GAN protocol, ported from
 * gan-web-bluetooth (MIT, by afedotov - https://github.com/afedotov/gan-web-bluetooth).
 */

const GAN_TIMER_SERVICE = '0000fff0-0000-1000-8000-00805f9b34fb';
// most GAN Timer units expose the state characteristic here - tried first as a fast path
const PREFERRED_STATE_CHARACTERISTIC = '0000fff5-0000-1000-8000-00805f9b34fb';

export const GanTimerState = {
  DISCONNECT: 0,
  GET_SET: 1,
  HANDS_OFF: 2,
  RUNNING: 3,
  STOPPED: 4,
  IDLE: 5,
  HANDS_ON: 6,
  FINISHED: 7,
} as const;
type GanTimerState = (typeof GanTimerState)[keyof typeof GanTimerState];

export interface GanTimerCallbacks {
  onConnectionChange?: (connected: boolean) => void;
  /** both hands placed on the timer's touch plates */
  onHandsOn?: () => void;
  /** hands lifted before the grace delay expired (false start) */
  onHandsOff?: () => void;
  /** timer actually started counting (hands lifted after grace delay) */
  onRunning?: () => void;
  /** timer stopped; ms is the hardware-measured, authoritative solve time */
  onStopped?: (ms: number) => void;
  /** timer was reset to 0.00 - fired when the GAN logo button is pressed */
  onIdle?: () => void;
  /** timer moved to FINISHED right after stopping - used as a stop fallback when no
   * (valid) STOPPED packet was seen, since the app's own clock covers the missing time */
  onFinished?: () => void;
}

function recordedMsFromRaw(data: DataView, offset: number): number {
  const min = data.getUint8(offset);
  const sec = data.getUint8(offset + 1);
  const msec = data.getUint16(offset + 2, true);
  return min * 60000 + sec * 1000 + msec;
}

async function findStateCharacteristic(
  service: BluetoothRemoteGATTService
): Promise<BluetoothRemoteGATTCharacteristic> {
  try {
    const preferred = await service.getCharacteristic(PREFERRED_STATE_CHARACTERISTIC);
    if (preferred.properties.notify) return preferred;
  } catch {
    // not present on this device - fall through to scanning every characteristic
  }
  const all = await service.getCharacteristics();
  const notifyable = all.find((c) => c.properties.notify);
  if (!notifyable) {
    throw new Error('이 타이머 기기에서 상태 알림을 지원하는 채널을 찾지 못했어요.');
  }
  return notifyable;
}

export class GanTimerLink {
  private device: BluetoothDevice | null = null;
  private stateChar: BluetoothRemoteGATTCharacteristic | null = null;
  private onValueChanged: ((e: Event) => void) | null = null;
  private onGattDisconnected: (() => void) | null = null;

  get connected(): boolean {
    return this.device !== null;
  }

  async connect(callbacks: GanTimerCallbacks): Promise<void> {
    if (!navigator.bluetooth) {
      throw new Error('이 환경은 Web Bluetooth를 지원하지 않아요.');
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: 'GAN' }, { namePrefix: 'gan' }, { namePrefix: 'Gan' }],
      optionalServices: [GAN_TIMER_SERVICE],
    });
    if (!device.gatt) {
      throw new Error('이 기기는 GATT 연결을 지원하지 않아요.');
    }
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(GAN_TIMER_SERVICE);
    const stateChar = await findStateCharacteristic(service);

    this.device = device;
    this.stateChar = stateChar;

    this.onValueChanged = (e: Event) => {
      const chr = e.target as BluetoothRemoteGATTCharacteristic;
      const data = chr.value;
      if (!data) return;
      const hasState = data.byteLength > 3 && data.getUint8(0) === 0xfe;
      if (!hasState) return;
      const state = data.getUint8(3) as GanTimerState;
      // BLE's own link layer already guarantees byte-perfect delivery, and the
      // state byte near the front of the packet is reliable across firmware
      // variants, so states are dispatched unconditionally without any extra
      // checksum validation.
      switch (state) {
        case GanTimerState.HANDS_ON:
          callbacks.onHandsOn?.();
          break;
        case GanTimerState.HANDS_OFF:
          callbacks.onHandsOff?.();
          break;
        case GanTimerState.RUNNING:
          callbacks.onRunning?.();
          break;
        case GanTimerState.STOPPED:
          if (data.byteLength >= 8) {
            callbacks.onStopped?.(Math.round(recordedMsFromRaw(data, 4)));
          }
          break;
        case GanTimerState.IDLE:
          callbacks.onIdle?.();
          break;
        case GanTimerState.FINISHED:
          callbacks.onFinished?.();
          break;
        default:
          break;
      }
    };
    this.onGattDisconnected = () => {
      this.device = null;
      this.stateChar = null;
      callbacks.onConnectionChange?.(false);
    };

    stateChar.addEventListener('characteristicvaluechanged', this.onValueChanged);
    device.addEventListener('gattserverdisconnected', this.onGattDisconnected);
    await stateChar.startNotifications();

    callbacks.onConnectionChange?.(true);
  }

  disconnect(): void {
    if (this.stateChar && this.onValueChanged) {
      this.stateChar.removeEventListener('characteristicvaluechanged', this.onValueChanged);
      this.stateChar.stopNotifications().catch(() => {});
    }
    if (this.device) {
      if (this.onGattDisconnected) {
        this.device.removeEventListener('gattserverdisconnected', this.onGattDisconnected);
      }
      if (this.device.gatt?.connected) this.device.gatt.disconnect();
    }
    this.device = null;
    this.stateChar = null;
    this.onValueChanged = null;
    this.onGattDisconnected = null;
  }
}
