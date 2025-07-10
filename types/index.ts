import { FieldValue, Timestamp } from "firebase/firestore";

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  foto_url?: string;
  serialNumber?: string;
  unidade: string;
  modelo?: string;
  categoriaId?: string;
  fabricanteId?: string;
  fornecedorId?: string;
  notas_internas?: string;
  documentos?: string; // JSON string
  estoqueMinimo?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EstoqueItem { 
  id: string; 
  produtoId: string; 
  quantidade: number; 
  localidadeId: string; 
}
export interface Localidade { 
  id: string; 
  nome: string; 
  cor?: string;
  projetoId?: string; // NOVO CAMPO
}
export interface Fabricante { id: string; nome: string; }
export interface Categoria { id: string; nome: string; }
export interface Fornecedor { id: string; nome: string; contato_nome?: string; contato_whatsapp?: string; }
export interface Usuario { id: string; username: string; email: string; role: string; }
export interface Projeto { id: string; nome: string; }
export interface HistoricoItem { 
  id: string; 
  produtoId: string; 
  tipo: string; 
  quantidade: number; 
  localidadeOrigemId?: string; 
  localidadeDestinoId?: string; 
  data: any; 
  usuario: string; 
}

export interface AuditLogItem {
  id: string;
  action: string;
  details: any;
  userEmail: string;
  userId: string;
  timestamp: any;
}

export interface CacheData {
    produtos: Map<string, Produto>;
    estoque: EstoqueItem[];
    localidades: Map<string, Localidade>;
    fabricantes: Map<string, Fabricante>;
    categorias: Map<string, Categoria>;
    fornecedores: Map<string, Fornecedor>;
    usuarios: Map<string, Usuario>;
    historico: HistoricoItem[];
    projetos: Map<string, Projeto>;
}