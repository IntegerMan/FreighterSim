# Feature Specification: 2D Ship and Station Shape System

**Feature Branch**: `005-2d-shape-system`  
**Created**: January 23, 2026  
**Status**: Draft  
**Input**: User description: "To give detail to the world and particularly the sensor station, I'd like the ships and the stations to have actual 2D shapes and not just be dots and circles in the game world. This will impact collision detection on helm station, eventually impact docking at helm station with dedicated docking areas on stations, and will impact sensors as objects will be complex and need raytracing. Ships should have dedicated spots for engines that will generate the noise that appears on sensors, and the player's ship should have a central engine and two engines on the left and right. The player's ship should resemble Serenity from Firefly."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Detailed Ship and Station Shapes (Priority: P1)

As a player at the sensors station, I want to see ships and stations rendered as detailed 2D shapes rather than simple dots or circles, so that I can better identify and distinguish objects in space and feel more immersed in the game world.

**Why this priority**: This is the foundational visual change that enables all other features. Without visible shapes, players cannot appreciate the distinction between different vessel types or understand where docking ports and engine locations are.

**Independent Test**: Can be fully tested by viewing the sensor display and observing that the player's ship appears as a Serenity-inspired silhouette, other ships have distinct shapes, and stations have recognizable structures with visible docking areas.

**Acceptance Scenarios**:

1. **Given** I am at the sensors station, **When** I view the radar/map display, **Then** I see the player's ship rendered as a detailed Serenity-inspired shape with visible hull outline
2. **Given** I am at the sensors station, **When** other ships appear on sensors, **Then** they display as distinct 2D shapes rather than simple circles
3. **Given** I am at the sensors station, **When** I view a station, **Then** it displays as a complex 2D shape with identifiable docking areas

---

### User Story 2 - Identify Engine Locations via Sensor Noise (Priority: P2)

As a player at the sensors station, I want to see sensor noise/particle traces emanating from specific engine locations on ships, so that I can identify active vessels and understand their propulsion configuration.

**Why this priority**: Engine-based sensor signatures add gameplay depth to the sensor station by providing meaningful information about ship activity. This builds on the existing particle trace system but ties it to specific ship geometry.

**Independent Test**: Can be fully tested by observing that the player's ship shows three distinct engine trace origins (center, left, right) and other ships show trace emissions from their designated engine points.

**Acceptance Scenarios**:

1. **Given** the player's ship has engines active, **When** I view sensors, **Then** I see particle traces emanating from three distinct points: one central engine and two side engines (port and starboard)
2. **Given** another ship is moving, **When** I view that ship on sensors, **Then** particle traces originate from that ship's designated engine positions rather than its center point
3. **Given** a ship's engine is off, **When** I view sensors, **Then** no particle trace appears from that engine location

---

### User Story 3 - Collision Detection with Ship Shapes (Priority: P3)

As a player at the helm station, I want collisions to be detected based on actual ship and station shapes, so that I have a more realistic piloting experience where I must navigate around the true outlines of objects.

**Why this priority**: Accurate collision detection creates meaningful navigation challenges and is prerequisite for docking. However, it requires the shape system to be in place first and impacts gameplay difficulty.

**Independent Test**: Can be fully tested by piloting the ship near obstacles and verifying that collision warnings/events trigger based on hull proximity, not center-point distance.

**Acceptance Scenarios**:

1. **Given** I am piloting at helm, **When** my ship's hull approaches another object's hull, **Then** collision detection triggers based on the actual shape boundaries
2. **Given** I am piloting near a station, **When** I pass close to a docking arm without touching it, **Then** no collision occurs even if my center point is within the station's bounding circle
3. **Given** my ship's wing tip touches an asteroid, **When** the contact occurs, **Then** the collision is detected at the actual contact point

---

### User Story 4 - Docking at Designated Docking Areas (Priority: P4)

As a player at the helm station, I want to dock my ship at designated docking ports on stations, so that docking feels realistic and requires me to align my ship properly with specific station infrastructure.

**Why this priority**: Docking gameplay adds depth to station interactions but depends on having both shapes and collision detection working first. This is an enhancement to the core piloting experience.

**Independent Test**: Can be fully tested by approaching a station's docking port, aligning the ship correctly, and successfully initiating a docking sequence at the designated docking area.

**Acceptance Scenarios**:

