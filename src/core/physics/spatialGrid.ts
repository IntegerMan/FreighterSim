/**
 * Spatial Grid for Broad Phase Collision Detection
 * 
 * A simple grid-based spatial partitioning system for optimizing
 * collision queries with many objects. Currently optional - the
 * base collision system handles typical game loads efficiently.
 * 
 * @module core/physics/spatialGrid
 */

import type { Vector2, BoundingBox } from '@/models';

/**
 * A spatial grid cell containing object references
 */
interface GridCell<T> {
  objects: Set<T>;
}

/**
 * Object with position and bounds for spatial queries
 */
export interface SpatialObject {
  /** World position */
  position: Vector2;
  /** Bounding radius for quick queries */
  boundingRadius: number;
}

/**
 * Result of a spatial query
 */
export interface QueryResult<T> {
  /** Objects found in the query region */
  objects: T[];
  /** Number of cells checked */
  cellsChecked: number;
}

/**
 * A grid-based spatial partitioning structure for broad-phase collision detection.
 * 
 * Divides space into cells and tracks which objects are in each cell.
 * Use for quick "what objects are near point X" queries.
 * 
 * @example
 * ```typescript
 * const grid = new SpatialGrid<Ship>(500); // 500 unit cells
 * 
 * // Insert objects
 * grid.insert(ship, ship.position, ship.size);
 * 
 * // Query nearby objects
 * const nearby = grid.queryRadius(playerPos, 1000);
 * ```
 */
export class SpatialGrid<T> {
  private readonly cells = new Map<string, GridCell<T>>();
  private readonly objectCells = new Map<T, string[]>(); // Track which cells each object is in
  private readonly cellSize: number;
  
  /**
   * Create a new spatial grid
   * @param cellSize - Size of each grid cell in world units
   */
  constructor(cellSize: number = 500) {
    this.cellSize = cellSize;
  }
  
  /**
   * Get or create a cell
   */
  private getOrCreateCell(key: string): GridCell<T> {
    let cell = this.cells.get(key);
    if (!cell) {
      cell = { objects: new Set() };
      this.cells.set(key, cell);
    }
    return cell;
  }
  
  /**
   * Get all cell keys that overlap with a bounding box
   */
  private getCellsForBounds(bounds: BoundingBox): string[] {
    const keys: string[] = [];
    const startX = Math.floor(bounds.minX / this.cellSize);
    const endX = Math.floor(bounds.maxX / this.cellSize);
    const startY = Math.floor(bounds.minY / this.cellSize);
    const endY = Math.floor(bounds.maxY / this.cellSize);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    
    return keys;
  }
  
  /**
   * Insert an object into the grid
   * 
   * @param object - Object to insert
   * @param position - World position
   * @param radius - Bounding radius (object may span multiple cells)
   */
  insert(object: T, position: Vector2, radius: number): void {
    // Remove from old cells first
    this.remove(object);
    
    // Calculate bounds
    const bounds: BoundingBox = {
      minX: position.x - radius,
      maxX: position.x + radius,
      minY: position.y - radius,
      maxY: position.y + radius,
    };
    
    // Insert into all overlapping cells
    const cellKeys = this.getCellsForBounds(bounds);
    for (const key of cellKeys) {
      const cell = this.getOrCreateCell(key);
      cell.objects.add(object);
    }
    
    // Track which cells this object is in
    this.objectCells.set(object, cellKeys);
  }
  
  /**
   * Remove an object from the grid
   */
  remove(object: T): void {
    const cellKeys = this.objectCells.get(object);
    if (cellKeys) {
      for (const key of cellKeys) {
        const cell = this.cells.get(key);
        if (cell) {
          cell.objects.delete(object);
          // Clean up empty cells
          if (cell.objects.size === 0) {
            this.cells.delete(key);
          }
        }
      }
      this.objectCells.delete(object);
    }
  }
  
  /**
   * Update an object's position in the grid
   */
  update(object: T, position: Vector2, radius: number): void {
    this.insert(object, position, radius);
  }
  
  /**
   * Query all objects within a radius of a point
   * 
   * @param center - Query center point
   * @param radius - Query radius
   * @returns Objects found and number of cells checked
   */
  queryRadius(center: Vector2, radius: number): QueryResult<T> {
    const bounds: BoundingBox = {
      minX: center.x - radius,
      maxX: center.x + radius,
      minY: center.y - radius,
      maxY: center.y + radius,
    };
    
    return this.queryBounds(bounds);
  }
  
  /**
   * Query all objects that overlap with a bounding box
   */
  queryBounds(bounds: BoundingBox): QueryResult<T> {
    const cellKeys = this.getCellsForBounds(bounds);
    const found = new Set<T>();
    
    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        for (const obj of cell.objects) {
          found.add(obj);
        }
      }
    }
    
    return {
      objects: Array.from(found),
      cellsChecked: cellKeys.length,
    };
  }
  
  /**
   * Query objects near a point (single cell + neighbors)
   * Faster than queryRadius for small areas
   */
  queryNear(point: Vector2): T[] {
    const centerCell = Math.floor(point.x / this.cellSize);
    const centerRow = Math.floor(point.y / this.cellSize);
    
    const found = new Set<T>();
    
    // Check center cell and 8 neighbors
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${centerCell + dx},${centerRow + dy}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const obj of cell.objects) {
            found.add(obj);
          }
        }
      }
    }
    
    return Array.from(found);
  }
  
  /**
   * Clear all objects from the grid
   */
  clear(): void {
    this.cells.clear();
    this.objectCells.clear();
  }
  
  /**
   * Get grid statistics
   */
  getStats(): { cellCount: number; objectCount: number; avgObjectsPerCell: number } {
    const cellCount = this.cells.size;
    const objectCount = this.objectCells.size;
    
    let totalObjects = 0;
    for (const cell of this.cells.values()) {
      totalObjects += cell.objects.size;
    }
    
    return {
      cellCount,
      objectCount,
      avgObjectsPerCell: cellCount > 0 ? totalObjects / cellCount : 0,
    };
  }
}

/**
 * Create a spatial grid optimized for a given world size
 * 
 * @param worldSize - Approximate world dimensions
 * @param targetCellCount - Desired number of cells across world
 */
export function createOptimizedGrid<T>(
  worldSize: number = 10000,
  targetCellCount: number = 20
): SpatialGrid<T> {
  const cellSize = worldSize / targetCellCount;
  return new SpatialGrid<T>(cellSize);
}
