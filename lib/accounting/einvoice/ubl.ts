import { randomUUID } from 'crypto';
import { companyLegal } from '@/lib/config/company';
import { effectiveGibBuyerTaxId } from '@/lib/accounting/einvoice/nihai-tuketici';
import type {
  EInvoiceBuyer,
  EInvoiceDocumentKind,
  EInvoiceLine,
  EInvoicePayload,
  EInvoiceSeller
} from '@/lib/accounting/einvoice/types';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatAmount(n: number): string {
  return n.toFixed(2);
}

function formatUblDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatUblTime(d: Date): string {
  return d.toISOString().slice(11, 19);
}

function profileId(kind: EInvoiceDocumentKind): string {
  if (kind === 'e_fatura') return 'TEMELFATURA';
  if (kind === 'credit_note') return 'TEMELFATURA';
  return 'EARSIVFATURA';
}

function invoiceTypeCode(kind: EInvoiceDocumentKind): string {
  return kind === 'credit_note' ? 'IADE' : 'SATIS';
}

function buildSellerParty(seller: EInvoiceSeller): string {
  return `
    <cac:AccountingSupplierParty>
      <cac:Party>
        <cac:PartyIdentification>
          <cbc:ID schemeID="VKN">${escapeXml(seller.taxNumber)}</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyName>
          <cbc:Name>${escapeXml(seller.tradeName)}</cbc:Name>
        </cac:PartyName>
        <cac:PostalAddress>
          <cbc:StreetName>${escapeXml(seller.address)}</cbc:StreetName>
          <cbc:CityName>${escapeXml(seller.city)}</cbc:CityName>
          <cac:Country>
            <cbc:Name>${escapeXml(seller.country)}</cbc:Name>
          </cac:Country>
        </cac:PostalAddress>
        <cac:PartyTaxScheme>
          <cbc:RegistrationName>${escapeXml(seller.tradeName)}</cbc:RegistrationName>
          <cac:TaxScheme>
            <cbc:Name>${escapeXml(seller.taxOffice)}</cbc:Name>
          </cac:TaxScheme>
        </cac:PartyTaxScheme>
        <cac:Contact>
          <cbc:Telephone>${escapeXml(seller.phone)}</cbc:Telephone>
          <cbc:ElectronicMail>${escapeXml(seller.email)}</cbc:ElectronicMail>
        </cac:Contact>
      </cac:Party>
    </cac:AccountingSupplierParty>`;
}

function buildBuyerParty(buyer: EInvoiceBuyer): string {
  const idValue = effectiveGibBuyerTaxId(buyer.taxNumber);
  const scheme = idValue.length === 10 ? 'VKN' : 'TCKN';

  return `
    <cac:AccountingCustomerParty>
      <cac:Party>
        <cac:PartyIdentification>
          <cbc:ID schemeID="${scheme}">${escapeXml(idValue)}</cbc:ID>
        </cac:PartyIdentification>
        <cac:PartyName>
          <cbc:Name>${escapeXml(buyer.name)}</cbc:Name>
        </cac:PartyName>
        <cac:PostalAddress>
          <cbc:StreetName>${escapeXml(buyer.address ?? 'Türkiye')}</cbc:StreetName>
          <cbc:CityName>Türkiye</cbc:CityName>
          <cac:Country>
            <cbc:Name>TR</cbc:Name>
          </cac:Country>
        </cac:PostalAddress>
        ${
          buyer.taxOffice
            ? `<cac:PartyTaxScheme>
          <cac:TaxScheme>
            <cbc:Name>${escapeXml(buyer.taxOffice)}</cbc:Name>
          </cac:TaxScheme>
        </cac:PartyTaxScheme>`
            : ''
        }
        ${
          buyer.email
            ? `<cac:Contact>
          <cbc:ElectronicMail>${escapeXml(buyer.email)}</cbc:ElectronicMail>
        </cac:Contact>`
            : ''
        }
      </cac:Party>
    </cac:AccountingCustomerParty>`;
}

function buildLines(lines: EInvoiceLine[]): string {
  return lines
    .map((line, idx) => {
      const lineNet = Math.round(line.unitPriceNet * line.quantity * 100) / 100;
      return `
    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="C62">${line.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="TRY">${formatAmount(lineNet)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${escapeXml(line.description)}</cbc:Name>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="TRY">${formatAmount(line.unitPriceNet)}</cbc:PriceAmount>
      </cac:Price>
      <cac:TaxTotal>
        <cbc:TaxAmount currencyID="TRY">${formatAmount(line.vatAmount)}</cbc:TaxAmount>
        <cac:TaxSubtotal>
          <cbc:TaxableAmount currencyID="TRY">${formatAmount(lineNet)}</cbc:TaxableAmount>
          <cbc:TaxAmount currencyID="TRY">${formatAmount(line.vatAmount)}</cbc:TaxAmount>
          <cbc:Percent>${formatAmount(line.vatRate)}</cbc:Percent>
          <cac:TaxCategory>
            <cac:TaxScheme>
              <cbc:Name>KDV</cbc:Name>
              <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
            </cac:TaxScheme>
          </cac:TaxCategory>
        </cac:TaxSubtotal>
      </cac:TaxTotal>
    </cac:InvoiceLine>`;
    })
    .join('');
}