1. **Given** I am approaching a station, **When** I view the station shape, **Then** I can identify designated docking port locations visually
2. **Given** I am aligned with a docking port, **When** I am within docking range and orientation, **Then** I can initiate the docking procedure
3. **Given** I approach the station but not at a docking port, **When** I attempt to dock, **Then** docking is not available and I must reposition

---

### User Story 5 - Raytracing for Complex Sensor Contacts (Priority: P5)

As a player at the sensors station, I want the sensor system to use raytracing against complex object shapes, so that sensor occlusion and detection feels realistic with objects potentially blocking sensor rays.

**Why this priority**: Raytracing adds tactical depth to sensors but is the most complex feature and builds on all previous work. It creates interesting gameplay where ship orientation and obstacles affect sensor effectiveness.

**Independent Test**: Can be fully tested by positioning objects between the sensor origin and a target, then verifying that the target's sensor contact is affected by the obstruction.

**Acceptance Scenarios**:

1. **Given** a ship is behind a station from my sensor perspective, **When** sensors scan that area, **Then** the ship may be partially or fully obscured based on the station's shape blocking sensor rays
2. **Given** I am scanning a complex-shaped ship, **When** the scan completes, **Then** the sensor contact reflects the ship's actual shape profile
3. **Given** an object rotates, **When** sensors update, **Then** the detected shape profile changes to reflect the new orientation

---

### Edge Cases

- What happens when a ship's shape data is missing or corrupted? (Fallback to simple circle representation)
- How does the system handle very large stations with many docking ports? (Prioritize nearest/visible ports)
- What happens during high-speed movement when shapes might clip through each other between frames? (Use swept collision detection)
- How does the system handle ships at extreme distances where shapes would be sub-pixel? (Transition to point rendering at distance threshold)
- What happens if the player's ship is damaged? (Shape remains consistent; damage is a future feature)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support defining 2D polygon shapes for all ships and stations
- **FR-002**: System MUST render the player's ship as a Serenity-inspired shape with a recognizable silhouette including main body, side engine pods, and forward cockpit area
- **FR-003**: System MUST render stations as complex 2D shapes with visually distinct docking areas
- **FR-004**: System MUST support defining multiple engine mount points per ship shape
- **FR-005**: Player's ship MUST have exactly three engine positions: one central and two side engines (port and starboard)
- **FR-006**: Particle traces from the existing sensor system MUST originate from defined engine positions rather than ship center
- **FR-007**: System MUST perform collision detection using actual shape boundaries rather than simple radius checks
- **FR-008**: System MUST support defining docking port positions and orientations on station shapes
- **FR-009**: Docking MUST only be available when the player's ship is properly positioned at a designated docking port
- **FR-010**: Sensor raytracing MUST calculate intersections against actual shape polygons
- **FR-011**: System MUST gracefully degrade to simple circle rendering when shape data is unavailable
- **FR-012**: System MUST maintain acceptable performance with multiple complex shapes on screen simultaneously

### Key Entities

- **Shape**: A 2D polygon definition consisting of vertices that define the outline of a ship or station. May contain multiple sub-shapes for complex objects.
- **EngineMount**: A position and direction on a ship shape where engines are located and where particle traces should originate.
- **DockingPort**: A position, orientation, and size on a station shape where ships can dock. Includes approach vector and alignment requirements.
- **ShipTemplate**: A reusable definition combining a shape with engine mounts, used to instantiate ship objects.
- **StationTemplate**: A reusable definition combining a shape with docking ports and other station-specific features.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can visually distinguish between at least 3 different ship types and 2 different station types based on their shapes alone
- **SC-002**: Collision detection accuracy improves to match actual hull boundaries within 5% of the shape outline
- **SC-003**: Players can successfully dock at designated ports within 5 attempts when following visual cues
- **SC-004**: Sensor particle traces visually originate from engine locations with no perceptible offset from the defined mount points
- **SC-005**: System maintains 60 FPS with at least 20 complex-shaped objects rendered simultaneously
- **SC-006**: Player's ship is identifiable as Serenity-inspired by users familiar with Firefly without being told what it represents

## Assumptions

- The existing particle trace system can be extended to support custom origin points without major refactoring
- The current rendering pipeline supports polygon-based shapes
- Shape definitions will be hardcoded initially rather than loaded from external files
- All ships of the same type share the same shape (no individual ship customization)
- Docking is a binary state (docked/undocked) without intermediate docking animations
- Raytracing is 2D and does not account for vertical (z-axis) considerations
