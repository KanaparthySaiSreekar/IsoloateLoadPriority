export interface System {
  id: string;
  name: string;
  connectors: string[];
  attributes: {
    load: number;
    priority: number;
  };
}

export interface Connector {
  id: string;
  name: string;
  systemId: string;
  interfaceIds: string[];
}

export interface Interface {
  id: string;
  name: string;
  connectorIds: string[];
}