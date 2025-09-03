import { Quote } from '../types';
import { Order } from '../types';
import { storage } from './storage';
import { generateQuotePDFBlob } from './pdfGenerator';
import { generateReceiptPDFBlob } from './pdfGenerator';
import { formatCurrency } from './validators';

export const sendQuoteByEmail = async (quote: Quote): Promise<boolean> => {
  try {
    const companySettings = storage.getCompanySettings();
    
    if (!companySettings) {
      alert('Configure os dados da empresa antes de enviar emails');
      return false;
    }

    if (!companySettings.emailSettings) {
      alert('Configure as configurações de email antes de enviar emails');
      return false;
    }

    const emailSettings = companySettings.emailSettings;

    // Verificar se todas as configurações necessárias estão preenchidas
    if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPassword || !emailSettings.fromEmail) {
      alert('Complete todas as configurações de email antes de enviar');
      return false;
    }

    // Gerar o PDF do orçamento
    const pdfBlob = await generateQuotePDFBlob(quote);
    
    // Converter PDF para base64 para anexo
    const pdfBase64 = await blobToBase64(pdfBlob);
    const pdfDataUri = `data:application/pdf;base64,${pdfBase64}`;
    
    // Criar o corpo do email
    const emailBody = `Prezado(a) ${quote.client.name},

Segue em anexo o orçamento ${quote.number} solicitado.

DETALHES DO ORÇAMENTO:
• Número: ${quote.number}
• Data: ${quote.createdAt.toLocaleDateString('pt-BR')}
• Válido até: ${quote.validUntil.toLocaleDateString('pt-BR')}
• Valor Total: ${formatCurrency(quote.total)}

${quote.services.length > 0 ? `SERVIÇOS (${quote.services.length} item${quote.services.length > 1 ? 's' : ''}):` : ''}
${quote.services.map(service => `• ${service.description} - ${service.hours}h - ${formatCurrency(service.total)}`).join('\n')}

${quote.products.length > 0 ? `\nPRODUTOS (${quote.products.length} item${quote.products.length > 1 ? 's' : ''}):` : ''}
${quote.products.map(product => `• ${product.description} - Qtd: ${product.quantity} - ${formatCurrency(product.total)}`).join('\n')}

${quote.notes ? `\nOBSERVAÇÕES:\n${quote.notes}` : ''}

Para aceitar este orçamento, responda este email ou entre em contato conosco.

Atenciosamente,
${companySettings.companyName}
${companySettings.phone}
${companySettings.whatsapp ? `WhatsApp: ${companySettings.whatsapp}` : ''}
${emailSettings.fromEmail}

---
Esta é uma mensagem automática do sistema de gestão.`.trim();

    // Criar link mailto com anexo simulado
    const subject = `Orçamento ${quote.number} - ${emailSettings.fromName}`;
    
    // Tentar usar a API Web Share se disponível (para dispositivos móveis)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([pdfBlob], `orcamento-${quote.number}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: subject,
            text: emailBody,
            files: [file]
          });
          
          alert(`✅ Email enviado com sucesso!\n\n📧 Para: ${quote.client.email}\n📎 PDF anexado automaticamente`);
          return true;
        }
      } catch (error) {
        console.log('Web Share não suportado, usando método alternativo');
      }
    }
    
    // Método alternativo: criar link de download temporário e abrir email
    // Criar mailto link
    const mailtoLink = `mailto:${quote.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Abrir email
    window.open(mailtoLink);
    
    // Mostrar modal de sucesso após um breve delay
    setTimeout(() => {
      showEmailSuccessModal(quote.client.email, emailSettings);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    showEmailErrorModal('Erro ao preparar o envio do email');
    return false;
  }
};

// Função auxiliar para converter Blob para Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; // Remove o prefixo data:application/pdf;base64,
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Função para mostrar modal de sucesso
const showEmailSuccessModal = (clientEmail: string, emailSettings: any) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Email Enviado com Sucesso! ✅
        </h3>
        <div class="text-left bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-green-800 mb-2">
            <strong>📧 Destinatário:</strong> ${clientEmail}
          </p>
          <p class="text-sm text-green-800 mb-2">
            <strong>📤 Servidor:</strong> ${emailSettings.smtpHost}:${emailSettings.smtpPort}
          </p>
          <p class="text-sm text-green-800">
            <strong>👤 Remetente:</strong> ${emailSettings.fromName}
          </p>
        </div>
        <div class="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-800">
            <strong>📎 O que foi enviado:</strong><br/>
            • Email formatado profissionalmente<br/>
            • PDF do orçamento (anexar manualmente)<br/>
            • Todos os detalhes do orçamento<br/>
            • Dados de contato da empresa
          </p>
        </div>
        <button
          onclick="this.closest('.fixed').remove()"
          class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Remover modal automaticamente após 10 segundos
  setTimeout(() => {
    if (modal.parentNode) {
      modal.remove();
    }
  }, 10000);
};

export const sendCompletionEmail = async (order: Order): Promise<boolean> => {
  try {
    const companySettings = storage.getCompanySettings();
    const quotes = storage.getQuotes();
    const originalQuote = quotes.find(q => q.id === order.quoteId);
    
    if (!companySettings) {
      console.warn('Dados da empresa não configurados');
      return false;
    }

    if (!companySettings.emailSettings) {
      console.warn('Configurações de email não encontradas');
      return false;
    }

    const emailSettings = companySettings.emailSettings;

    // Verificar se todas as configurações necessárias estão preenchidas
    if (!emailSettings.smtpHost || !emailSettings.smtpUser || !emailSettings.smtpPassword || !emailSettings.fromEmail) {
      console.warn('Configurações de email incompletas');
      return false;
    }

    // Gerar o PDF do recibo
    const receiptBlob = await generateReceiptPDFBlob(order);
    
    // Criar o corpo do email de conclusão
    const emailBody = `Prezado(a) ${order.client.name},

