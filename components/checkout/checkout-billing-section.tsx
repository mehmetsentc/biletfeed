'use client';

import { FileText } from 'lucide-react';
import { useTranslations } from '@/components/providers';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CheckoutBillingFormState } from '@/lib/validation/checkout-billing';

type CheckoutBillingSectionProps = {
  value: CheckoutBillingFormState;
  onChange: (value: CheckoutBillingFormState) => void;
  errors?: Record<string, string>;
  onClearError?: (field: string) => void;
  /** Katılımcı adından bireysel fatura alıcısı önerisi */
  suggestedName?: string;
  className?: string;
};

/**
 * B2C perakende: varsayılan nihai tüketici (TCKN/VKN yok).
 * Yalnızca "Kurumsal fatura istiyorum" açıkken VKN + unvan + vergi dairesi.
 */
export function CheckoutBillingSection({
  value,
  onChange,
  errors = {},
  onClearError,
  suggestedName,
  className
}: CheckoutBillingSectionProps) {
  const t = useTranslations();

  function patch(partial: Partial<CheckoutBillingFormState>) {
    onChange({ ...value, ...partial });
  }

  function clear(field: string) {
    onClearError?.(field);
  }

  return (
    <section
      className={
        className ??
        'rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6'
      }
    >
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <FileText className="size-5 text-[var(--bf-accent-ink)]" />
        {t.purchase.billingTitle}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t.purchase.billingNote}</p>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
        <Checkbox
          id="billing-corporate"
          checked={value.isCorporate}
          onCheckedChange={(checked) => {
            const on = checked === true;
            patch({
              isCorporate: on,
              ...(on
                ? {}
                : {
                    taxNumber: '',
                    taxOffice: '',
                    companyName: ''
                  })
            });
            clear('isCorporate');
            clear('taxNumber');
            clear('taxOffice');
            clear('companyName');
            clear('billingAddress');
          }}
        />
        <div className="space-y-1">
          <Label htmlFor="billing-corporate" className="cursor-pointer font-medium">
            {t.purchase.billingCorporate}
          </Label>
          <p className="text-xs text-muted-foreground">{t.purchase.billingCorporateHint}</p>
        </div>
      </div>

      {value.isCorporate ? (
        <div className="mt-5 space-y-4">
          <BillingField
            id="billing-companyName"
            label={t.purchase.billingTradeName}
            required
            value={value.companyName}
            onChange={(v) => {
              patch({ companyName: v });
              clear('companyName');
            }}
            placeholder={t.purchase.billingTradeNamePlaceholder}
            error={errors.companyName}
          />

          <BillingField
            id="billing-taxNumber"
            label={t.purchase.billingTaxId}
            required
            value={value.taxNumber}
            onChange={(v) => {
              patch({ taxNumber: v.replace(/\D/g, '').slice(0, 10) });
              clear('taxNumber');
            }}
            placeholder={t.purchase.billingVknPlaceholder}
            inputMode="numeric"
            maxLength={10}
            error={errors.taxNumber}
          />

          <BillingField
            id="billing-taxOffice"
            label={t.purchase.billingTaxOffice}
            required
            value={value.taxOffice}
            onChange={(v) => {
              patch({ taxOffice: v });
              clear('taxOffice');
            }}
            placeholder={t.purchase.billingTaxOfficePlaceholder}
            error={errors.taxOffice}
          />

          <div className="space-y-2">
            <Label htmlFor="billing-address">
              {t.purchase.billingAddress} <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="billing-address"
              className="flex min-h-[88px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={value.billingAddress}
              onChange={(e) => {
                patch({ billingAddress: e.target.value });
                clear('billingAddress');
              }}
              placeholder={t.purchase.billingAddressPlaceholder}
              aria-invalid={Boolean(errors.billingAddress)}
            />
            {errors.billingAddress && (
              <p className="text-sm text-destructive">{errors.billingAddress}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          {t.purchase.billingRetailHint}
          {suggestedName ? ` (${suggestedName})` : ''}
        </p>
      )}
    </section>
  );
}

function BillingField({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  inputMode,
  maxLength
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className="h-11 rounded-xl"
        aria-invalid={Boolean(error)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
