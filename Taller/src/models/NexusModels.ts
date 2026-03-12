import { VortexQuoteStatus, ZephyrOrderStatus, CruxActorRole, ThalionProduct, OrbisQuoteItem } from "../types/NexusTypes";

export abstract class GalvornActor {
  constructor(public readonly id: string, public readonly name: string, public readonly role: CruxActorRole) {}
}

export class DawnShippingOfficer extends GalvornActor {
  constructor(id: string, name: string) { super(id, name, CruxActorRole.SHIPPING_OFFICE); }
}
export class TerraeBuyerAgent extends GalvornActor {
  constructor(id: string, name: string) { super(id, name, CruxActorRole.BUYER_AGENT); }
}
export class StrixSupervisor extends GalvornActor {
  constructor(id: string, name: string) { super(id, name, CruxActorRole.SUPERVISOR); }
}
export class KeldorSeller extends GalvornActor {
  constructor(id: string, name: string) { super(id, name, CruxActorRole.SELLER); }
}
export class WyrmReceiveAgent extends GalvornActor {
  constructor(id: string, name: string) { super(id, name, CruxActorRole.RECEIVE_AGENT); }
}

export class FluxRequisition {
  public readonly createdAt: Date = new Date();
  constructor(
    public readonly id: string,
    public readonly createdBy: DawnShippingOfficer,
    public products: ThalionProduct[],
    public notes: string = ""
  ) {}
  getTotalItems(): number { return this.products.reduce((s, p) => s + p.quantity, 0); }
}

export class NimbusRFQ {
  public readonly createdAt: Date = new Date();
  public needsSupervisorReview: boolean = false;
  public isApprovedBySupervisor: boolean = false;
  constructor(
    public readonly id: string,
    public readonly requisition: FluxRequisition,
    public readonly createdBy: TerraeBuyerAgent,
    public notes: string = ""
  ) {}
}

export class SolarisQuote {
  public readonly createdAt: Date = new Date();
  public status: VortexQuoteStatus = VortexQuoteStatus.PENDING;
  public reviewNotes: string = "";
  public isAcceptedByBuyer: boolean = false;
  constructor(
    public readonly id: string,
    public readonly rfq: NimbusRFQ,
    public readonly seller: KeldorSeller,
    public items: OrbisQuoteItem[],
    public validUntil: Date
  ) {}
  getTotal(): number {
    return this.items.reduce((s, i) => i.available ? s + i.product.quantity * i.offeredPrice : s, 0);
  }
}

export class CometOrder {
  public readonly createdAt: Date = new Date();
  public status: ZephyrOrderStatus = ZephyrOrderStatus.DRAFT;
  public invoiceNumber: string | null = null;
  public deliveryNote: string | null = null;
  public paymentConfirmed: boolean = false;
  constructor(
    public readonly id: string,
    public readonly quote: SolarisQuote,
    public readonly buyerAgent: TerraeBuyerAgent
  ) {}
  getTotal(): number { return this.quote.getTotal(); }
}

export class PulseInvoice {
  public readonly issuedAt: Date = new Date();
  public isPaid: boolean = false;
  constructor(
    public readonly id: string,
    public readonly order: CometOrder,
    public readonly seller: KeldorSeller,
    public readonly dueDate: Date
  ) {}
  getAmount(): number { return this.order.getTotal(); }
}
