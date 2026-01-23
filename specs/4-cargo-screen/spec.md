# Feature Specification: Cargo Screen

**Feature Branch**: `4-cargo-screen`  
**Created**: January 22, 2026  
**Status**: Draft  
**Input**: User description: "SKY-4: Add a cargo screen - I'd like to be able to see the cargo in the cargo bay as well as the available space left in the cargo bay so I know what I'm carrying and how much room I have."

## Clarifications

### Session 2026-01-22

- Q: How should the cargo display represent individual cargo units—grid of visual boxes or aggregated list? → A: Option A — distinct grid of boxes using canvas placeholders; no manual placement or strict layout consistency required.
- Q: What should be the cargo capacity metric for v1? → A: Slot count (crate-based); no physical units in v1. Weight effects deferred and out-of-scope for this feature.
- Q: Where should the Cargo Screen live in the UI? → A: Its own CARGO screen, navigable from the main stations navigation list (Bridge, Helm, Sensors, Cargo) and listed last.
- Q: Should the Cargo Screen update in real-time for non-player events? → A: Option B — Player + system events (NPCs, scripts, auto-transfer). This will be rare but ensures authoritative state.
- Q: Do cargo models already exist? → A: No. Cargo Item and Cargo Bay models need to be created. Cargo Bay is a new ship component with variable width and depth (determining slot count and visual grid layout).
- Q: Should each cargo item occupy exactly 1 slot, or can some occupy multiple slots? → A: Option A — 1 slot per cargo item. All cargo occupies exactly 1 slot regardless of type.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Cargo Inventory (Priority: P1)

As a ship captain, I need to see what cargo items are currently in my cargo bay so I can manage my inventory and understand what resources are available for trading or missions.

**Why this priority**: Having a cargo screen helps immerse the player in the game, reminds them of what is aboard, tells them how much additional space they have, and drives their decisions on buying and selling. Implementing this feature sets us up for trading features in the future which is a core part of the game.

**Independent Test**: Can be fully tested by navigating to the cargo screen and verifying that loaded cargo items are displayed with accurate quantities, and this delivers the value of cargo visibility.

**Acceptance Scenarios**:

1. **Given** a ship with cargo loaded in the cargo bay, **When** the captain accesses the cargo screen, **Then** all cargo items are displayed with their names and quantities in a graphical 2D grid representing the cargo bay.
2. **Given** a ship with multiple different cargo types, **When** viewing the cargo screen, **Then** each cargo type is shown as a separate box with accurate quantities
3. **Given** a ship with multiple cargo units of the same type, **When** viewing the cargo screen, **Then** the cargo item is shown multiple times to illustrate the multiple units of cargo aboard the ship.
4. **Given** an empty cargo bay, **When** viewing the cargo screen, **Then** the screen displays a clear indication that no cargo is present
5. **Given** cargo is loaded during gameplay, **When** the cargo screen is viewed after loading, **Then** the newly loaded cargo appears in the cargo bay

---

### User Story 2 - View Available Cargo Space (Priority: P1)

As a ship captain, I need to see how much cargo space is available in my cargo bay so I know if I can accept new cargo offers or complete trade missions without exceeding my capacity.

**Why this priority**: This is equally critical as viewing current cargo. Without knowing available space, captains cannot make trading decisions. This completes the MVP and is essential for gameplay progression.

**Independent Test**: Can be fully tested by viewing the cargo capacity information on the cargo screen and verifying it accurately reflects available vs. used space, delivering the value of capacity awareness.

**Acceptance Scenarios**:

1. **Given** a ship with partially filled cargo bay, **When** viewing the cargo screen, **Then** the available space remaining is clearly displayed
2. **Given** a fully loaded cargo bay, **When** viewing the cargo screen, **Then** the available space shows zero or indicates the bay is at full capacity
3. **Given** an empty cargo bay, **When** viewing the cargo screen, **Then** the available space equals the total cargo capacity
4. **Given** cargo is unloaded during gameplay, **When** the cargo screen is viewed after unloading, **Then** the available space increases accordingly

---

### User Story 3 - Visual Capacity Indicator (Priority: P2)

As a ship captain, I want to see a visual representation of cargo capacity (such as a progress bar or percentage) so I can quickly assess my cargo bay status at a glance without reading detailed numbers.

**Why this priority**: This enhances usability by providing quick visual feedback. While valuable for improving the user experience, this is a secondary priority compared to the core cargo and space information.

**Independent Test**: Can be fully tested by verifying the visual indicator (progress bar, gauge, or percentage display) accurately represents the ratio of used to total cargo space and updates correctly as cargo changes.

**Acceptance Scenarios**:

