import React, { useState, useEffect } from 'react';
import { NetworkVisualization } from './components/NetworkVisualization';
import { generateMockNetwork, isolateBatch } from './utils/networkUtils';
import { System, Connector, Interface } from './types';
import { Settings } from 'lucide-react';

function App() {
  const [network, setNetwork] = useState<{
    systems: System[];
    connectors: Connector[];
    interfaces: Interface[];
  }>({ systems: [], connectors: [], interfaces: [] });

  const [batchSize, setBatchSize] = useState(3);
  const [criteria, setCriteria] = useState<'load' | 'priority'>('load');
  const [isolatedBatch, setIsolatedBatch] = useState<System[]>([]);

  useEffect(() => {
    const newNetwork = generateMockNetwork(10, 15, 8);
    setNetwork(newNetwork);
  }, []);

  const handleIsolate = () => {
    const batch = isolateBatch(
      network.systems,
      network.connectors,
      network.interfaces,
      batchSize,
      criteria
    );
    setIsolatedBatch(batch);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Network Batch Isolation Visualizer
            </h1>
            <Settings className="w-6 h-6 text-gray-500" />
          </div>

          <div className="flex gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max={network.systems.length}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Isolation Criteria
              </label>
              <select
                value={criteria}
                onChange={(e) => setCriteria(e.target.value as 'load' | 'priority')}
                className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="load">System Load</option>
                <option value="priority">Priority Level</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleIsolate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Isolate Batch
              </button>
            </div>
          </div>

          <NetworkVisualization
            systems={network.systems}
            connectors={network.connectors}
            interfaces={network.interfaces}
            isolatedBatch={isolatedBatch}
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Isolation Details</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Currently isolated systems: {isolatedBatch.length}
            </p>
            <div>
              <h3 className="font-medium mb-2">Isolated Systems:</h3>
              <ul className="list-disc list-inside space-y-1">
                {isolatedBatch.map(system => (
                  <li key={system.id} className="text-gray-600">
                    {system.name} (Load: {system.attributes.load.toFixed(1)}%, Priority: {system.attributes.priority})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;