# Feature Specification: Player Credits System

**Feature Branch**: `005-player-credits`  
**Created**: January 23, 2026  
**Status**: Draft  
**Input**: User description: "You should start the game with 10,000 Credits. This amount should be visible on the bridge and cargo screens as summary information. This will support other features such as buying and selling cargo, upgrading and fixing ships, and taking on contract missions."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Starting Credits (Priority: P1)

As a player starting a new game, I want to see my initial credit balance of 10,000 Credits displayed prominently so that I understand my available financial resources from the beginning.

**Why this priority**: This is the core feature - without visible credits, the player cannot make informed decisions about purchases, contracts, or upgrades. It establishes the foundation for the entire economy system.

**Independent Test**: Can be fully tested by starting a new game and verifying the credit display shows 10,000 Credits on both screens, delivering immediate awareness of financial standing.

**Acceptance Scenarios**:

1. **Given** a new game session, **When** the game initializes, **Then** the player's credit balance is set to 10,000 Credits
2. **Given** a new game session, **When** the player views the Bridge screen, **Then** the credit balance is displayed in the summary information area
3. **Given** a new game session, **When** the player views the Cargo screen, **Then** the same credit balance is displayed in the summary information area

---

### User Story 2 - Credits Persist Across Screen Navigation (Priority: P1)

As a player navigating between different screens, I want my credit balance to remain consistent and visible so that I always know my financial status regardless of which station I'm viewing.

**Why this priority**: Equal to Story 1 because consistent display is essential for usability - credits must be reliably shown across navigation to be useful.

**Independent Test**: Can be tested by navigating between Bridge and Cargo screens multiple times and verifying the credit display remains consistent and accurate.

**Acceptance Scenarios**:

1. **Given** a player on the Bridge screen with a credit balance, **When** navigating to the Cargo screen, **Then** the same credit balance is displayed
2. **Given** a player on the Cargo screen with a credit balance, **When** navigating back to the Bridge screen, **Then** the credit balance remains unchanged
3. **Given** a player rapidly switching between screens, **When** credits are displayed, **Then** no flickering or inconsistent values appear

---

### User Story 3 - Credits Display Formatting (Priority: P2)

As a player, I want my credit balance to be clearly formatted with appropriate visual styling so that I can quickly identify and read the amount.

**Why this priority**: Important for usability but the feature functions without perfect formatting. Proper formatting improves readability and fits the game's aesthetic.

**Independent Test**: Can be tested by viewing the credit display and verifying it uses appropriate number formatting and visual styling consistent with the game's LCARS design.

**Acceptance Scenarios**:

1. **Given** a credit balance of 10,000, **When** displayed, **Then** the amount shows with thousands separators (e.g., "10,000")
2. **Given** the credit display, **When** rendered, **Then** the full word "Credits" is shown after the amount (e.g., "10,000 Credits")
3. **Given** the credit display, **When** rendered, **Then** the styling is consistent with the LCARS design system used throughout the game

---

### Edge Cases

- What happens when credits reach zero? The display should show "0" clearly, not hide or error.
- What happens if credits somehow become negative? **Out of scope** - negative credits (debt) are not supported in this feature. Future debt mechanics would require a separate specification.
- What happens on very small screen sizes? The credit display should remain readable and not overflow or truncate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST initialize player credits to exactly 10,000 when a new game session begins
- **FR-002**: System MUST display the current credit balance on the Bridge screen in a dedicated panel in the left column, positioned above the NavigationPanel
- **FR-003**: System MUST display the current credit balance on the Cargo screen in a dedicated panel in the left column, positioned above the CargoPanel (consistent with Bridge layout)
- **FR-004**: System MUST persist credit balance across screen navigation within the same session
- **FR-005**: Credit display MUST include the full word "Credits" as the currency indicator (e.g., "10,000 Credits")
- **FR-006**: Credit display MUST format large numbers with thousands separators for readability
- **FR-007**: System MUST handle credit values from 0 to at least 999,999,999 (to support future economy features)
- **FR-008**: Credit balance MUST be stored in a way that allows future features to modify it (spending, earning)

### Key Entities

- **Credits**: The player's available currency balance. Represented as a non-negative integer value. Associated with the player/game session. Will be modified by future features (trading, contracts, repairs, upgrades). **Stored in `gameStore.ts`** as session-level state alongside existing session data (`isInitialized`, `elapsedTime`, `currentSystemId`). Initial value defined by `INITIAL_CREDITS` constant (10,000).
- **Credit Display**: A reusable UI component (`CreditsPanel.vue`) that renders the formatted credit amount with the "Credits" label. Implemented as a single shared component in `src/components/panels/` and used on both Bridge and Cargo screens for visual consistency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can see their credit balance within 1 second of any screen loading
- **SC-002**: Credit balance displays identically on Bridge and Cargo screens
- **SC-003**: 100% of new game sessions start with exactly 10,000 Credits
- **SC-004**: Credit display is readable at all supported screen resolutions without truncation
- **SC-005**: Credit balance remains accurate across unlimited screen navigation within a session

## Assumptions

- The default starting amount of 10,000 Credits is fixed for initial implementation (no customization)
- Credits are session-based (no persistence between game sessions until save/load is implemented)
- The credit display location on each screen will follow existing panel/summary patterns
- Integer values are sufficient for credits (no fractional currency)
- The LCARS design system's gold/amber color scheme is appropriate for financial information display

## Clarifications

### Session 2026-01-23

- Q: Where should the player credits be stored in the application state architecture? → A: Extend `gameStore.ts` - add credits as session-level state alongside existing session data
- Q: What currency indicator format should be used for the credit display? → A: Full word format: "10,000 Credits"
- Q: Where exactly should the credit display appear on the Bridge screen? → A: New dedicated panel in the left column, positioned above the NavigationPanel
- Q: Where exactly should the credit display appear on the Cargo screen? → A: New dedicated panel in the left column, above the CargoPanel (mirrors Bridge layout)
- Q: Should the Credit Display be a reusable component shared across screens, or separate implementations per view? → A: Single reusable `CreditsPanel.vue` component used on both screens

