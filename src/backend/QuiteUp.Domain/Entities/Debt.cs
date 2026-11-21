using QuiteUp.Domain.Common;
using QuiteUp.Domain.Enums;

namespace QuiteUp.Domain.Entities;

public class Debt : BaseEntity
{
    public long UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DebtType Type { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal? InterestRate { get; set; }
    public InterestPeriod InterestPeriod { get; set; } = InterestPeriod.Monthly;

    public DebtPaymentMode PaymentMode { get; set; } = DebtPaymentMode.Installments;

    /// <summary>Nº total de parcelas (modo parcelado).</summary>
    public int? InstallmentCount { get; set; }

    /// <summary>Valor de cada parcela (modo parcelado; pode incluir juros).</summary>
    public decimal? InstallmentAmount { get; set; }

    /// <summary>Parcelas já pagas antes de cadastrar a dívida no app (geram o "Pago" inicial).</summary>
    public int InitialPaidInstallments { get; set; }

    /// <summary>Dia do mês de vencimento (1–31; meses mais curtos usam o último dia).</summary>
    public int? DueDay { get; set; }

    /// <summary>Vencimento da 1ª parcela (modo parcelado).</summary>
    public DateOnly? FirstInstallmentDate { get; set; }

    /// <summary>
    /// Parcelado: previsão de quitação (calculada = vencimento da última parcela).
    /// Sem parcelas fixas: "quitar até" (opcional).
    /// </summary>
    public DateOnly? PayoffDate { get; set; }

    public bool IsPaid { get; set; }
    public string? Notes { get; set; }

    /// <summary>Dívida migrada do modelo antigo: o usuário precisa confirmar parcelas/vencimento.</summary>
    public bool NeedsReview { get; set; }

    public User User { get; set; } = null!;
    public ICollection<DebtPayment> Payments { get; set; } = new List<DebtPayment>();
}
