namespace QuiteUp.Domain.Enums;

/// <summary>Como a dívida é paga.</summary>
public enum DebtPaymentMode
{
    /// <summary>Parcelas fixas mensais (empréstimo, financiamento...).</summary>
    Installments = 0,

    /// <summary>Sem parcelas fixas (cartão, cheque especial, dívida com pessoa).</summary>
    Flexible = 1
}
