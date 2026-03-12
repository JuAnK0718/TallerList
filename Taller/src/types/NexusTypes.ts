export enum VortexQuoteStatus {
  PENDING   = "PENDIENTE",
  REVIEWING = "EN_REVISION",
  APPROVED  = "APROBADA",
  REJECTED  = "RECHAZADA",
  SENT      = "ENVIADA",
}

export enum ZephyrOrderStatus {
  DRAFT     = "BORRADOR",
  SUBMITTED = "ENVIADO",
  ACCEPTED  = "ACEPTADO",
  REJECTED  = "RECHAZADO",
  FULFILLED = "COMPLETADO",
  INVOICED  = "FACTURADO",
  PAID      = "PAGADO",
  DELIVERED = "ENTREGADO",
}

export enum CruxActorRole {
  SHIPPING_OFFICE = "Oficina de Despacho",
  BUYER_AGENT     = "Agente Comprador",
  SUPERVISOR      = "Supervisor",
  SELLER          = "Vendedor",
  RECEIVE_AGENT   = "Agente Receptor",
}

export interface ThalionProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrbisQuoteItem {
  product: ThalionProduct;
  offeredPrice: number;
  available: boolean;
}
