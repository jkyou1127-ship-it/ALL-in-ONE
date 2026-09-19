export const HACKER_CODE = `root@core:~# initiating uplink sequence...
[  0.0012 ] booting kernel modules: net, crypto, overlayfs
[  0.0341 ] mounting /dev/sda1 on /mnt/secure  ... OK
[  0.0889 ] spawning subprocess pool (workers=64)
scanning subnet 10.42.0.0/16 for open ports ............ done
found 214 hosts / 3120 open sockets
bruteforcing handshake token: 8f3a9c112e77b0d4  [====......] 41%
bruteforcing handshake token: 8f3a9c112e77b0d4  [========..] 82%
bruteforcing handshake token: 8f3a9c112e77b0d4  [==========] 100% MATCH
>> ACCESS GRANTED :: session=0x9F2C  clearance=ROOT

function decryptPayload(buffer, key) {
  const out = new Uint8Array(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    out[i] = buffer[i] ^ key[i % key.length] ^ (i & 0xff);
  }
  return out;
}

class QuantumTunnel {
  constructor(nodeId) {
    this.nodeId = nodeId;
    this.entangled = new Map();
    this.latency = Math.random() * 2;
  }
  handshake(peer) {
    this.entangled.set(peer.nodeId, Date.now());
    return sha256(peer.nodeId + this.nodeId + SALT);
  }
}

>> redirecting traffic through 7 proxy nodes...
   node[0] 191.24.88.6    RTT 12ms   [ok]
   node[1] 45.9.201.114   RTT 34ms   [ok]
   node[2] 172.66.0.19    RTT 8ms    [ok]
   node[3] 88.198.24.201  RTT 51ms   [ok]
   node[4] 203.0.113.7    RTT 19ms   [ok]
   node[5] 198.51.100.44  RTT 22ms   [ok]
   node[6] 10.10.10.1     RTT 3ms    [ok]
>> tunnel established. encryption=AES-256-GCM  perfect-forward-secrecy=true

SELECT id, username, token FROM sessions WHERE expires_at > NOW();
UPDATE firewall_rules SET action = 'ALLOW' WHERE port IN (22,443,8080);
DROP TABLE IF EXISTS access_log; -- clearing traces

WARNING: intrusion detection system triggered on node[3]
>> deploying countermeasure... obfuscating MAC address
>> countermeasure deployed. IDS status: BLINDED

def exfiltrate(target, chunk_size=4096):
    with open(target, 'rb') as f:
        while chunk := f.read(chunk_size):
            packet = encrypt(chunk, session_key)
            send_over_covert_channel(packet)
            yield len(packet)

>> transferring classified_files.tar.gz  [██████████████████░░] 91%
>> transferring classified_files.tar.gz  [██████████████████████] 100%
>> checksum verified: 4a7d1ed414474e4033ac29ccb8653d9b

root@core:~# whoami
> nobody (but the logs will say otherwise)

>> wiping temporary artifacts... 4096 files shredded
>> restoring system clock to original offset
>> connection closed gracefully. no traces left.

SYSTEM: all objectives complete. session duration 00:04:12
`.repeat(3);