export function createEttn(): string {
  return randomUUID();
}

export function defaultSellerFromCompany(): EInvoiceSeller {
  return {
    tradeName: companyLegal.tradeName,
    taxNumber: companyLegal.taxNumber,
    taxOffice: companyLegal.taxOffice,
    address: companyLegal.address,
    city: companyLegal.city,
    country: companyLegal.country,
    email: companyLegal.email,
    phone: companyLegal.phone,
    iban: companyLegal.iban || undefined,
    mersisNo: companyLegal.mersisNo || undefined
  };
}

/**
 * UBL-TR 1.2 uyumlu fatura XML iskeleti.
 * Entegratör API'si kendi JSON şemasını isterse XML yine payload'da taşınır / dönüştürülür.
 */
export function buildUblTrXml(input: {
  ettn: string;
  invoiceNumber: string;
  kind: EInvoiceDocumentKind;
  issuedAt: Date;
  currency: string;
  subtotalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  seller: EInvoiceSeller;
  buyer: EInvoiceBuyer;
  lines: EInvoiceLine[];
  originalInvoiceNumber?: string | null;
}): string {
  const issuedAt = input.issuedAt;
  const currency = input.currency || 'TRY';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
  xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${profileId(input.kind)}</cbc:ProfileID>
  <cbc:ID>${escapeXml(input.invoiceNumber)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${escapeXml(input.ettn)}</cbc:UUID>
  <cbc:IssueDate>${formatUblDate(issuedAt)}</cbc:IssueDate>
  <cbc:IssueTime>${formatUblTime(issuedAt)}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${invoiceTypeCode(input.kind)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${escapeXml(currency)}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${input.lines.length}</cbc:LineCountNumeric>
  ${
    input.originalInvoiceNumber
      ? `<cac:BillingReference>
    <cac:InvoiceDocumentReference>
      <cbc:ID>${escapeXml(input.originalInvoiceNumber)}</cbc:ID>
      <cbc:IssueDate>${formatUblDate(issuedAt)}</cbc:IssueDate>
    </cac:InvoiceDocumentReference>
  </cac:BillingReference>`
      : ''
  }
  ${buildSellerParty(input.seller)}
  ${buildBuyerParty(input.buyer)}
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${escapeXml(currency)}">${formatAmount(input.vatAmount)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${escapeXml(currency)}">${formatAmount(input.subtotalNet)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${escapeXml(currency)}">${formatAmount(input.vatAmount)}</cbc:TaxAmount>
      <cbc:Percent>${formatAmount(input.vatRate)}</cbc:Percent>
      <cac:TaxCategory>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${escapeXml(currency)}">${formatAmount(input.subtotalNet)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${escapeXml(currency)}">${formatAmount(input.subtotalNet)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${escapeXml(currency)}">${formatAmount(input.totalGross)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${escapeXml(currency)}">${formatAmount(input.totalGross)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  ${buildLines(input.lines)}
</Invoice>
`;
}

export function buildEInvoicePayload(input: {
  invoiceId: string;
  invoiceNumber: string;
  kind: EInvoiceDocumentKind;
  issuedAt: Date;
  currency: string;
  subtotalNet: number;
  vatRate: number;
  vatAmount: number;
  totalGross: number;
  buyer: EInvoiceBuyer;
  lines: EInvoiceLine[];
  originalInvoiceNumber?: string | null;
  originalEttn?: string | null;
  ettn?: string;
}): EInvoicePayload {
  const ettn = input.ettn ?? createEttn();
  const seller = defaultSellerFromCompany();
  const ublXml = buildUblTrXml({
    ettn,
    invoiceNumber: input.invoiceNumber,
    kind: input.kind,
    issuedAt: input.issuedAt,
    currency: input.currency,
    subtotalNet: input.subtotalNet,
    vatRate: input.vatRate,
    vatAmount: input.vatAmount,
    totalGross: input.totalGross,
    seller,
    buyer: input.buyer,
    lines: input.lines,
    originalInvoiceNumber: input.originalInvoiceNumber
  });

  return {
    invoiceId: input.invoiceId,
    invoiceNumber: input.invoiceNumber,
    kind: input.kind,
    issuedAt: input.issuedAt,
    currency: input.currency,
    subtotalNet: input.subtotalNet,
    vatRate: input.vatRate,
    vatAmount: input.vatAmount,
    totalGross: input.totalGross,
    ettn,
    seller,
    buyer: input.buyer,
    lines: input.lines,
    originalEttn: input.originalEttn,
    originalInvoiceNumber: input.originalInvoiceNumber,
    ublXml
  };
}
