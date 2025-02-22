import { System, Connector, Interface } from '../types';

export function generateMockNetwork(
  systemCount: number,
  connectorCount: number,
  interfaceCount: number
): {
  systems: System[];
  connectors: Connector[];
  interfaces: Interface[];
} {
  const systems: System[] = Array.from({ length: systemCount }, (_, i) => ({
    id: `s${i}`,
    name: `System ${i}`,
    connectors: [],
    attributes: {
      load: Math.random() * 100,
      priority: Math.floor(Math.random() * 5) + 1,
    },
  }));

  const connectors: Connector[] = Array.from({ length: connectorCount }, (_, i) => ({
    id: `c${i}`,
    name: `Connector ${i}`,
    systemId: systems[Math.floor(Math.random() * systemCount)].id,
    interfaceIds: [],
  }));

  const interfaces: Interface[] = Array.from({ length: interfaceCount }, (_, i) => ({
    id: `i${i}`,
    name: `Interface ${i}`,
    connectorIds: [],
  }));

  // Create connections with more balanced distribution
  connectors.forEach(connector => {
    // Ensure even distribution of connectors across systems
    const systemIndex = Math.floor(connectors.indexOf(connector) / (connectorCount / systemCount));
    connector.systemId = systems[Math.min(systemIndex, systemCount - 1)].id;
    
    const system = systems.find(s => s.id === connector.systemId);
    if (system) {
      system.connectors.push(connector.id);
    }

    // Connect to interfaces with better distribution
    const interfaceCount = Math.floor(Math.random() * 2) + 1; // 1-2 interfaces per connector
    const availableInterfaces = [...interfaces];
    
    for (let i = 0; i < interfaceCount; i++) {
      if (availableInterfaces.length === 0) break;
      
      // Select interface with least connections
      availableInterfaces.sort((a, b) => a.connectorIds.length - b.connectorIds.length);
      const selectedInterface = availableInterfaces.shift()!;
      
      connector.interfaceIds.push(selectedInterface.id);
      selectedInterface.connectorIds.push(connector.id);
    }
  });

  return { systems, connectors, interfaces };
}

function calculateSystemImpact(
  system: System,
  connectors: Connector[],
  interfaces: Interface[]
): number {
  const systemConnectors = connectors.filter(c => c.systemId === system.id);
  const connectedInterfaces = new Set(
    systemConnectors.flatMap(c => c.interfaceIds)
  );
  
  return connectedInterfaces.size;
}

function calculateNetworkStability(
  selectedSystems: System[],
  allSystems: System[],
  connectors: Connector[],
  interfaces: Interface[]
): number {
  const selectedIds = new Set(selectedSystems.map(s => s.id));
  const remainingSystems = allSystems.filter(s => !selectedIds.has(s.id));
  
  // Calculate connectivity for remaining systems
  const remainingConnectivity = remainingSystems.reduce((acc, system) => {
    const impact = calculateSystemImpact(system, connectors, interfaces);
    return acc + impact;
  }, 0);
  
  // Higher score means better stability
  return remainingConnectivity / remainingSystems.length;
}

export function isolateBatch(
  systems: System[],
  connectors: Connector[],
  interfaces: Interface[],
  batchSize: number,
  criteria: 'load' | 'priority'
): System[] {
  // Initial sorting based on primary criteria
  const sortedSystems = [...systems].sort((a, b) => {
    if (criteria === 'load') {
      return b.attributes.load - a.attributes.load;
    }
    return b.attributes.priority - a.attributes.priority;
  });

  // Calculate impact scores for each system
  const systemScores = sortedSystems.map(system => ({
    system,
    impact: calculateSystemImpact(system, connectors, interfaces),
  }));

  // Weighted scoring combining primary criteria and network impact
  const weightedScores = systemScores.map(({ system, impact }) => ({
    system,
    score: criteria === 'load'
      ? system.attributes.load * 0.7 + (100 - impact * 10) * 0.3
      : system.attributes.priority * 0.7 + (100 - impact * 10) * 0.3,
  }));

  // Sort by weighted score
  weightedScores.sort((a, b) => b.score - a.score);

  // Select initial batch
  let selectedBatch = weightedScores.slice(0, batchSize).map(s => s.system);

  // Optimize batch for network stability
  let bestStability = calculateNetworkStability(selectedBatch, systems, connectors, interfaces);
  let bestBatch = [...selectedBatch];

  // Try different combinations to find optimal stability
  for (let i = batchSize; i < Math.min(batchSize + 5, weightedScores.length); i++) {
    const alternateBatch = weightedScores.slice(i - batchSize, i).map(s => s.system);
    const stability = calculateNetworkStability(alternateBatch, systems, connectors, interfaces);
    
    if (stability > bestStability) {
      bestStability = stability;
      bestBatch = alternateBatch;
    }
  }

  return bestBatch;
}