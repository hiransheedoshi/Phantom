import crypto from 'crypto';
import { EvidenceChainBlock, SecurityEvent } from '../types/cyber';

export const GENESIS_HASH = '0'.repeat(64);

/**
 * The exact byte sequence that is committed to the ledger. Field order is part
 * of the contract: changing it invalidates every existing block.
 */
export function canonicalPayload(event: SecurityEvent): string {
  return JSON.stringify({
    eventId: event.eventId,
    simulationRunId: event.simulationRunId,
    timestamp: event.timestamp,
    targetAssetId: event.targetAssetId,
    eventType: event.eventType,
    evidence: event.evidence,
  });
}

export function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function linkHash(previousHash: string, payloadHash: string, timestamp: string): string {
  return sha256Hex(previousHash + payloadHash + timestamp);
}

export function buildBlock(
  event: SecurityEvent,
  blockIndex: number,
  previousHash: string,
  incidentId: string
): EvidenceChainBlock {
  const payloadCanonicalHash = sha256Hex(canonicalPayload(event));
  return {
    blockIndex,
    timestamp: event.timestamp,
    recordId: `REC-BLCK-${String(blockIndex).padStart(2, '0')}`,
    eventId: event.eventId,
    incidentId,
    payloadCanonicalHash,
    previousHash,
    blockHash: linkHash(previousHash, payloadCanonicalHash, event.timestamp),
    verified: true,
  };
}

export type BlockIntegrity = {
  payloadOk: boolean;
  linkOk: boolean;
  previousHashOk: boolean;
};

/**
 * Re-derives every hash from the event that the block claims to commit, so a
 * modified event or a rewritten block is reported instead of trusted.
 * `payloadOk` is false when the originating event is no longer in the ledger's
 * reach, because the commitment can then no longer be reproduced.
 */
export function checkBlock(
  block: EvidenceChainBlock,
  event: SecurityEvent | undefined,
  expectedPreviousHash: string
): BlockIntegrity {
  const payloadHash = event ? sha256Hex(canonicalPayload(event)) : '';
  const payloadOk = !!event && payloadHash === block.payloadCanonicalHash;
  const linkOk = linkHash(block.previousHash, block.payloadCanonicalHash, block.timestamp) === block.blockHash;
  return { payloadOk, linkOk, previousHashOk: block.previousHash === expectedPreviousHash };
}
