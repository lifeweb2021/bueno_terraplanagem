// Sistema de gerenciamento de dados reativo
import { supabaseStorage } from './supabaseStorage';
import { Client, Quote, Order } from '../types';

type DataType = 'clients' | 'quotes' | 'orders' | 'companySettings';

interface DataStore {
  clients: Client[];
  quotes: Quote[];
  orders: Order[];
  companySettings: any;
}

class DataManager {
  private data: DataStore = {
    clients: [],
    quotes: [],
    orders: [],
    companySettings: null
  };

  private listeners: Map<DataType, Set<() => void>> = new Map();
  private loadingStates: Map<DataType, boolean> = new Map();

  constructor() {
    // Inicializar listeners para cada tipo de dados
    ['clients', 'quotes', 'orders', 'companySettings'].forEach(type => {
      this.listeners.set(type as DataType, new Set());
      this.loadingStates.set(type as DataType, false);
    });
  }

  // Subscrever para mudanças em um tipo de dados
  subscribe(dataType: DataType, callback: () => void) {
    const typeListeners = this.listeners.get(dataType);
    if (typeListeners) {
      typeListeners.add(callback);
    }

    // Retornar função para cancelar subscrição
    return () => {
      const typeListeners = this.listeners.get(dataType);
      if (typeListeners) {
        typeListeners.delete(callback);
      }
    };
  }

  // Notificar todos os listeners de um tipo de dados
  private notify(dataType: DataType) {
    const typeListeners = this.listeners.get(dataType);
    if (typeListeners) {
      typeListeners.forEach(callback => callback());
    }
  }

  // Verificar se dados estão sendo carregados
  isLoading(dataType: DataType): boolean {
    return this.loadingStates.get(dataType) || false;
  }

  // Obter dados do cache
  getData<T>(dataType: DataType): T[] | T | null {
    return this.data[dataType] as T[] | T | null;
  }

  // Carregar dados do Supabase
  async loadData(dataType: DataType, force: boolean = false) {
    // Se já está carregando, não carregar novamente
    if (this.loadingStates.get(dataType) && !force) {
      return this.data[dataType];
    }

    this.loadingStates.set(dataType, true);

    try {
      let newData;
      
      switch (dataType) {
        case 'clients':
          newData = await supabaseStorage.getClients();
          this.data.clients = newData;
          break;
        case 'quotes':
          newData = await supabaseStorage.getQuotes();
          this.data.quotes = newData;
          break;
        case 'orders':
          newData = await supabaseStorage.getOrders();
          this.data.orders = newData;
          break;
        case 'companySettings':
          newData = await supabaseStorage.getCompanySettings();
          this.data.companySettings = newData;
          break;
      }

      this.notify(dataType);
      return newData;
    } catch (error) {
      console.error(`Erro ao carregar ${dataType}:`, error);
      throw error;
    } finally {
      this.loadingStates.set(dataType, false);
    }
  }

  // Invalidar cache e recarregar dados
  async invalidateAndReload(dataType: DataType) {
    return this.loadData(dataType, true);
  }

  // Invalidar múltiplos tipos de dados
  async invalidateMultiple(dataTypes: DataType[]) {
    const promises = dataTypes.map(type => this.invalidateAndReload(type));
    return Promise.all(promises);
  }

  // Invalidar todos os dados
  async invalidateAll() {
    const allTypes: DataType[] = ['clients', 'quotes', 'orders', 'companySettings'];
    return this.invalidateMultiple(allTypes);
  }

  // Atualizar dados localmente após operação CRUD
  updateLocalData(dataType: DataType, operation: 'add' | 'update' | 'delete', item: any, itemId?: string) {
    switch (dataType) {
      case 'clients':
        if (operation === 'add') {
          this.data.clients = [item, ...this.data.clients];
        } else if (operation === 'update' && itemId) {
          const index = this.data.clients.findIndex(c => c.id === itemId);
          if (index !== -1) {
            this.data.clients[index] = item;
          }
        } else if (operation === 'delete' && itemId) {
          this.data.clients = this.data.clients.filter(c => c.id !== itemId);
        }
        break;
      case 'quotes':
        if (operation === 'add') {
          this.data.quotes = [item, ...this.data.quotes];
        } else if (operation === 'update' && itemId) {
          const index = this.data.quotes.findIndex(q => q.id === itemId);
          if (index !== -1) {
            this.data.quotes[index] = item;
          }
        } else if (operation === 'delete' && itemId) {
          this.data.quotes = this.data.quotes.filter(q => q.id !== itemId);
        }
        break;
      case 'orders':
        if (operation === 'add') {
          this.data.orders = [item, ...this.data.orders];
        } else if (operation === 'update' && itemId) {
          const index = this.data.orders.findIndex(o => o.id === itemId);
          if (index !== -1) {
            this.data.orders[index] = item;
          }
        } else if (operation === 'delete' && itemId) {
          this.data.orders = this.data.orders.filter(o => o.id !== itemId);
        }
        break;
      case 'companySettings':
        this.data.companySettings = item;
        break;
    }

    this.notify(dataType);
  }
}

// Instância singleton do gerenciador de dados
export const dataManager = new DataManager();

// Hook personalizado para usar dados reativos
export const useReactiveData = <T>(dataType: DataType) => {
  const [data, setData] = React.useState<T[] | T | null>(dataManager.getData<T>(dataType));
  const [isLoading, setIsLoading] = React.useState(dataManager.isLoading(dataType));

  React.useEffect(() => {
    // Carregar dados iniciais se não existirem
    if (!data) {
      setIsLoading(true);
      dataManager.loadData(dataType).finally(() => {
        setIsLoading(false);
      });
    }

    // Subscrever para mudanças
    const unsubscribe = dataManager.subscribe(dataType, () => {
      setData(dataManager.getData<T>(dataType));
      setIsLoading(dataManager.isLoading(dataType));
    });

    return unsubscribe;
  }, [dataType]);

  const refresh = React.useCallback(() => {
    setIsLoading(true);
    return dataManager.invalidateAndReload(dataType).finally(() => {
      setIsLoading(false);
    });
  }, [dataType]);

  return { data, isLoading, refresh };
};

// Adicionar React import
import React from 'react';