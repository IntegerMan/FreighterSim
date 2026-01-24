/**
 * Credits Store API Contract
 * Feature: 005-player-credits
 * 
 * This defines the public API for credits functionality in gameStore.
 * Implementation must satisfy this contract.
 */

// ============================================
// Constants
// ============================================

/** Initial credit balance for new game sessions */
export const INITIAL_CREDITS = 10_000;

/** Maximum supported credit value (for display formatting) */
export const MAX_CREDITS = 999_999_999;

// ============================================
// State Interface (extends existing GameStore)
// ============================================

export interface CreditsState {
  /** 
   * Player's current credit balance
   * @default 10_000 (set via initialize())
   * @minimum 0 (future: may allow negative for debt)
   * @maximum 999_999_999
   */
  credits: number;
}

// ============================================
// Computed Properties
// ============================================

export interface CreditsComputed {
  /**
   * Credits formatted with thousands separators for display
   * @example "10,000" for credits = 10000
   * @example "999,999,999" for credits = 999999999
   */
  formattedCredits: string;
}

// ============================================
// Actions (for future features)
// ============================================

export interface CreditsActions {
  /**
   * Spend credits (subtract from balance)
   * @param amount - Amount to spend (must be positive)
   * @returns true if successful, false if insufficient funds
   * @future This action will be implemented with trading/upgrade features
   */
  // spendCredits(amount: number): boolean;

  /**
   * Earn credits (add to balance)
   * @param amount - Amount to earn (must be positive)
   * @returns true if successful, false if would exceed MAX_CREDITS
   * @future This action will be implemented with trading/contract features
   */
  // earnCredits(amount: number): boolean;
}

// ============================================
// Store Modifications
// ============================================

/**
 * Changes to existing gameStore.initialize():
 * - MUST set credits to INITIAL_CREDITS (10,000)
 */

/**
 * Changes to existing gameStore.reset():
 * - MUST set credits to 0
 */

// ============================================
// Formatting Utility
// ============================================

/**
 * Format credits with locale-aware thousands separators
 * @param amount - Credit amount to format
 * @returns Formatted string (e.g., "10,000")
 */
export function formatCredits(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount);
}

// ============================================
// Validation
// ============================================

/**
 * Validate credit amount is within acceptable range
 * @param amount - Amount to validate
 * @returns true if valid
 */
export function isValidCreditAmount(amount: number): boolean {
  return Number.isInteger(amount) && amount >= 0 && amount <= MAX_CREDITS;
}