1. **Given** a cargo bay at different fill levels, **When** viewing the cargo screen, **Then** a visual indicator (progress bar/gauge) shows the proportion of capacity used
2. **Given** cargo being loaded or unloaded, **When** the visual indicator is observed, **Then** it updates in real-time to reflect current capacity
3. **Given** various cargo bay sizes across different ships, **When** the visual indicator is viewed, **Then** it remains consistent and accurate regardless of total capacity

---

### Edge Cases

- What happens when the cargo bay capacity is exceeded (should not be possible, but display should be robust)?
- How does the system handle very large quantities of a single cargo type (e.g., stacks exceeding typical display widths)?
- What occurs if cargo data becomes inconsistent or corrupted during gameplay?
- How should the screen behave when cargo is being actively loaded or unloaded (transient states)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a list of all cargo items currently in the cargo bay, including item name and quantity
- **FR-002**: System MUST display the total capacity of the cargo bay
- **FR-003**: System MUST calculate and display remaining available cargo space as slot count (total slots minus occupied slots)
- **FR-004**: System MUST update the cargo display in real-time when cargo is loaded or unloaded during gameplay (player actions and system events such as NPC transfers or scripts)
- **FR-005**: System MUST display a clear indication when the cargo bay is empty
- **FR-006**: System MUST display a visual indicator of cargo bay capacity usage (such as a progress bar, percentage, or gauge)
- **FR-007**: System MUST handle display of multiple cargo types simultaneously without visual overlap or truncation issues
- **FR-008**: System MUST display cargo information in the context of the existing bridge/helm interface (consistent with LCARS design system)
- **FR-009**: System MUST be accessible as its own CARGO screen from the main stations navigation list (Bridge, Helm, Sensors, Cargo), appearing as the last option.
- **FR-010**: System MUST render each cargo unit as an individual box in a 2D grid, using Canvas shapes as placeholders (crate graphics to be added in a future iteration). Layout is automatic; manual placement and strict positional consistency are not required.

### Key Entities

- **Cargo Item**: Represents a single unit of cargo occupying exactly 1 slot, with attributes:
  - Name (string): Identifies the cargo type (e.g., "Dilithium Crystals", "Medical Supplies")
  - Type (string): Category or classification of cargo (e.g., "mineral", "supply", "hazmat")
  
  *Note: Each cargo item occupies 1 slot. Multiple units of the same type are stored as separate items.*
  
- **Cargo Bay**: A new ship component representing the cargo storage system with attributes:
  - Width (number): Number of slots across the bay (columns)
  - Depth (number): Number of slots deep in the bay (rows)
  - Total Slots (number): Derived from Width × Depth; maximum storage slots the bay can hold
  - Occupied Slots (number): Slots currently in use
  - Available Slots (number): Derived from Total Slots minus Occupied Slots
  - Cargo Items (list): Collection of Cargo Item entities currently loaded
  
  *Note: Different ships may have cargo bays with different dimensions, affecting both capacity and visual grid layout.*

## Success Criteria *(mandatory)*

1. **Feature Visibility**: Cargo screen is accessible within 2 clicks from the main bridge interface and displays cargo information consistently with other bridge panels
2. **Data Accuracy**: Displayed cargo quantities and available space match the authoritative game state with 100% accuracy, updated synchronously with cargo loading/unloading events
3. **User Awareness**: Players can determine what cargo they're carrying and remaining capacity within 5 seconds of viewing the cargo screen
4. **Visual Consistency**: Cargo screen follows the established LCARS design system and matches the visual style of existing bridge panels (DockingPanel, SensorPanel, NavigationPanel)
5. **Real-time Updates**: Cargo display updates within 100ms of cargo being loaded or unloaded
6. **Desktop Layout**: Cargo screen remains readable and functional across desktop viewport sizes (≥1024px width) and ship configurations without scrolling or truncation issues. Mobile/tablet responsive design deferred to future iteration.

## Assumptions

- Cargo Item and Cargo Bay data models do not currently exist and must be created as part of this feature. Cargo Bay is a new ship component.
- Cargo capacity is measured by slot count (number of storage slots). Physical units (mass/volume) are not used in v1. Future weight may impact ship physics but is out-of-scope for this feature.
- The cargo bay UI will be implemented as a new Vue component following the existing pattern used by DockingPanel, SensorPanel, and NavigationPanel
- Players will access the cargo screen as a dedicated CARGO view via the stations navigation list (Bridge, Helm, Sensors, Cargo). It is a standalone view routed like other stations and listed last.
- Cargo items have a defined "Type" or category system already in place for organization purposes
- The LCARS design system (defined in ADR-0005) is the authoritative visual standard for all UI elements
- Initial visual representation uses Canvas rectangles to simulate crates; detailed crate graphics are deferred to a future iteration.
