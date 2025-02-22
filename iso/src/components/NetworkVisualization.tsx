import React, { useEffect, useState } from 'react';
import { Network, Server, Cable } from 'lucide-react';
import { System, Connector, Interface } from '../types';

interface NetworkVisualizationProps {
  systems: System[];
  connectors: Connector[];
  interfaces: Interface[];
  isolatedBatch: System[];
}

export function NetworkVisualization({
  systems,
  connectors,
  interfaces,
  isolatedBatch,
}: NetworkVisualizationProps) {
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [networkMetrics, setNetworkMetrics] = useState({
    totalConnections: 0,
    avgConnectivity: 0,
  });

  useEffect(() => {
    // Calculate network metrics
    const totalConnections = connectors.reduce(
      (acc, c) => acc + c.interfaceIds.length,
      0
    );
    const avgConnectivity = totalConnections / systems.length;

    setNetworkMetrics({
      totalConnections,
      avgConnectivity,
    });
  }, [systems, connectors, interfaces]);

  const isIsolated = (system: System) => {
    return isolatedBatch.some(s => s.id === system.id);
  };

  const getConnectorStatus = (connector: Connector) => {
    const system = systems.find(s => s.id === connector.systemId);
    const isConnectorIsolated = system && isIsolated(system);
    const connectedInterfaces = interfaces.filter(i => 
      connector.interfaceIds.includes(i.id)
    );

    return {
      isIsolated: isConnectorIsolated,
      connectionCount: connectedInterfaces.length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Network Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-sm text-gray-600">Total Connections</p>
            <p className="text-2xl font-bold text-blue-600">
              {networkMetrics.totalConnections}
            </p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-sm text-gray-600">Avg. Connectivity</p>
            <p className="text-2xl font-bold text-blue-600">
              {networkMetrics.avgConnectivity.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-[600px] bg-gray-50 rounded-lg p-4 overflow-auto">
        <div className="flex flex-wrap gap-8 justify-center">
          {/* Systems */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Systems</h3>
            {systems.map(system => (
              <div
                key={system.id}
                className={`p-4 rounded-lg shadow-md cursor-pointer transition-all
                  ${isIsolated(system) 
                    ? 'bg-yellow-100 border-2 border-yellow-500' 
                    : 'bg-white hover:bg-gray-50'}
                  ${selectedSystem?.id === system.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedSystem(system)}
              >
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  <span>{system.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  <div>Load: {system.attributes.load.toFixed(1)}%</div>
                  <div>Priority: {system.attributes.priority}</div>
                  <div>Connectors: {system.connectors.length}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Connectors */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Connectors</h3>
            {connectors.map(connector => {
              const status = getConnectorStatus(connector);
              const system = systems.find(s => s.id === connector.systemId);

              return (
                <div
                  key={connector.id}
                  className={`p-4 rounded-lg shadow-md ${
                    status.isIsolated ? 'bg-yellow-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cable className="w-5 h-5" />
                    <span>{connector.name}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    <div>Connected to: {system?.name}</div>
                    <div>Interfaces: {status.connectionCount}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interfaces */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Interfaces</h3>
            {interfaces.map(iface => (
              <div
                key={iface.id}
                className="p-4 rounded-lg shadow-md bg-white"
              >
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  <span>{iface.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  <div>Connections: {iface.connectorIds.length}</div>
                  <div>Load: {((iface.connectorIds.length / connectors.length) * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}