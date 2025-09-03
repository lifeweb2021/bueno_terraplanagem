export interface Client {
  id: string;
  type: 'fisica' | 'juridica';
  name: string;
  document: string; // CPF ou CNPJ
  email: string;
  phone: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number;
  total: number;
}

export interface Product {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Quote {
  id: string;
  clientId: string;
  client: Client;
  number: string;
  services: Service[];
  products: Product[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  validUntil: Date;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  cnpj: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  logo?: string; // base64 ou URL
  emailSettings?: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromName: string;
    fromEmail: string;
    useSSL: boolean;
  };
}

export interface Order {
  id: string;
  quoteId: string;
  clientId: string;
  client: Client;
  number: string;
  services: Service[];
  products: Product[];
  total: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  isFromQuote?: boolean; // Indica se é um pedido temporário de orçamento aprovado
}

export interface State {
  id: string;
  name: string;
  code: string; // UF
  createdAt: Date;
}

export interface City {
  id: string;
  name: string;
  stateId: string;
  state?: State;
  createdAt: Date;
}