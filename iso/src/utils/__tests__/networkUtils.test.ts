import { describe, test, expect } from 'vitest';
import { generateMockNetwork, isolateBatch } from '../networkUtils';

describe('Network Generation', () => {
  test('generates correct number of components', () => {
    const { systems, connectors, interfaces } = generateMockNetwork(5, 8, 4);
    
    expect(systems).toHaveLength(5);
    expect(connectors).toHaveLength(8);
    expect(interfaces).toHaveLength(4);
  });

  test('systems have valid attributes', () => {
    const { systems } = generateMockNetwork(5, 8, 4);
    
    systems.forEach(system => {
      expect(system.id).toMatch(/^s\d+$/);
      expect(system.name).toMatch(/^System \d+$/);
      expect(system.attributes.load).toBeGreaterThanOrEqual(0);
      expect(system.attributes.load).toBeLessThanOrEqual(100);
      expect(system.attributes.priority).toBeGreaterThanOrEqual(1);
      expect(system.attributes.priority).toBeLessThanOrEqual(5);
    });
  });

  test('connectors are properly linked', () => {
    const { systems, connectors, interfaces } = generateMockNetwork(5, 8, 4);
    
    connectors.forEach(connector => {
      // Check system linkage
      expect(systems.some(s => s.id === connector.systemId)).toBeTruthy();
      
      // Check interface linkage
      connector.interfaceIds.forEach(interfaceId => {
        expect(interfaces.some(i => i.id === interfaceId)).toBeTruthy();
      });
    });
  });

  test('interfaces have valid connections', () => {
    const { connectors, interfaces } = generateMockNetwork(5, 8, 4);
    
    interfaces.forEach(iface => {
      iface.connectorIds.forEach(connectorId => {
        expect(connectors.some(c => c.id === connectorId)).toBeTruthy();
      });
    });
  });
});

describe('Batch Isolation - Load Based', () => {
  test('isolates correct batch size', () => {
    const network = generateMockNetwork(10, 15, 8);
    const batchSize = 3;
    
    const isolatedBatch = isolateBatch(
      network.systems,
      network.connectors,
      network.interfaces,
      batchSize,
      'load'
    );
    
    expect(isolatedBatch).toHaveLength(batchSize);
  });

  test('isolates systems with highest load', () => {
    const network = generateMockNetwork(5, 8, 4);
    const batchSize = 2;
    
    const isolatedBatch = isolateBatch(
      network.systems,
      network.connectors,
      network.interfaces,
      batchSize,
      'load'
    );
    
    // Verify that isolated systems have higher or equal load than non-isolated ones
    const nonIsolatedSystems = network.systems.filter(
      s => !isolatedBatch.some(is => is.id === s.id)
    );
    
    const minIsolatedLoad = Math.min(...isolatedBatch.map(s => s.attributes.load));
    const maxNonIsolatedLoad = Math.max(...nonIsolatedSystems.map(s => s.attributes.load));
    
    expect(minIsolatedLoad).toBeGreaterThanOrEqual(maxNonIsolatedLoad);
  });
});

describe('Batch Isolation - Priority Based', () => {
  test('isolates systems with highest priority', () => {
    const network = generateMockNetwork(5, 8, 4);
    const batchSize = 2;
    
    const isolatedBatch = isolateBatch(
      network.systems,
      network.connectors,
      network.interfaces,
      batchSize,
      'priority'
    );
    
    // Verify that isolated systems have higher or equal priority than non-isolated ones
    const nonIsolatedSystems = network.systems.filter(
      s => !isolatedBatch.some(is => is.id === s.id)
    );
    
    const minIsolatedPriority = Math.min(...isolatedBatch.map(s => s.attributes.priority));
    const maxNonIsolatedPriority = Math.max(...nonIsolatedSystems.map(s => s.attributes.priority));
    
    expect(minIsolatedPriority).toBeGreaterThanOrEqual(maxNonIsolatedPriority);
  });
});

describe('Network Stability', () => {
  test('maintains network connectivity after isolation', () => {
    const network = generateMockNetwork(10, 15, 8);
    const batchSize = 3;
    
    const isolatedBatch = isolateBatch(
      network.systems,
      network.connectors,
      network.interfaces,
      batchSize,
      'load'
    );
    
    // Check that remaining systems still have connections
    const remainingSystems = network.systems.filter(
      s => !isolatedBatch.some(is => is.id === s.id)
    );
    
    remainingSystems.forEach(system => {
      const systemConnectors = network.connectors.filter(c => c.systemId === system.id);
      expect(systemConnectors.length).toBeGreaterThan(0);
      
      const connectedInterfaces = new Set(
        systemConnectors.flatMap(c => c.interfaceIds)
      );
      expect(connectedInterfaces.size).toBeGreaterThan(0);
    });
  });

  test('balanced distribution of connections', () => {
    const network = generateMockNetwork(5, 10, 4);
    
    // Check if interfaces have a relatively balanced number of connections
    const connectionCounts = network.interfaces.map(i => i.connectorIds.length);
    const maxConnections = Math.max(...connectionCounts);
    const minConnections = Math.min(...connectionCounts);
    
    // The difference between max and min connections should not be too large
    expect(maxConnections - minConnections).toBeLessThanOrEqual(2);
  });
});

describe('Edge Cases', () => {
  test('handles empty network', () => {
    const network = generateMockNetwork(0, 0, 0);
    const isolatedBatch = isolateBatch(
      network.systems,
      network.connectors,
      network.interfaces,
      1,
      'load'
    );
    
    expect(isolatedBatch).toHaveLength(0);
  });

  test('handles batch size larger than system count', () => {
    const network = generateMockNetwork(3, 5, 2);
    const isolatedBatch = isolateBatch(
      network.systems,
      network.connectors,
      network.interfaces,
      5,
      'load'
    );
    
    expect(isolatedBatch.length).toBeLessThanOrEqual(network.systems.length);
  });

  test('handles single system network', () => {
    const network = generateMockNetwork(1, 2, 1);
    const isolatedBatch = isolateBatch(
      network.systems,
      network.connectors,
      network.interfaces,
      1,
      'priority'
    );
    
    expect(isolatedBatch).toHaveLength(1);
    expect(isolatedBatch[0].id).toBe(network.systems[0].id);
  });
});