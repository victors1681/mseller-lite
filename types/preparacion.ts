// =============================================
// Preparación (O2D Wave Picking) Types
// =============================================

/** Route status in the O2D workflow */
export type RutaPreparacionStatus =
  | "borrador"
  | "confirmada"
  | "en_preparacion"
  | "lista_despacho"
  | "en_ruta"
  | "completada"
  | "cancelada";

/** Route summary shown in the Preparación tab list */
export interface RutaPreparacion {
  rutaId: number;
  noRuta: string;
  status: RutaPreparacionStatus;
  fechaRuta: string;
  distribuidor: string;
  vehiculo: string;
  totalPedidos: number;
  totalProductos: number;
  productosPreparados: number;
}

// ---- M1: Consolidated Picking ----

export interface ConsolidadoProducto {
  codigoProducto: string;
  descripcion: string;
  cantidadTotal: number;
  cantidadPreparada: number;
  unidad: string;
  clientes: string[];
}

export interface ConsolidadoZona {
  zona: string;
  productos: ConsolidadoProducto[];
}

export interface ConsolidadoResponse {
  rutaId: number;
  noRuta: string;
  status: RutaPreparacionStatus;
  zonas: ConsolidadoZona[];
}

// ---- M2: Confirm & Distribute ----

export interface DistribucionCliente {
  codigoCliente: string;
  cantidad: number;
}

export interface ConfirmarProductoRequest {
  rutaId: number;
  codigoProducto: string;
  cantidadTotal: number;
  distribucion: DistribucionCliente[];
  observacion?: string;
}

// ---- M3/M5: Truck Loading (Carga) ----

export interface CargaCliente {
  codigoCliente: string;
  nombreCliente: string;
  secuenciaEntrega: number;
  totalBultos: number;
  confirmado: boolean;
}

export interface CargaResponse {
  rutaId: number;
  noRuta: string;
  clientes: CargaCliente[];
}
