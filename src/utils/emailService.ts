import { Quote } from '../types';
import { storage } from './storage';

export const sendQuoteByEmail = async (quote: Quote): Promise<boolean> => {
  try {
    const companySettings = storage.getCompanySettings();
    
    if (!companySettings) {
      alert('Configure os dados da empresa antes de enviar emails');
      return false;
    }

    // Simular envio de email (em produção, usar um serviço real como EmailJS, SendGrid, etc.)
    const emailBody = `
Prezado(a) ${quote.client.name},

Segue em anexo o orçamento ${quote.number} solicitado.

Valor Total: R$ ${quote.total.toFixed(2).replace('.', ',')}
Válido até: ${quote.validUntil.toLocaleDateString('pt-BR')}

${quote.notes ? `Observações: ${quote.notes}` : ''}

Atenciosamente,
${companySettings.companyName}
${companySettings.phone}
${companySettings.whatsapp ? `WhatsApp: ${companySettings.whatsapp}` : ''}
    `.trim();

    // Criar link mailto
    const subject = `Orçamento ${quote.number} - ${companySettings.companyName}`;
    const mailtoLink = `mailto:${quote.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Abrir cliente de email
    window.open(mailtoLink);
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    alert('Erro ao preparar o envio do email');
    return false;
  }
};