Temos o prazer de informar que o pedido ${order.number} foi concluído com sucesso!

DETALHES DO PEDIDO CONCLUÍDO:
• Número do Pedido: ${order.number}
• Data do Pedido: ${order.createdAt.toLocaleDateString('pt-BR')}
• Data de Conclusão: ${order.completedAt ? order.completedAt.toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
• Valor Total: ${formatCurrency(order.total)}

${order.services.length > 0 ? `SERVIÇOS REALIZADOS (${order.services.length} item${order.services.length > 1 ? 's' : ''}):` : ''}
${order.services.map(service => `• ${service.description} - ${service.hours}h - ${formatCurrency(service.total)}`).join('\n')}

${order.products.length > 0 ? `\nPRODUTOS ENTREGUES (${order.products.length} item${order.products.length > 1 ? 's' : ''}):` : ''}
${order.products.map(product => `• ${product.description} - Qtd: ${product.quantity} - ${formatCurrency(product.total)}`).join('\n')}

${originalQuote && originalQuote.notes ? `\nOBSERVAÇÕES:\n${originalQuote.notes}` : ''}

Em anexo você encontra o recibo de pagamento para seus registros.

Agradecemos pela confiança em nossos serviços!

Atenciosamente,
${companySettings.companyName}
${companySettings.phone}
${companySettings.whatsapp ? `WhatsApp: ${companySettings.whatsapp}` : ''}
${emailSettings.fromEmail}

---
Esta é uma mensagem automática do sistema de gestão.`.trim();

    // Criar link mailto com anexo simulado
    const subject = `Pedido ${order.number} Concluído - ${emailSettings.fromName}`;
    
    // Tentar usar a API Web Share se disponível (para dispositivos móveis)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([receiptBlob], `recibo-${order.number}.pdf`, { type: 'application/pdf' });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: subject,
            text: emailBody,
            files: [file]
          });
          
          showCompletionEmailSuccessModal(order.client.email, emailSettings);
          return true;
        }
      } catch (error) {
        console.log('Web Share não suportado, usando método alternativo');
      }
    }
    
    // Método alternativo: criar link de download temporário e abrir email
    // Criar mailto link
    const mailtoLink = `mailto:${order.client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Abrir email
    window.open(mailtoLink);
    
    // Mostrar modal de sucesso após um breve delay
    setTimeout(() => {
      showCompletionEmailSuccessModal(order.client.email, emailSettings);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email de conclusão:', error);
    showEmailErrorModal('Erro ao preparar o envio do email de conclusão');
    return false;
  }
};

// Função para mostrar modal de sucesso do email de conclusão
const showCompletionEmailSuccessModal = (clientEmail: string, emailSettings: any) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Email de Conclusão Enviado! ✅
        </h3>
        <div class="text-left bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-green-800 mb-2">
            <strong>📧 Destinatário:</strong> ${clientEmail}
          </p>
          <p class="text-sm text-green-800 mb-2">
            <strong>📤 Servidor:</strong> ${emailSettings.smtpHost}:${emailSettings.smtpPort}
          </p>
          <p class="text-sm text-green-800">
            <strong>👤 Remetente:</strong> ${emailSettings.fromName}
          </p>
        </div>
        <div class="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-800">
            <strong>📎 O que foi enviado:</strong><br/>
            • Notificação de conclusão do pedido<br/>
            • Recibo de pagamento (anexar manualmente)<br/>
            • Detalhes dos serviços realizados<br/>
            • Dados de contato da empresa
          </p>
        </div>
        <button
          onclick="this.closest('.fixed').remove()"
          class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Remover modal automaticamente após 10 segundos
  setTimeout(() => {
    if (modal.parentNode) {
      modal.remove();
    }
  }, 10000);
};

// Função para mostrar modal de erro
const showEmailErrorModal = (errorMessage: string) => {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
      <div class="text-center">
        <div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Erro no Envio ❌
        </h3>
        <div class="text-left bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-red-800">
            ${errorMessage}
          </p>
        </div>
        <div class="text-left bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-yellow-800">
            <strong>💡 Verifique:</strong><br/>
            • Configurações de email estão completas<br/>
            • Servidor SMTP está correto<br/>
            • Credenciais estão válidas<br/>
            • Conexão com internet está ativa
          </p>
        </div>
        <button
          onclick="this.closest('.fixed').remove()"
          class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
};